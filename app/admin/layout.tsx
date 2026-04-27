"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package,
  Truck,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  LayoutDashboard,
  ChevronRight,
  LogOut,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/proveedores", label: "Proveedores", icon: Truck },
  { href: "/admin/compras", label: "Compras", icon: ShoppingBag },
  { href: "/admin/ventas", label: "Ventas", icon: TrendingUp },
  { href: "/admin/alertas", label: "Alertas de Stock", icon: AlertTriangle },
]

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000 // 12 horas en ms
const LAST_UPDATE_KEY = "nexuscart-last-order-update"

async function runOrderUpdate() {
  try {
    const res = await fetch("/api/cron/update-orders")
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString())
      console.log("[NexusCart] Pedidos actualizados automáticamente:", data.message)
    }
  } catch (err) {
    console.error("[NexusCart] Error al actualizar pedidos:", err)
  }
}

async function doLogout() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
  window.location.href = "/login"
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Actualización automática de pedidos cada 12 horas
  useEffect(() => {
    // Verificar si han pasado 12+ horas desde la última actualización
    const lastUpdate = parseInt(localStorage.getItem(LAST_UPDATE_KEY) ?? "0", 10)
    const elapsed = Date.now() - lastUpdate

    if (elapsed >= TWELVE_HOURS_MS) {
      runOrderUpdate()
    }

    // Programar siguiente actualización en el tiempo restante
    const remaining = Math.max(TWELVE_HOURS_MS - elapsed, 0)
    const firstTimeout = setTimeout(() => {
      runOrderUpdate()
      // Después continuar cada 12 horas
    }, remaining)

    const interval = setInterval(() => {
      runOrderUpdate()
    }, TWELVE_HOURS_MS)

    return () => {
      clearTimeout(firstTimeout)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-sm fixed top-0 left-0 h-screen z-40 pt-16">
        <div className="p-6 flex flex-col h-full">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Panel de Control
            </span>
          </div>
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="ml-auto h-3 w-3 opacity-70" />}
                </Link>
              )
            })}
          </nav>

          {/* F2 – Logout */}
          <div className="pt-4 border-t border-border mt-2">
            <button
              onClick={doLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          )
        })}
        {/* Mobile logout */}
        <button
          onClick={doLogout}
          className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Salir</span>
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  )
}
