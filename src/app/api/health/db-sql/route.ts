import { NextResponse } from 'next/server'
import { getSql, pingDb } from '@/lib/db'
import type { FullQueryResults } from '@neondatabase/serverless'

export const runtime = 'edge'

type InfoRow = { db: string; now: string }

function isFullResults<T>(res: unknown): res is FullQueryResults<T> {
  return !!res && typeof res === 'object' && 'rows' in (res as any) && Array.isArray((res as any).rows)
}

export async function GET() {
  try {
    const ok = await pingDb()
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'PING_FAILED' }, { status: 500 })
    }
    const sql = getSql()
      const res = await sql<InfoRow>`select current_database() as db, now() as now`
      const rows: InfoRow[] = Array.isArray(res)
        ? res
        : isFullResults<InfoRow>(res)
        ? res.rows
        : []
      const [row] = rows
      return row
        ? NextResponse.json({ ok: true, info: row })
        : NextResponse.json({ ok: false, error: 'NO_ROWS' }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
