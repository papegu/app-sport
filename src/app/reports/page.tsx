import { prisma } from '@/lib/prisma'
import ExportButtons from './export-buttons'

export default async function ReportsPage() {
  const activeMembers = await prisma.memberSport.count({ where: { status: 'ACTIF' } })
  const newMembersMonth = await prisma.memberSport.count({
    where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
  })
  const revenueDay = await prisma.paymentSport.aggregate({
    _sum: { amount: true },
    where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
  })
  const revenueMonth = await prisma.paymentSport.aggregate({
    _sum: { amount: true },
    where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
  })
  const frequentation = await prisma.accessLogSport.count({
    where: { timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
  })

  const data = {
    activeMembers,
    newMembersMonth,
    revenueDay: revenueDay._sum.amount?.toString() ?? '0',
    revenueMonth: revenueMonth._sum.amount?.toString() ?? '0',
    frequentation,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Rapports & statistiques</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Membres actifs" value={activeMembers} accent="primary" />
        <Card title="Nouvelles inscriptions (mois)" value={newMembersMonth} accent="accent" />
        <Card title="Fréquentation (jour)" value={frequentation} accent="primary" />
        <Card title="CA (jour)" value={data.revenueDay} accent="accent" />
        <Card title="CA (mois)" value={data.revenueMonth} accent="primary" />
      </div>
      <ExportButtons data={data} />
    </div>
  )
}

function Card({ title, value, accent = 'primary' }: { title: string; value: any; accent?: 'primary' | 'accent' }) {
  const ring = accent === 'primary' ? 'ring-primary-200' : 'ring-accent-200'
  const bar = accent === 'primary' ? 'bg-primary-600' : 'bg-accent-600'
  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm ring-1 ${ring}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{title}</div>
        <span className={`h-1 w-8 rounded ${bar}`}></span>
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  )
}
