"use client"
import React from "react"
import { SessionProvider } from "next-auth/react"
import Sidebar from "@/components/admin/Sidebar"
import Topbar from "@/components/admin/Topbar"

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <SessionProvider>
      <div className="min-h-screen flex bg-background">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Topbar onMenuClick={() => setOpen(true)} />
          <main className="max-w-6xl mx-auto w-full px-4 py-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}
