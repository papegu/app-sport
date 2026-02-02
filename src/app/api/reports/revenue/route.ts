import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'

function parseDate(s?: string | null): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const groupBy = (searchParams.get('groupBy') || 'day') as 'day' | 'month' | 'year'
    const startParam = parseDate(searchParams.get('start'))
    const endParam = parseDate(searchParams.get('end'))

    // Defaults: last 30 days for day, current year for month, lifetime for year
    const now = new Date()
    let start: Date
    if (startParam) start = startParam
    else if (groupBy === 'day') start = new Date(now.getTime() - 29 * 86400000)
    else if (groupBy === 'month') start = new Date(now.getFullYear(), 0, 1)
    else start = new Date(2000, 0, 1)
    const end = endParam ?? now

    const trunc = groupBy === 'day' ? 'day' : groupBy === 'month' ? 'month' : 'year'
    const rows = await prisma.$queryRawUnsafe<{
      period: Date
      total: string
    }[]>(
      `
      SELECT date_trunc($1, p."date") as period,
             SUM(p."amount")::text as total
      FROM "public"."PaymentSport" p
      WHERE p."isPaid" = true AND p."date" BETWEEN $2 AND $3
      GROUP BY 1
      ORDER BY 1 ASC
      `,
      trunc,
      start,
      end,
    )

    return Response.json({ ok: true, groupBy, start, end, rows })
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
