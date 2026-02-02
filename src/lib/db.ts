import { neon, neonConfig } from '@neondatabase/serverless'
import type { FullQueryResults } from '@neondatabase/serverless'

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

function isFullResults(res: unknown): res is FullQueryResults<boolean> {
  return !!res && typeof res === 'object' && 'rows' in (res as any) && Array.isArray((res as any).rows)
}

export async function pingDb() {
  const sql = getSql()
  // simple connectivity probe
  const res = await sql`select 1 as ok`
  let ok = false
  if (Array.isArray(res)) {
    const first = res[0]
    if (Array.isArray(first)) {
      ok = Number(first[0]) === 1
    } else if (first && typeof first === 'object') {
      ok = Number((first as any).ok) === 1
    }
  } else if (isFullResults(res)) {
    const first = res.rows?.[0]
    ok = Array.isArray(first) ? Number(first[0]) === 1 : Number((first as any)?.ok) === 1
  }
  return ok
}
