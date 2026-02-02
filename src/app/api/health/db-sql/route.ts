import { NextResponse } from 'next/server'
import { getSql, pingDb } from '@/lib/db'
import type { FullQueryResults } from '@neondatabase/serverless'

export const runtime = 'edge'

export async function GET() {
  try {
    const ok = await pingDb()
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'PING_FAILED' }, { status: 500 })
    }
    const sql = getSql()
    type InfoRow = { db: string; now: string }
    const res = await sql<InfoRow>`select current_database() as db, now() as now`
    const rows: InfoRow[] = Array.isArray(res) ? res : (res as FullQueryResults<InfoRow>).rows
    const [row] = rows
    return NextResponse.json({ ok: true, info: row ?? null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
