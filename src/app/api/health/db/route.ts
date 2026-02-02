import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const [users, members, subs, payments] = await Promise.all([
      prisma.userSport.count(),
      prisma.memberSport.count(),
      prisma.subscriptionSport.count(),
      prisma.paymentSport.count(),
    ])
    const admin = await prisma.userSport.findUnique({ where: { email: 'admin@gym.local' }, select: { id: true, email: true, role: true } })
    return Response.json({ ok: true, users, members, subs, payments, admin })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'unknown-error' }, { status: 500 })
  }
}
