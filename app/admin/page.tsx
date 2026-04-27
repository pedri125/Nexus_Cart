"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import {
  Package,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Truck,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { formatCOP } from "@/lib/constants"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function StatCard({ title, value, description, icon: Icon, color = "text-primary" }: {
  title: string; value: string; description: string; icon: React.ElementType; color?: string
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-full p-2 bg-primary/10`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const { user, isHydrated, setUser } = useAuthStore()
  const { data: authData, isLoading: authLoading } = useSWR("/api/auth/me", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })
  const { data: products } = useSWR("/api/admin/products", fetcher)
  const { data: suppliers } = useSWR("/api/admin/suppliers", fetcher)
  const { data: purchases } = useSWR("/api/admin/purchases", fetcher)
  const { data: sales } = useSWR("/api/admin/sales", fetcher)
  const { data: alerts } = useSWR("/api/admin/alerts", fetcher)

  // Sync auth data to store when received
  useEffect(() => {
    if (authData?.user) setUser(authData.user)
  }, [authData, setUser])

  // Non-admin users are sent away (middleware already blocks, this is a safety net)
  useEffect(() => {
    if (authLoading) return
    if (authData?.user && authData.user.role !== "admin") {
      router.replace("/perfil")
    }
  }, [authLoading, authData, router])

  // Determine admin status from either store or auth data
  const currentUser = authData?.user ?? user
  const isAdmin = currentUser?.role === "admin"

  // Show loading while hydrating or fetching auth
  if ((!isHydrated && !authData) || (authLoading && !currentUser)) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground">Cargando...</div>
  }

  // If we have no user and we're done loading, the middleware will handle redirect
  if (!isAdmin && !authLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground">Cargando...</div>
  }

  const totalProducts = Array.isArray(products) ? products.length : 0
  const totalStock = Array.isArray(products) ? products.reduce((s: number, p: any) => s + (p.stock ?? 0), 0) : 0
  const totalSales = Array.isArray(sales) ? sales.length : 0
  // Solo ventas activas (no canceladas) — coherente con el panel de ventas
  const activeSales = Array.isArray(sales) ? sales.filter((v: any) => v.status !== "cancelled") : []
  const totalRevenue = activeSales.reduce((s: number, v: any) => s + (v.total ?? 0), 0)
  const totalSuppliers = Array.isArray(suppliers) ? suppliers.length : 0
  const totalAlerts = alerts?.alerts ? alerts.alerts.length : 0
  // Gastos: compras recibidas
  const receivedPurchases = Array.isArray(purchases) ? purchases.filter((p: any) => p.status === "received") : []
  const totalSpent = receivedPurchases.reduce((s: number, p: any) => s + (p.totalCost ?? 0), 0)
  const balance = totalRevenue - totalSpent

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel Admin</h1>
          <p className="mt-1 text-muted-foreground">Vista general de la tienda</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30">Administrador</Badge>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Productos" value={totalProducts.toString()} description={`Stock total: ${totalStock.toLocaleString()} uds`} icon={Package} />
        <StatCard title="Ventas" value={totalSales.toString()} description={`Ingresos: ${formatCOP(totalRevenue)}`} icon={TrendingUp} color="text-green-500" />
        <StatCard title="Proveedores" value={totalSuppliers.toString()} description="Proveedores registrados" icon={Truck} color="text-blue-500" />
        <StatCard title="Compras" value={Array.isArray(purchases) ? purchases.length.toString() : "0"} description={`Gastado: ${formatCOP(totalSpent)}`} icon={ShoppingCart} color="text-orange-500" />
        <StatCard title="Alertas Stock" value={totalAlerts.toString()} description={`Productos con stock ≤ 10`} icon={AlertTriangle} color="text-red-500" />
        <StatCard title="Ingresos" value={formatCOP(totalRevenue)} description="Ventas activas (sin canceladas)" icon={DollarSign} color="text-emerald-500" />
        <StatCard title="Gastos" value={formatCOP(totalSpent)} description="Compras recibidas a proveedores" icon={ShoppingCart} color="text-orange-500" />
        <StatCard title="Balance" value={formatCOP(balance)} description="Ingresos − Gastos" icon={BarChart3} color={balance >= 0 ? "text-emerald-500" : "text-red-500"} />
      </div>

      {/* Quick alerts */}
      {totalAlerts > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" /> {totalAlerts} producto(s) con stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(alerts?.alerts ?? []).slice(0, 5).map((p: any) => (
                <Badge key={p._id} variant="destructive" className="text-xs">
                  {p.name} — Stock: {p.stock}
                </Badge>
              ))}
              {totalAlerts > 5 && <Badge variant="outline" className="text-xs">+{totalAlerts - 5} más</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent sales */}
      {Array.isArray(sales) && sales.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" /> Ventas recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-muted-foreground">ID</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Cliente</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Total</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 5).map((s: any) => (
                    <tr key={s._id} className="border-b border-border/50">
                      <td className="py-2 text-xs text-muted-foreground font-mono">{s._id.slice(-8)}</td>
                      <td className="py-2">{s.userEmail}</td>
                      <td className="py-2 font-medium">{formatCOP(s.total)}</td>
                      <td className="py-2">
                        <Badge variant={s.status === "delivered" ? "default" : "secondary"} className="text-xs capitalize">
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
