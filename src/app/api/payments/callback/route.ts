import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'
import QRCode from 'qrcode'

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
    let token: string | undefined
    let dataUrl: string | undefined
    if (status === 'success') {
      await prisma.paymentSport.update({ where: { id: payment.id }, data: { isPaid: true, receiptNumber: `RC-${Date.now()}` } })
      if (payment.subscriptionId) {
        await prisma.subscriptionSport.update({ where: { id: payment.subscriptionId }, data: { status: 'ACTIF' } })
      }
      const member = await prisma.memberSport.update({ where: { id: payment.memberId }, data: { status: 'ACTIF' } })
      token = member.qrCode || `QR-${crypto.randomUUID()}`
      if (!member.qrCode) {
        await prisma.memberSport.update({ where: { id: member.id }, data: { qrCode: token } })
      }
      dataUrl = await QRCode.toDataURL(token, { width: 256, margin: 1 })
    }
    return new Response(JSON.stringify({ ok: true, token, dataUrl }), { headers: { 'content-type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400 })
  }
}
