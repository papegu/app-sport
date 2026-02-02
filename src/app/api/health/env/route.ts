export const runtime = 'nodejs'
export async function GET() {
  const hasDb = !!process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0
  const hasSecret = !!process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.trim().length > 0
  const url = process.env.NEXTAUTH_URL || null
  return Response.json({ ok: true, DATABASE_URL: hasDb, NEXTAUTH_SECRET: hasSecret, NEXTAUTH_URL: url })
}
