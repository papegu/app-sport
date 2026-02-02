import { prisma } from '@/lib/prisma'
import { createCheckout } from '@/lib/paydunya'
export const runtime = 'nodejs'

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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const memberId = String(body.memberId || '')
    const type = String(body.type || 'MENSUEL') as 'SEANCE' | 'SEMAINE' | 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL'
    if (!memberId) return Response.json({ ok: false, error: 'Missing memberId' }, { status: 400 })

    const member = await prisma.memberSport.findUnique({ where: { id: memberId } })
    if (!member) return Response.json({ ok: false, error: 'Member not found' }, { status: 404 })

    const cfg = await prisma.priceConfigSport.findUnique({ where: { type } })
    const amount = String(cfg?.amount ?? (type === 'SEANCE' ? '5.00' : type === 'SEMAINE' ? '12.00' : type === 'MENSUEL' ? '30.00' : type === 'TRIMESTRIEL' ? '80.00' : '300.00'))
    const { start, end } = computeEndDate(type)
    const subscription = await prisma.subscriptionSport.create({
      data: { memberId, type, startDate: start, endDate: end, price: amount, status: 'SUSPENDU' },
    })
    const payment = await prisma.paymentSport.create({
      data: { memberId, subscriptionId: subscription.id, amount: amount, method: 'PAYDUNYA', isPaid: false },
    })
    const base = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || ''
    const returnUrl = `${base}/payments-status`
    const callbackUrl = `${base}/api/payments/callback`
    const checkout = await createCheckout({ amount, description: `Paiement ${type}`, sessionId: payment.id, returnUrl, callbackUrl })
    return Response.json({ ok: true, url: checkout.url, session: payment.id })
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
