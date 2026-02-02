import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
import { revalidatePath } from 'next/cache'
import QRCode from 'qrcode'

async function finalize(sessionId: string) {
  'use server'
  const payment = await prisma.paymentSport.findUnique({ where: { id: sessionId } })
  if (!payment) return { ok: false }
  // Mark payment paid and activate subscription + member
  await prisma.paymentSport.update({ where: { id: payment.id }, data: { isPaid: true, receiptNumber: `RC-${Date.now()}` } })
  if (payment.subscriptionId) {
    await prisma.subscriptionSport.update({ where: { id: payment.subscriptionId }, data: { status: 'ACTIF' } })
  }
  const member = await prisma.memberSport.update({ where: { id: payment.memberId }, data: { status: 'ACTIF' } })
  revalidatePath('/members')
  // Ensure a qrCode token exists
  const token = member.qrCode || `QR-${crypto.randomUUID()}`
  if (!member.qrCode) {
    await prisma.memberSport.update({ where: { id: member.id }, data: { qrCode: token } })
  }
  // Generate a QR image data URL
  const dataUrl = await QRCode.toDataURL(token, { width: 256, margin: 1 })
  return { ok: true, token, dataUrl }
}

export default async function PaymentStatusPage({ searchParams }: { searchParams?: Promise<{ status?: string; session?: string }> }) {
  const { status, session } = (await searchParams) || {}
  let qr: { token?: string; dataUrl?: string } = {}
  if (status === 'success' && session) {
    const res = await finalize(session)
    if (res.ok) qr = { token: res.token, dataUrl: res.dataUrl }
  }
  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Statut du paiement</h1>
      {status === 'success' ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">Paiement confirmé. Présentez ce QR code à l'entrée de la salle.</p>
          {qr.dataUrl ? (
            <img src={qr.dataUrl} alt="QR code" className="w-64 h-64 border rounded bg-white" />
          ) : (
            <p className="text-sm text-gray-700">QR code indisponible.</p>
          )}
          <p className="text-xs text-gray-600">Code: {qr.token}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-700">Paiement non effectué ou en attente.</p>
      )}
    </div>
  )
}
