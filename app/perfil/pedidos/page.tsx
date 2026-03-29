"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Package, ArrowLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import { formatCOP } from "@/lib/constants"
import type { Order } from "@/lib/types"

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

export default function PedidosPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    const f = async () => {
      try {
        const res = await fetch("/api/orders")
        if (res.status === 401) {
          router.push("/login")
          return
        }
        const data = await res.json()
        setOrders(data.orders ?? [])
        if (res.status === 503 && data.enableUrl) {
          toast.error(data.error ?? "Activa Firestore para ver pedidos.", { duration: 8000 })
          if (typeof window !== "undefined") window.open(data.enableUrl, "_blank")
        }
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    f()
  }, [user, router])

  if (!user) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <Link
        href="/perfil"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mi cuenta
      </Link>

      <h1 className="mb-8 text-3xl font-bold text-foreground">Mis pedidos</h1>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Cargando pedidos...
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Aún no tienes pedidos</p>
          <p className="text-sm text-muted-foreground">
            Cuando realices una compra, aparecerá aquí.
          </p>
          <Button asChild>
            <Link href="/catalogo">Ir al catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/perfil/pedidos/${order.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">
                  Pedido #{order.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("es-CO", {
                    dateStyle: "long",
                  })}{" "}
                  · {order.items.length} producto(s)
                </span>
                <span className="text-xs text-muted-foreground">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">
                  {formatCOP(order.total)}
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
