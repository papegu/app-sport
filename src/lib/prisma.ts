import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { neon, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

function ensureSecureSSL(url: string): string {
  if (!url) return url
  // Remove libpq-only flags that break fetch-based drivers
  url = url.replace(/([?&])channel_binding=[^&#]*/i, '$1')
  // Normalize sslmode to verify-full
  if (url.includes('sslmode=')) {
    url = url.replace(/sslmode=(?:disable|allow|prefer|require|verify-ca|verify-full)/i, 'sslmode=verify-full')
  } else {
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}sslmode=verify-full`
  }
  // Clean any trailing ? or & left by removals
  url = url.replace(/[?&]$/,'')
  return url
}

function createPrisma(): PrismaClient {
  const rawUrl = (process.env.DIRECT_URL && process.env.DIRECT_URL.trim().length > 0)
    ? process.env.DIRECT_URL
    : process.env.DATABASE_URL
  if (!rawUrl || rawUrl.trim().length === 0) {
    throw new Error('DATABASE_URL/DIRECT_URL is not set')
  }
  const connectionString = ensureSecureSSL(rawUrl)
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL

  if (isProd) {
    // Use Neon fetch driver unless URL points to pooler host; then use pg Pool
    const isPooler = /pooler\./i.test(connectionString)
    if (isPooler) {
      const pool = new Pool({ connectionString })
      return new PrismaClient({
        adapter: new PrismaPg(pool),
        log: ['error', 'warn'],
      })
    } else {
      neonConfig.fetchConnectionCache = true
      const sql = neon(connectionString)
      return new PrismaClient({
        adapter: new PrismaNeon(sql as any) as any,
        log: ['error', 'warn'],
      })
    }
  } else {
    const pool = new Pool({ connectionString })
    return new PrismaClient({
      adapter: new PrismaPg(pool),
      log: ['query', 'info', 'warn', 'error'],
    })
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') {
  ;(globalForPrisma as any).prisma = prisma
}
