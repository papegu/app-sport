import { neon, neonConfig } from '@neondatabase/serverless'
import type { FullQueryResults } from '@neondatabase/serverless'

// Ensure fetch connection caching for serverless/edge runtimes
neonConfig.fetchConnectionCache = true
// Ensure result rows are returned (not full results); types remain union at compile time
neonConfig.fullResults = false

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

function isFullResults<T>(res: unknown): res is FullQueryResults<T> {
  return !!res && typeof res === 'object' && 'rows' in (res as any) && Array.isArray((res as any).rows)
}

export async function pingDb() {
  const sql = getSql()
  // simple connectivity probe
  const res = await sql<{ ok: number }>`select 1 as ok`
  const rows: { ok: number }[] = Array.isArray(res)
    ? res
    : isFullResults<{ ok: number }>(res)
    ? res.rows
    : []
  const [row] = rows
  return !!row && Number(row.ok) === 1
}
