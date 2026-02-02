import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const [totalMembers, activeMembers, expiringSubs, revenueToday, recentMembers] = await Promise.all([
    prisma.memberSport.count(),
    prisma.memberSport.count({ where: { status: 'ACTIF' } }),
    prisma.subscriptionSport.count({
      where: {
        status: 'ACTIF',
        endDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.paymentSport.aggregate({
      _sum: { amount: true },
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(24, 0, 0, 0)),
        },
      },
    }),
    prisma.memberSport.findMany({ orderBy: { createdAt: 'desc' }, take: 12, select: { id: true, firstName: true, lastName: true, photoUrl: true } }),
  ])

  const yesterdayStart = new Date(new Date().setDate(new Date().getDate() - 1))
  yesterdayStart.setHours(0, 0, 0, 0)
  const yesterdayEnd = new Date(yesterdayStart)
  yesterdayEnd.setHours(24, 0, 0, 0)
  const revenueYesterday = await prisma.paymentSport.aggregate({
    _sum: { amount: true },
    where: { date: { gte: yesterdayStart, lt: yesterdayEnd } },
  })

  const sumToday = revenueToday._sum.amount ?? 0
  const sumYesterday = revenueYesterday._sum.amount ?? 0
  const deltaAbs = Number(sumToday) - Number(sumYesterday)
  const deltaPct = sumYesterday ? Math.round(((Number(sumToday) - Number(sumYesterday)) / Number(sumYesterday)) * 100) : null
  const deltaDir: 'up' | 'down' | 'flat' = deltaAbs > 0 ? 'up' : deltaAbs < 0 ? 'down' : 'flat'

  return (
    <div className="min-h-screen p-6 space-y-8 bg-amber-50">
      <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
      <p className="text-base text-gray-800 font-medium">Bonjour {session?.user?.name}</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Membres" value={totalMembers} subtitle="Total" accent="primary" />
        <KpiCard title="Actifs" value={activeMembers} subtitle="Membres actifs" accent="accent" />
        <KpiCard title="À expirer" value={expiringSubs} subtitle=">= 7 jours" accent="primary" />
        <KpiCard
          title="Revenus (aujourd'hui)"
          value={`${sumToday}`}
          subtitle="FCFA"
          accent="accent"
          delta={{ direction: deltaDir, absolute: deltaAbs, percent: deltaPct }}
        />
      </div>

      {/* Galerie des membres récents avec photos/avatars */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Nouveaux membres</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {recentMembers.map((m) => {
            const initials = `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase()
            return (
              <div key={m.id} className="flex flex-col items-center gap-2">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt={`${m.firstName} ${m.lastName}`} className="w-20 h-24 object-cover rounded-md border" />
                ) : (
                  <div className="w-20 h-24 rounded-md bg-primary-600 text-white flex items-center justify-center text-xl font-bold">
                    {initials || 'MB'}
                  </div>
                )}
                <div className="text-sm font-medium text-gray-900 text-center">
                  {m.lastName} {m.firstName}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, subtitle, accent, delta }: { title: string; value: any; subtitle: string; accent: 'primary' | 'accent'; delta?: { direction: 'up' | 'down' | 'flat'; absolute: number; percent: number | null } }) {
  const ring = accent === 'primary' ? 'ring-primary-200' : 'ring-accent-200'
  const bar = accent === 'primary' ? 'bg-primary-600' : 'bg-accent-600'
  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ring-1 ${ring}`}>
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-gray-900">{title}</div>
        <span className={`h-1 w-8 rounded ${bar}`}></span>
      </div>
      <div className="mt-2 text-3xl font-extrabold text-gray-900">{value}</div>
      <div className="mt-1 text-sm text-gray-700 font-medium">{subtitle}</div>
      {delta && (
        <div className="mt-2 text-sm">
          <span className={delta.direction === 'up' ? 'text-green-600' : delta.direction === 'down' ? 'text-red-600' : 'text-gray-500'}>
            {delta.direction === 'up' ? '▲' : delta.direction === 'down' ? '▼' : '—'} {Math.abs(delta.absolute)}
            {delta.percent !== null ? ` (${delta.percent}% vs hier)` : ''}
          </span>
        </div>
      )}
    </div>
  )
}
