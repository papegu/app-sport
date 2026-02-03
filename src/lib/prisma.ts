import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { neon, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

function ensureSecureSSL(url: string): string {
  if (!url) return url
  if (url.includes('sslmode=')) {
    return url.replace(/sslmode=(?:disable|allow|prefer|require|verify-ca|verify-full)/i, 'sslmode=verify-full')
  }
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}sslmode=verify-full`
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
    neonConfig.fetchConnectionCache = true
    const sql = neon(connectionString)
    return new PrismaClient({
      adapter: new PrismaNeon(sql as any) as any,
      log: ['error', 'warn'],
    })
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
