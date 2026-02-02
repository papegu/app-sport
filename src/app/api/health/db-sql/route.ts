import { NextResponse } from 'next/server'
import { getSql, pingDb } from '@/lib/db'

export const runtime = 'edge'

export async function GET() {
  try {
    const ok = await pingDb()
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'PING_FAILED' }, { status: 500 })
    }
    const sql = getSql()
    const info = await sql`select current_database() as db, now() as now`
    return NextResponse.json({ ok: true, info: info?.[0] ?? null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
