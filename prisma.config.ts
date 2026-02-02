// Prisma 7 configuration: datasource URL in config (not schema)
// Load env vars and use pooled DATABASE_URL for CLI; shadow DB via DIRECT_URL
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    // Use direct connection for CLI operations to avoid pgbouncer limits
    url: env('DIRECT_URL'),
  },
})
