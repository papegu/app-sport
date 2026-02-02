"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { href: "/members", label: "Dashboard" },
  { href: "/members", label: "Membres" },
  { href: "/subscriptions", label: "Abonnements" },
  { href: "/payments", label: "Paiements" },
  { href: "/classes", label: "Cours" },
  { href: "/access-control", label: "Accès" },
  { href: "/reports", label: "Rapports" },
  { href: "/admin", label: "Admin" },
  { href: "/settings", label: "Paramètres" },
]

export default function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const NavList = (
    <nav className="flex-1 px-2 py-3 space-y-1">
      {items.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded text-sm ${active ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50"}`}
            onClick={onClose}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 border-r bg-white">
        <div className="px-4 py-4 border-b">
          <Link href="/members" className="text-xl font-bold text-primary-700">Appli Sport</Link>
        </div>
        {NavList}
      </aside>
      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white border-r shadow flex flex-col">
            <div className="px-4 py-4 border-b flex items-center justify-between">
              <Link href="/members" className="text-lg font-bold text-primary-700" onClick={onClose}>Appli Sport</Link>
              <button aria-label="Fermer" className="text-gray-600" onClick={onClose}>✕</button>
            </div>
            {NavList}
          </aside>
        </div>
      )}
    </>
  )
}
