import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { code } = await req.json()
  if (!code) return Response.json({ allowed: false, reason: 'QR invalide' }, { status: 400 })
  const member = await prisma.memberSport.findFirst({ where: { qrCode: code } })
  if (!member) return Response.json({ allowed: false, reason: 'Membre introuvable' }, { status: 404 })

  // Check active subscription
  const now = new Date()
  const activeSub = await prisma.subscriptionSport.findFirst({
    where: { memberId: member.id, status: 'ACTIF', startDate: { lte: now }, endDate: { gte: now } },
  })
  const allowed = !!activeSub && member.status === 'ACTIF'
  const reason = allowed ? 'OK' : 'Abonnement expiré ou membre inactif'

  await prisma.accessLogSport.create({ data: { memberId: member.id, allowed, reason: allowed ? 'OK' : reason } })
  return Response.json({ allowed, reason })
}
