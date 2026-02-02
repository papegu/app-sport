"use client"
import { useSession, signOut } from "next-auth/react"

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data } = useSession()
  const role = (data as any)?.role
  return (
    <header className="w-full border-b bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button aria-label="Menu" className="md:hidden text-gray-700 border rounded p-2" onClick={onMenuClick}>☰</button>
          <div className="text-sm text-gray-500">{role ? `Rôle: ${role}` : ""}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{data?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm border border-primary-200 text-primary-700 px-2 py-1 rounded hover:bg-primary-50">Déconnexion</button>
        </div>
      </div>
    </header>
  )
}
