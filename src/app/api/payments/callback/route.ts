import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sessionId = String(body.session || '')
    const status = String(body.status || '')
    if (!sessionId || !status) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing session or status' }), { status: 400 })
    }
    const payment = await prisma.paymentSport.findUnique({ where: { id: sessionId } })
    if (!payment) {
      return new Response(JSON.stringify({ ok: false, error: 'Payment not found' }), { status: 404 })
    }
    if (status === 'success') {
      await prisma.paymentSport.update({ where: { id: payment.id }, data: { isPaid: true, receiptNumber: `RC-${Date.now()}` } })
      if (payment.subscriptionId) {
        await prisma.subscriptionSport.update({ where: { id: payment.subscriptionId }, data: { status: 'ACTIF' } })
      }
      await prisma.memberSport.update({ where: { id: payment.memberId }, data: { status: 'ACTIF' } })
    }
    return new Response(JSON.stringify({ ok: true }))
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400 })
  }
}
