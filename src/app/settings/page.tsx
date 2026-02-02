import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  async function upsertPrices(formData: FormData) {
    'use server'
    const entries = [
      { type: 'SEANCE', amount: String(formData.get('SEANCE') || '') },
      { type: 'SEMAINE', amount: String(formData.get('SEMAINE') || '') },
      { type: 'MENSUEL', amount: String(formData.get('MENSUEL') || '') },
      { type: 'TRIMESTRIEL', amount: String(formData.get('TRIMESTRIEL') || '') },
      { type: 'ANNUEL', amount: String(formData.get('ANNUEL') || '') },
    ] as const
    for (const e of entries) {
      if (e.amount) {
        await prisma.priceConfigSport.upsert({
          where: { type: e.type },
          update: { amount: e.amount },
          create: { type: e.type, amount: e.amount },
        })
      }
    }
    revalidatePath('/settings')
  }
  const prices = await prisma.priceConfigSport.findMany()
  const byType = Object.fromEntries(prices.map((p) => [p.type, p.amount])) as Record<string, any>
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Paramètres</h1>
      <p className="text-sm text-gray-600">Réservé aux administrateurs.</p>

      <div className="rounded border bg-white p-4 space-y-3">
        <h2 className="font-medium">Prix des abonnements</h2>
        <form action={upsertPrices} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className="text-xs text-gray-600">Journalier (Séance)</label>
            <input name="SEANCE" defaultValue={byType['SEANCE'] ?? '5.00'} className="border rounded p-2 w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Hebdomadaire (Semaine)</label>
            <input name="SEMAINE" defaultValue={byType['SEMAINE'] ?? '12.00'} className="border rounded p-2 w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Mensuel</label>
            <input name="MENSUEL" defaultValue={byType['MENSUEL'] ?? '30.00'} className="border rounded p-2 w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Trimestriel</label>
            <input name="TRIMESTRIEL" defaultValue={byType['TRIMESTRIEL'] ?? '80.00'} className="border rounded p-2 w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Annuel</label>
            <input name="ANNUEL" defaultValue={byType['ANNUEL'] ?? '300.00'} className="border rounded p-2 w-full" />
          </div>
          <div className="md:col-span-4">
            <button className="bg-primary-600 hover:bg-primary-700 text-white rounded p-2">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  )
}
