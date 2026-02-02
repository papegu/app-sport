import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

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

async function startSignup(formData: FormData) {
  'use server'
  const firstName = String(formData.get('firstName') || '')
  const lastName = String(formData.get('lastName') || '')
  const phone = String(formData.get('phone') || '')
  const email = String(formData.get('email') || '')
  const address = String(formData.get('address') || '')
  const type = String(formData.get('type') || 'MENSUEL') as 'SEANCE' | 'SEMAINE' | 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL'
  if (!firstName || !lastName || !phone) return

  // Create or update member (remote signup default: CLIENT_ASSIDU, status EXPIRE until paid)
  const existing = await prisma.memberSport.findFirst({ where: { OR: [{ phone }, ...(email ? [{ email }] : [])] } })
  const member = existing
    ? await prisma.memberSport.update({
        where: { id: existing.id },
        data: { firstName, lastName, email: email || undefined, address: address || undefined, accountType: 'CLIENT_ASSIDU' },
      })
    : await prisma.memberSport.create({
        data: { firstName, lastName, phone, email: email || undefined, address: address || undefined, accountType: 'CLIENT_ASSIDU', qrCode: `QR-${crypto.randomUUID()}`, status: 'SUSPENDU' },
      })

  // Create a pending subscription with SUSPENDU until payment is completed
  const { start, end } = computeEndDate(type)
  const cfg = await prisma.priceConfigSport.findUnique({ where: { type } })
  const price = String(cfg?.amount ?? (type === 'SEANCE' ? '5.00' : type === 'SEMAINE' ? '12.00' : type === 'MENSUEL' ? '30.00' : type === 'TRIMESTRIEL' ? '80.00' : '300.00'))
  const subscription = await prisma.subscriptionSport.create({
    data: { memberId: member.id, type, startDate: start, endDate: end, price, status: 'SUSPENDU' },
  })

  // Create a payment intent (Wave), unpaid
  const payment = await prisma.paymentSport.create({
    data: { memberId: member.id, subscriptionId: subscription.id, amount: price, method: 'WAVE', isPaid: false },
  })

  revalidatePath('/payments-status')
  // Redirect to payment status page; in production, Wave callback would hit /api/payments/callback then redirect here
  redirect(`/payments-status?status=success&session=${payment.id}`)
}

export default function SignupPage() {
  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">S'inscrire à distance</h1>
      <p className="text-sm text-gray-700">Renseignez vos informations et choisissez votre option d'abonnement. Le paiement se fait via Wave.</p>
      <form action={startSignup} className="grid grid-cols-1 gap-3">
        <input name="firstName" placeholder="Prénom" className="border rounded p-2" required />
        <input name="lastName" placeholder="Nom" className="border rounded p-2" required />
        <input name="phone" placeholder="Téléphone" className="border rounded p-2" required />
        <input name="email" placeholder="Email" className="border rounded p-2" />
        <input name="address" placeholder="Adresse" className="border rounded p-2" />
        <select name="type" className="border rounded p-2">
          <option value="SEANCE">Journalier (Séance)</option>
          <option value="SEMAINE">Hebdomadaire (Semaine)</option>
          <option value="MENSUEL">Mensuel</option>
          <option value="TRIMESTRIEL">Trimestriel</option>
          <option value="ANNUEL">Annuel</option>
        </select>
        <button className="bg-primary-600 hover:bg-primary-700 text-white rounded p-2">Procéder au paiement</button>
      </form>
    </div>
  )
}
