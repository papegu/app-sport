import { NextResponse } from 'next/server'
import { getSql, pingDb } from '@/lib/db'
import type { FullQueryResults } from '@neondatabase/serverless'

export const runtime = 'edge'

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
    type RowsResult<T> = { rows: T[] }
    if (Array.isArray(res)) {
      row = (res as RowType[])[0]
    } else {
      row = (res as unknown as RowsResult<RowType>).rows[0]
    }
    return NextResponse.json({ ok: true, info: row ?? null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
