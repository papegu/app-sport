import { neon, neonConfig } from '@neondatabase/serverless'

// Ensure fetch connection caching for serverless/edge runtimes
neonConfig.fetchConnectionCache = true

function ensureVerifyFull(url: string): string {
  if (!url) return url
  const hasQuery = url.includes('?')
  const sslRegex = /([?&])sslmode=([^&#]*)/i
  if (sslRegex.test(url)) {
    return url.replace(sslRegex, (_m, sep) => `${sep}sslmode=verify-full`)
  }
  return `${url}${hasQuery ? '&' : '?'}sslmode=verify-full`
}

let sqlSingleton: ReturnType<typeof neon> | null = null

export function getSql() {
  if (sqlSingleton) return sqlSingleton
  const raw = process.env.DATABASE_URL
  if (!raw || raw.trim().length === 0) {
    throw new Error('DATABASE_URL is missing')
  }
  const connectionString = ensureVerifyFull(raw)
  sqlSingleton = neon(connectionString)
  return sqlSingleton
}

export async function pingDb() {
  const sql = getSql()
  // simple connectivity probe
  const rows = await sql`select 1 as ok`
  return rows?.[0]?.ok === 1
}
