import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, cause: 'MISSING_ENV' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({})) as { email?: string; password?: string }
    const email = (body.email || '').toString().trim()
    const password = (body.password || '').toString()

    if (!email || !password) {
      return NextResponse.json({ ok: false, cause: 'BAD_REQUEST' }, { status: 400 })
    }

    // Explicit connectivity probe, isolated from Prisma model lookups
    try {
      const pong = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`
      const first = pong?.[0]
      if (!first || Number(first.ok) !== 1) {
        return NextResponse.json({ ok: false, cause: 'DB_ERROR', message: 'Ping failed' }, { status: 500 })
      }
    } catch (e: any) {
      return NextResponse.json({ ok: false, cause: 'DB_ERROR', message: e?.message || String(e) }, { status: 500 })
    }

    // Check DB connectivity and user state explicitly
    const user = await prisma.userSport.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ ok: false, cause: 'USER_NOT_FOUND' }, { status: 404 })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return NextResponse.json({ ok: false, cause: 'INVALID_PASSWORD' }, { status: 401 })
    }

    return NextResponse.json({ ok: true, cause: 'OK', user: { id: user.id, email: user.email, role: user.role } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, cause: 'DB_ERROR', message: e?.message || String(e) }, { status: 500 })
  }
}
