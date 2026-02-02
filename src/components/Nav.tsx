"use client"
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'

export default function Nav() {
  const { data } = useSession()
  const role = (data as any)?.role

  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="https://ih1.redbubble.net/image.5026521516.1788/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.u2.jpg"
              alt="Logo Appli Sport"
              width={36}
              height={36}
              className="rounded-sm object-cover"
              priority
            />
            <span className="font-semibold text-primary-700">Appli Sport</span>
          </Link>
          <nav className="flex gap-3 text-sm">
            <Link href="/dashboard">Dashboard</Link>
            {(role === 'ADMIN' || role === 'ACCUEIL') && (
              <>
                <Link href="/members">Membres</Link>
                <Link href="/subscriptions">Abonnements</Link>
                <Link href="/payments">Paiements</Link>
                <Link href="/access-control">Accès</Link>
                <Link href="/classes">Cours</Link>
              </>
            )}
            {(role === 'ADMIN' || role === 'DIRECTION') && <Link href="/reports">Rapports</Link>}
            {role === 'ADMIN' && <Link href="/settings">Paramètres</Link>}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">{data?.user?.name} ({role})</span>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm border border-primary-200 text-primary-700 px-2 py-1 rounded hover:bg-primary-50">Déconnexion</button>
        </div>
      </div>
    </header>
  )
}
