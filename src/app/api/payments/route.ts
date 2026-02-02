import { prisma } from '@/lib/prisma'

export async function GET() {
  const data = await prisma.paymentSport.findMany({
    include: { member: { select: { firstName: true, lastName: true } } },
    orderBy: { date: 'desc' },
  })
  return Response.json(
    data.map((p) => ({
      id: p.id,
      amount: p.amount.toString(),
      method: p.method,
      date: p.date,
      receiptNumber: p.receiptNumber,
      member: p.member,
    }))
  )
}
