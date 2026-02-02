import { NextRequest } from 'next/server'
import { withAuth } from 'next-auth/middleware'

const roleAccess: Record<string, Array<'ADMIN' | 'ACCUEIL' | 'DIRECTION'>> = {
  '/dashboard': ['ADMIN', 'ACCUEIL', 'DIRECTION'],
  '/members': ['ADMIN', 'ACCUEIL'],
  '/subscriptions': ['ADMIN', 'ACCUEIL'],
  '/payments': ['ADMIN', 'ACCUEIL'],
  '/access-control': ['ADMIN', 'ACCUEIL'],
  '/classes': ['ADMIN', 'ACCUEIL'],
  '/reports': ['ADMIN', 'DIRECTION'],
  '/settings': ['ADMIN'],
  '/admin': ['ADMIN'],
}

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token) return false
      const { pathname } = (req as NextRequest).nextUrl
      const base = '/' + pathname.split('/')[1]
      const allowed = roleAccess[base]
      if (!allowed) return true // allow if no specific mapping
      return !!token.role && allowed.includes(token.role as any)
    },
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/members/:path*',
    '/subscriptions/:path*',
    '/payments/:path*',
    '/access-control/:path*',
    '/classes/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
}
