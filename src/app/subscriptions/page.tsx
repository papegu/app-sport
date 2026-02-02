import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
import { revalidatePath } from 'next/cache'

async function getData() {
  const members = await prisma.memberSport.findMany({ select: { id: true, firstName: true, lastName: true } })
  const subs = await prisma.subscriptionSport.findMany({ include: { member: true }, orderBy: { createdAt: 'desc' } })
  return { members, subs }
}

async function createSubscription(formData: FormData) {
  'use server'
  const memberId = String(formData.get('memberId') || '')
  const type = String(formData.get('type') || 'MENSUEL') as 'SEANCE' | 'SEMAINE' | 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL'
  const start = new Date()
  const end = new Date(start)
  if (type === 'SEMAINE') end.setDate(end.getDate() + 7)
  else if (type === 'MENSUEL') end.setMonth(end.getMonth() + 1)
  else if (type === 'TRIMESTRIEL') end.setMonth(end.getMonth() + 3)
  else if (type === 'ANNUEL') end.setFullYear(end.getFullYear() + 1)
  else end.setDate(end.getDate() + 1)
  await prisma.subscriptionSport.create({
    data: {
      memberId,
      type,
      startDate: start,
      endDate: end,
      price: '25000',
    },
  })
  revalidatePath('/subscriptions')
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
  const { members, subs } = await getData()
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Abonnements</h1>
      <form action={createSubscription} className="flex gap-2">
        <select name="memberId" className="border p-2 rounded" required>
          <option value="">Membre</option>
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
        <button className="bg-primary-600 hover:bg-primary-700 text-white rounded px-4">Créer</button>
      </form>

      <table className="w-full text-sm bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Membre</th>
            <th className="p-2">Type</th>
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
  )
}
