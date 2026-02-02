"use client"
import { useCallback, useMemo, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@gym.local')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<any | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const emailValid = useMemo(() => /.+@.+\..+/.test(email), [email])
  const passwordValid = useMemo(() => password.trim().length >= 6, [password])

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setDetails(null)

    // Basic client validations
    if (!emailValid) {
      setError("Email invalide. Exemple: admin@gym.local")
      return
    }
    if (!passwordValid) {
      setError("Mot de passe trop court (6+ caractères)")
      return
    }

    setSubmitting(true)
    try {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.ok) {
        router.push('/members')
        return
      }

      // Collect diagnostics to understand root cause
      const [versionRes, envRes, dbRes, debugRes] = await Promise.allSettled([
        fetch('/api/version').then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
        fetch('/api/health/env').then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
        fetch('/api/health/db').then(r => r.ok ? r.json() : Promise.reject(r.status)),
        fetch('/api/auth/debug', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(r => r.ok ? r.json() : r.json().catch(() => ({ ok:false, cause:'DEBUG_UNAVAILABLE' })))
      ])

      const diag: any = {
        signin: { ok: res?.ok ?? false, status: (res as any)?.status ?? null, error: (res as any)?.error ?? null },
        version: versionRes.status === 'fulfilled' ? versionRes.value : { error: (versionRes as any).reason ?? 'failed' },
        env: envRes.status === 'fulfilled' ? envRes.value : { error: (envRes as any).reason ?? 'failed' },
        db: dbRes.status === 'fulfilled' ? dbRes.value : { error: (dbRes as any).reason ?? 'failed' },
        debug: debugRes.status === 'fulfilled' ? debugRes.value : { error: (debugRes as any).reason ?? 'failed' },
      }

      setDetails(diag)
      const debugCause = diag?.debug?.cause
      if (debugCause === 'USER_NOT_FOUND') setError('Utilisateur introuvable')
      else if (debugCause === 'INVALID_PASSWORD') setError('Mot de passe incorrect')
      else if (debugCause === 'DB_ERROR') setError("Erreur de base de données")
      else if (debugCause === 'MISSING_ENV') setError("Configuration serveur incomplète")
      else setError('Identifiants invalides')
    } catch (err: any) {
      setError('Erreur inattendue lors de la connexion')
      setDetails({ error: String(err?.message || err) })
    } finally {
      setSubmitting(false)
    }
  }, [email, password, emailValid, passwordValid, router, submitting])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={onSubmit} className="bg-white shadow-lg p-8 rounded-lg w-full max-w-md space-y-5 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
        {error && <p className="text-red-700 text-base">{error}</p>}
        {!emailValid && <p className="text-amber-700 text-sm">Format d'email invalide</p>}
        {!passwordValid && <p className="text-amber-700 text-sm">Mot de passe: minimum 6 caractères</p>}
        <div>
          <label className="block text-lg mb-2 text-gray-900 font-semibold">Email</label>
          <input
            type="email"
            className="border border-gray-300 rounded-lg w-full p-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-gray-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@domaine.com"
            autoComplete="username"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-lg mb-2 text-gray-900 font-semibold">Mot de passe</label>
          <input
            type="password"
            className="border border-gray-300 rounded-lg w-full p-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-gray-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" disabled={submitting} className="bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white py-3 px-4 rounded-lg w-full text-lg font-bold">
          Se connecter
        </button>
        <div className="text-sm text-gray-700">
          Pas de compte ? <a className="text-primary-700 hover:underline" href="/signup">S'inscrire</a>
        </div>
        {details && (
          <details className="mt-2 text-xs text-gray-700 whitespace-pre-wrap break-words">
            <summary className="cursor-pointer select-none">Détails techniques</summary>
            <pre className="mt-2 p-2 bg-gray-50 border rounded max-h-64 overflow-auto">{JSON.stringify(details, null, 2)}</pre>
          </details>
        )}
      </form>
    </div>
  )
}
