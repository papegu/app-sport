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
    const res = await sql`select current_database() as db, now() as now`
    let info: InfoRow | null = null
    if (Array.isArray(res)) {
      const first = res[0]
      if (Array.isArray(first)) {
        info = { db: String(first[0]), now: String(first[1]) }
      } else if (first && typeof first === 'object') {
        const obj = first as any
        info = { db: String(obj.db), now: String(obj.now) }
      }
    } else if (isFullResults(res)) {
      const first = res.rows?.[0]
      if (Array.isArray(first)) {
        info = { db: String(first[0]), now: String(first[1]) }
      } else if (first && typeof first === 'object') {
        info = { db: String((first as any).db), now: String((first as any).now) }
      }
    }
    return info
      ? NextResponse.json({ ok: true, info })
      : NextResponse.json({ ok: false, error: 'NO_ROWS' }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
