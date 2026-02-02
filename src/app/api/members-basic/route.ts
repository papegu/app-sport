import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'

export async function GET() {
  const members = await prisma.memberSport.findMany({ select: { id: true, firstName: true, lastName: true, qrCode: true }, orderBy: { createdAt: 'desc' } })
  return Response.json(members)
}
