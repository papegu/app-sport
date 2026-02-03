import { NextResponse } from 'next/server'
import { getSql, pingDb } from '@/lib/db'
import type { FullQueryResults } from '@neondatabase/serverless'

export const runtime = 'nodejs'

type InfoRow = { db: string; now: string }

function isFullResults(res: unknown): res is FullQueryResults<boolean> {
  return !!res && typeof res === 'object' && 'rows' in (res as any) && Array.isArray((res as any).rows)
}

export async function GET() {
  try {
    const ok = await pingDb()
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'PING_FAILED' }, { status: 500 })
    }
    const sql = getSql()
    type RowType = { db: string; now: string }
    const res = await sql`select current_database() as db, now() as now`

    let row: RowType | undefined
    if (Array.isArray(res)) {
      const first = (res as RowType[])[0]
      row = first ? { db: String(first.db), now: String(first.now) } : undefined
    } else if (isFullResults(res)) {
      const first = (res.rows as unknown as RowType[])[0]
      row = first ? { db: String(first.db), now: String(first.now) } : undefined
    }

    return NextResponse.json({ ok: true, info: row ?? null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
