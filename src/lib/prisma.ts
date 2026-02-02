import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

// Ensure secure SSL mode explicitly to avoid pg alias warning
function ensureSecureSSL(url?: string) {
  if (!url) return url
  const hasParam = url.includes('sslmode=')
  if (!hasParam) {
    return url + (url.includes('?') ? '&' : '?') + 'sslmode=verify-full'
  }
  return url.replace(/sslmode=(prefer|require|verify-ca)/i, 'sslmode=verify-full')
}

const rawConn = process.env.DATABASE_URL || process.env.DIRECT_URL
const connectionString = ensureSecureSSL(rawConn)
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['error', 'warn']
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
