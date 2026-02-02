import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
import { revalidatePath } from 'next/cache'

function computeEndDate(type: 'SEANCE' | 'SEMAINE' | 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL') {
  const now = new Date()
  const end = new Date(now)
  switch (type) {
    case 'SEANCE':
      end.setDate(end.getDate() + 1)
      break
    case 'SEMAINE':
      end.setDate(end.getDate() + 7)
      break
    case 'MENSUEL':
      end.setMonth(end.getMonth() + 1)
      break
    case 'TRIMESTRIEL':
      end.setMonth(end.getMonth() + 3)
      break
    case 'ANNUEL':
      end.setFullYear(end.getFullYear() + 1)
      break
  }
  return { start: now, end }
}

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const member = await prisma.memberSport.findUnique({
    where: { id: params.id },
    include: { subscriptions: true, payments: true },
  })

  if (!member) {
    return <div className="p-4">Membre introuvable.</div>
  }
  const memberId = member.id

  async function addOrRenewSubscription(formData: FormData) {
    'use server'
    const type = String(formData.get('type') || '') as 'SEANCE' | 'SEMAINE' | 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL'
    if (!type) return
    const cfg = await prisma.priceConfigSport.findUnique({ where: { type } })
    const price = String(formData.get('price') || cfg?.amount || '0.00')
    const { start, end } = computeEndDate(type)
    await prisma.subscriptionSport.create({
      data: { memberId: memberId, type, startDate: start, endDate: end, price },
    })
    revalidatePath(`/members/${memberId}`)
  }

  async function addPayment(formData: FormData) {
    'use server'
    const amountStr = String(formData.get('amount') || '')
    const subscriptionId = String(formData.get('subscriptionId') || '') || undefined
    if (!amountStr) return
    await prisma.paymentSport.create({
      data: {
        memberId: memberId,
        subscriptionId: subscriptionId || undefined,
        amount: amountStr,
        method: 'WAVE',
      },
    })
    revalidatePath(`/members/${memberId}`)
  }

  async function quickPayment(type: 'SEANCE' | 'SEMAINE' | 'MENSUEL' | 'ANNUEL') {
    'use server'
    const cfg = await prisma.priceConfigSport.findUnique({ where: { type } })
    const d = { amount: String(cfg?.amount ?? (type === 'SEANCE' ? '5.00' : type === 'SEMAINE' ? '12.00' : type === 'MENSUEL' ? '30.00' : '300.00')), method: 'WAVE' as const }
    await prisma.paymentSport.create({
      data: { memberId: memberId, amount: d.amount, method: d.method },
    })
    revalidatePath(`/members/${memberId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {member.photoUrl ? (
          <img src={member.photoUrl} alt={`${member.firstName} ${member.lastName}`} className="w-24 h-32 object-cover rounded-md" />
        ) : (
          <div className="w-24 h-32 bg-gray-200 rounded-md" />
        )}
        <div>
          <h1 className="text-xl font-semibold">
            {member.lastName} {member.firstName}
          </h1>
          <p className="text-sm text-gray-700">{member.phone}</p>
          {member.email && <p className="text-sm text-gray-700">{member.email}</p>}
          {member.address && <p className="text-sm text-gray-700">{member.address}</p>}
        </div>
      </div>

      {/* Choisir une option de paiement rapide (clic sur photo / ici dédié) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <form action={quickPayment.bind(null, 'SEANCE')}>
          <button className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded p-2">Paiement journalier</button>
        </form>
        <form action={quickPayment.bind(null, 'SEMAINE')}>
          <button className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded p-2">Paiement hebdomadaire</button>
        </form>
        <form action={quickPayment.bind(null, 'MENSUEL')}>
          <button className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded p-2">Paiement mensuel</button>
        </form>
        <form action={quickPayment.bind(null, 'ANNUEL')}>
          <button className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded p-2">Paiement annuel</button>
        </form>
      </div>

      {/* Gestion abonnement */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-medium mb-2">Abonnement</h2>
        <form action={addOrRenewSubscription} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select name="type" className="border rounded p-2" required>
            <option value="SEANCE">Journalier (Séance)</option>
            <option value="SEMAINE">Hebdomadaire (Semaine)</option>
            <option value="MENSUEL">Mensuel</option>
            <option value="TRIMESTRIEL">Trimestriel</option>
            <option value="ANNUEL">Annuel</option>
          </select>
          <input name="price" placeholder="Prix" className="border rounded p-2" />
          <button className="bg-primary-600 hover:bg-primary-700 text-white rounded p-2">Créer/Renouveler</button>
        </form>
        <div className="mt-3 text-sm">
          {member.subscriptions.length === 0 ? (
            <p className="text-gray-600">Aucun abonnement.</p>
          ) : (
            <ul className="space-y-1">
              {member.subscriptions.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>
                    {s.type} — du {new Date(s.startDate).toLocaleDateString()} au {new Date(s.endDate).toLocaleDateString()} — {s.price.toString()} 
                  </span>
                  <span className="text-xs text-gray-500">{s.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Paiements */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-medium mb-2">Paiements</h2>
        <form action={addPayment} className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input name="amount" placeholder="Montant" className="border rounded p-2" required />
          <div className="p-2 text-sm text-gray-700">Méthode: Wave</div>
          <select name="subscriptionId" className="border rounded p-2">
            <option value="">(optionnel) Lier à un abonnement</option>
            {member.subscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.type} ({new Date(s.startDate).toLocaleDateString()} → {new Date(s.endDate).toLocaleDateString()})
              </option>
            ))}
          </select>
          <button className="bg-primary-600 hover:bg-primary-700 text-white rounded p-2">Ajouter</button>
        </form>
        <div className="mt-3 text-sm">
          {member.payments.length === 0 ? (
            <p className="text-gray-600">Aucun paiement.</p>
          ) : (
            <ul className="space-y-1">
              {member.payments.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>
                    {p.amount.toString()} — {p.method} — {new Date(p.date).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">{p.isPaid ? 'Payé' : 'À payer'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}