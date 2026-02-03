import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createCheckout } from '@/lib/paydunya'

type SubType = 'SEANCE' | 'SEMAINE' | 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL'

function computeEndDate(type: SubType) {
  const start = new Date()
  const end = new Date(start)
  if (type === 'SEMAINE') end.setDate(end.getDate() + 7)
  else if (type === 'MENSUEL') end.setMonth(end.getMonth() + 1)
  else if (type === 'TRIMESTRIEL') end.setMonth(end.getMonth() + 3)
  else if (type === 'ANNUEL') end.setFullYear(end.getFullYear() + 1)
  else end.setDate(end.getDate() + 1)
  return { start, end }
}

async function getData() {
  const members = await prisma.memberSport.findMany({ select: { id: true, firstName: true, lastName: true } })
  const subs = await prisma.subscriptionSport.findMany({ include: { member: true, payments: true }, orderBy: { createdAt: 'desc' } })
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  const present = await prisma.accessLogSport.findMany({
    where: { allowed: true, timestamp: { gte: since } },
    include: { member: true },
    orderBy: { timestamp: 'desc' },
  })
  const stats = {
    totalActive: subs.filter((s) => s.status === 'ACTIF').length,
    remoteActive: subs.filter((s) => s.status === 'ACTIF' && s.source === 'REMOTE').length,
    cashierActive: subs.filter((s) => s.status === 'ACTIF' && s.source === 'CASHIER').length,
    byType: {
      SEANCE: subs.filter((s) => s.status === 'ACTIF' && s.type === 'SEANCE').length,
      SEMAINE: subs.filter((s) => s.status === 'ACTIF' && s.type === 'SEMAINE').length,
      MENSUEL: subs.filter((s) => s.status === 'ACTIF' && s.type === 'MENSUEL').length,
      TRIMESTRIEL: subs.filter((s) => s.status === 'ACTIF' && s.type === 'TRIMESTRIEL').length,
      ANNUEL: subs.filter((s) => s.status === 'ACTIF' && s.type === 'ANNUEL').length,
    },
  }
  return { members, subs, present, stats }
}

async function createCashierPaydunya(formData: FormData) {
  'use server'
  const memberId = String(formData.get('memberId') || '')
  const type = String(formData.get('type') || 'MENSUEL') as SubType
  if (!memberId) return
  const cfg = await prisma.priceConfigSport.findUnique({ where: { type } })
  const amount = String(
    cfg?.amount ?? (type === 'SEANCE' ? '5.00' : type === 'SEMAINE' ? '12.00' : type === 'MENSUEL' ? '30.00' : type === 'TRIMESTRIEL' ? '80.00' : '300.00')
  )
  const { start, end } = computeEndDate(type)
  const subscription = await prisma.subscriptionSport.create({
    data: { memberId, type, source: 'CASHIER', startDate: start, endDate: end, price: amount, status: 'SUSPENDU' },
  })
  const payment = await prisma.paymentSport.create({
    data: { memberId, subscriptionId: subscription.id, amount: amount, method: 'PAYDUNYA', isPaid: false },
  })
  const base = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || ''
  const returnUrl = `${base}/payments-status`
  const callbackUrl = `${base}/api/payments/callback`
  const checkout = await createCheckout({ amount, description: `Paiement ${type}`, sessionId: payment.id, returnUrl, callbackUrl })
  redirect(checkout.url)
}

async function createRemoteSubscription(formData: FormData) {
  'use server'
  const firstName = String(formData.get('firstName') || '')
  const lastName = String(formData.get('lastName') || '')
  const phone = String(formData.get('phone') || '')
  const email = String(formData.get('email') || '')
  const type = String(formData.get('type') || 'MENSUEL') as SubType
  if (!firstName || !lastName || !phone) return
  const token = `QR-${crypto.randomUUID()}`
  const member = await prisma.memberSport.create({
    data: { firstName, lastName, phone, email: email || null, status: 'SUSPENDU', accountType: 'USER_SIMPLE', qrCode: token },
  })
  const cfg = await prisma.priceConfigSport.findUnique({ where: { type } })
  const amount = String(
    cfg?.amount ?? (type === 'SEANCE' ? '5.00' : type === 'SEMAINE' ? '12.00' : type === 'MENSUEL' ? '30.00' : type === 'TRIMESTRIEL' ? '80.00' : '300.00')
  )
  const { start, end } = computeEndDate(type)
  const subscription = await prisma.subscriptionSport.create({
    data: { memberId: member.id, type, source: 'REMOTE', startDate: start, endDate: end, price: amount, status: 'SUSPENDU' },
  })
  const payment = await prisma.paymentSport.create({
    data: { memberId: member.id, subscriptionId: subscription.id, amount: amount, method: 'PAYDUNYA', isPaid: false },
  })
  const base = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || ''
  const returnUrl = `${base}/payments-status`
  const callbackUrl = `${base}/api/payments/callback`
  const checkout = await createCheckout({ amount, description: `Paiement ${type}`, sessionId: payment.id, returnUrl, callbackUrl })
  redirect(checkout.url)
}

async function renew(id: string) {
  'use server'
  const sub = await prisma.subscriptionSport.findUnique({ where: { id } })
  if (!sub) return
  const start = new Date()
  const end = new Date(start)
  if (sub.type === 'MENSUEL') end.setMonth(end.getMonth() + 1)
  else if (sub.type === 'TRIMESTRIEL') end.setMonth(end.getMonth() + 3)
  else if (sub.type === 'ANNUEL') end.setFullYear(end.getFullYear() + 1)
  else end.setDate(end.getDate() + 1)
  await prisma.subscriptionSport.update({
    where: { id },
    data: { startDate: start, endDate: end, status: 'ACTIF' },
  })
  revalidatePath('/subscriptions')
}

export default async function SubscriptionsPage() {
  const { members, subs, present, stats } = await getData()
  const remoteActifs = subs.filter((s) => s.status === 'ACTIF' && s.source === 'REMOTE')
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-primary-700">Abonnements</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
          <h2 className="text-lg font-semibold text-primary-800">Abonnement à distance (PayDunya)</h2>
          <p className="text-sm text-primary-700 mb-3">Le client remplit ses informations et paie en ligne.</p>
          <form action={createRemoteSubscription} className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input name="lastName" placeholder="Nom" className="border p-2 rounded" required />
              <input name="firstName" placeholder="Prénom" className="border p-2 rounded" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input name="phone" placeholder="Téléphone" className="border p-2 rounded" required />
              <input name="email" placeholder="Email (optionnel)" className="border p-2 rounded" />
            </div>
            <div className="flex gap-2">
              <select name="type" className="border p-2 rounded">
                <option value="SEMAINE">Hebdomadaire</option>
                <option value="MENSUEL">Mensuel</option>
                <option value="TRIMESTRIEL">Trimestriel</option>
                <option value="ANNUEL">Annuel</option>
                <option value="SEANCE">Pass séance</option>
              </select>
              <button className="bg-accent-600 hover:bg-accent-700 text-white rounded px-4">Payer via PayDunya</button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-highlight-200 bg-highlight-50 p-4">
          <h2 className="text-lg font-semibold text-highlight-800">Abonnement en caisse (PayDunya)</h2>
          <p className="text-sm text-highlight-700 mb-3">Géré par l'administrateur devant la caissière.</p>
          <form action={createCashierPaydunya} className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select name="memberId" className="border p-2 rounded" required>
                <option value="">Sélectionner un membre</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.lastName} {m.firstName}
                  </option>
                ))}
              </select>
              <select name="type" className="border p-2 rounded">
                <option value="SEMAINE">Hebdomadaire</option>
                <option value="MENSUEL">Mensuel</option>
                <option value="TRIMESTRIEL">Trimestriel</option>
                <option value="ANNUEL">Annuel</option>
                <option value="SEANCE">Pass séance</option>
              </select>
            </div>
            <button className="bg-primary-600 hover:bg-primary-700 text-white rounded px-4">Encaisser via PayDunya</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-semibold text-primary-800">Présents en salle (aujourd'hui)</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {present.map((a) => (
              <li key={a.id} className="flex justify-between">
                <span>{a.member.lastName} {a.member.firstName}</span>
                <span className="text-gray-600">{new Date(a.timestamp).toLocaleTimeString()}</span>
              </li>
            ))}
            {present.length === 0 && <li className="text-gray-600">Aucun membre présent.</li>}
          </ul>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-semibold text-accent-800">Abonnés à distance (actifs)</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {remoteActifs.map((s) => (
              <li key={s.id} className="flex justify-between">
                <span>{s.member.lastName} {s.member.firstName}</span>
                <span className="text-gray-600">{new Date(s.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
            {remoteActifs.length === 0 && <li className="text-gray-600">Aucun abonnement à distance actif.</li>}
          </ul>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-semibold text-highlight-800">Statistiques</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded bg-primary-50 border border-primary-200">
              <div className="text-xs text-primary-700">Actifs</div>
              <div className="text-lg font-bold text-primary-800">{stats.totalActive}</div>
            </div>
            <div className="p-2 rounded bg-accent-50 border border-accent-200">
              <div className="text-xs text-accent-700">Distance</div>
              <div className="text-lg font-bold text-accent-800">{stats.remoteActive}</div>
            </div>
            <div className="p-2 rounded bg-highlight-50 border border-highlight-200">
              <div className="text-xs text-highlight-700">Caisse</div>
              <div className="text-lg font-bold text-highlight-800">{stats.cashierActive}</div>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div className="text-xs text-gray-700">Séance: {stats.byType.SEANCE}</div>
              <div className="text-xs text-gray-700">Hebdo: {stats.byType.SEMAINE}</div>
              <div className="text-xs text-gray-700">Mensuel: {stats.byType.MENSUEL}</div>
              <div className="text-xs text-gray-700">Trimestriel: {stats.byType.TRIMESTRIEL}</div>
              <div className="text-xs text-gray-700">Annuel: {stats.byType.ANNUEL}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-primary-800">Toutes les souscriptions</h2>
        <table className="w-full text-sm bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Membre</th>
              <th className="p-2">Type</th>
              <th className="p-2">Origine</th>
              <th className="p-2">Début</th>
              <th className="p-2">Fin</th>
              <th className="p-2">Statut</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.member.lastName} {s.member.firstName}</td>
                <td className="p-2">{s.type}</td>
                <td className="p-2">{s.source === 'REMOTE' ? 'Distance' : 'Caisse'}</td>
                <td className="p-2">{new Date(s.startDate).toLocaleDateString()}</td>
                <td className="p-2">{new Date(s.endDate).toLocaleDateString()}</td>
                <td className="p-2">{s.status}</td>
                <td className="p-2">
                  <form action={renew.bind(null, s.id)}>
                    <button className="border border-primary-200 text-primary-700 hover:bg-primary-50 px-2 py-1 rounded">Renouveler</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
