// Prisma 7 configuration: datasource URL in config (not schema)
// Load env vars and use pooled DATABASE_URL for CLI; shadow DB via DIRECT_URL
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

function ensureVerifyFull(url: string): string {
  if (!url) return url
  const hasQuery = url.includes('?')
  const sslRegex = /([?&])sslmode=([^&#]*)/i
  if (sslRegex.test(url)) {
    return url.replace(sslRegex, (_m, sep) => `${sep}sslmode=verify-full`)
  }
  return `${url}${hasQuery ? '&' : '?'}sslmode=verify-full`
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    // Prefer DIRECT_URL if set, else fall back to pooled DATABASE_URL
    // This avoids failing builds when DIRECT_URL isn't configured in CI/Vercel.
    url: ensureVerifyFull(
      (process.env.DIRECT_URL && process.env.DIRECT_URL.trim())
        ? process.env.DIRECT_URL
        : (process.env.DATABASE_URL && process.env.DATABASE_URL.trim())
        ? process.env.DATABASE_URL
        : 'postgresql://localhost/neondb?sslmode=verify-full'
    ),
  },
})
