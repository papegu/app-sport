import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

async function getCounts() {
  const [users, members, subs, payments, classes, accessLogs, attendances, notifications] = await Promise.all([
    prisma.userSport.count(),
    prisma.memberSport.count(),
    prisma.subscriptionSport.count(),
    prisma.paymentSport.count(),
    prisma.classSport.count(),
    prisma.accessLogSport.count(),
    prisma.attendanceSport.count(),
    prisma.notificationSport.count(),
  ])
  return { users, members, subs, payments, classes, accessLogs, attendances, notifications }
}

export default async function AdminPage() {
  const c = await getCounts()
  const cards = [
    { label: 'Utilisateurs', count: c.users, href: '/settings' },
    { label: 'Membres', count: c.members, href: '/members' },
    { label: 'Abonnements', count: c.subs, href: '/subscriptions' },
    { label: 'Paiements', count: c.payments, href: '/payments' },
    { label: 'Cours', count: c.classes, href: '/classes' },
    { label: 'Accès', count: c.accessLogs, href: '/access-control' },
    { label: 'Présences', count: c.attendances, href: '/classes' },
    { label: 'Notifications', count: c.notifications, href: '/reports' },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Admin</h1>
      <p className="text-sm text-gray-600">Accès complet aux objets et opérations CRUD.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <a key={card.label} href={card.href} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition">
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="text-2xl font-semibold text-gray-900">{card.count}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
