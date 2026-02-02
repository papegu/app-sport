"use client"
import React from "react"
import { SessionProvider } from "next-auth/react"
import Nav from "@/components/Nav"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </SessionProvider>
  )
}
