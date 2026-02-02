"use client"
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@gym.local')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.ok) {
      router.push('/dashboard')
    } else {
      setError('Identifiants invalides')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={onSubmit} className="bg-white shadow-lg p-8 rounded-lg w-full max-w-md space-y-5 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
        {error && <p className="text-red-700 text-base">{error}</p>}
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
        <button type="submit" className="bg-primary-700 hover:bg-primary-800 text-white py-3 px-4 rounded-lg w-full text-lg font-bold">
          Se connecter
        </button>
        <div className="text-sm text-gray-700">
          Pas de compte ? <a className="text-primary-700 hover:underline" href="/signup">S'inscrire</a>
        </div>
      </form>
    </div>
  )
}
