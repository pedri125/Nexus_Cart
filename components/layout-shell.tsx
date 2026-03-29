"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdmin && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isAdmin && <Footer />}
    </div>
  )
}
