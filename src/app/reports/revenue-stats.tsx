"use client"
import { useEffect, useState } from 'react'

type Row = { period: string; total: string }

export default function RevenueStats() {
  const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('day')
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('groupBy', groupBy)
      if (start) params.set('start', start)
      if (end) params.set('end', end)
      const res = await fetch(`/api/reports/revenue?${params.toString()}`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Erreur inconnue')
      const formatted: Row[] = json.rows.map((r: any) => ({
        period: new Date(r.period).toLocaleDateString(),
        total: r.total,
      }))
      setRows(formatted)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy])

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm ring-1 ring-primary-200">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-xs text-gray-600">Grouper par</div>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="border rounded p-2">
            <option value="day">Jour</option>
            <option value="month">Mois</option>
            <option value="year">Année</option>
          </select>
        </div>
        <div>
          <div className="text-xs text-gray-600">Début</div>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="border rounded p-2" />
        </div>
        <div>
          <div className="text-xs text-gray-600">Fin</div>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="border rounded p-2" />
        </div>
        <button onClick={load} className="bg-accent-600 hover:bg-accent-700 text-white rounded p-2">Actualiser</button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-gray-600">Chargement…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-600">Aucune donnée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[400px] text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-1 pr-4">Période</th>
                  <th className="py-1">Montant</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 pr-4">{r.period}</td>
                    <td className="py-1 font-medium">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
