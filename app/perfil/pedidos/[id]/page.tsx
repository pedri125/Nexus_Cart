"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, XCircle, CheckCircle2, Circle, Clock, Truck, Package, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { formatCOP } from "@/lib/constants"
import { toast } from "sonner"
import useSWR from "swr"
import type { Order } from "@/lib/types"

// ─── Status config ────────────────────────────────────────────────────────────

const STEPS = [
  { key: "pending",    label: "Pendiente",   icon: Clock },
  { key: "processing", label: "En proceso",  icon: Package },
  { key: "shipped",    label: "Enviado",      icon: Truck },
  { key: "delivered",  label: "Entregado",   icon: CheckCircle2 },
]

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-800 border-amber-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  shipped:    "bg-purple-100 text-purple-800 border-purple-200",
  delivered:  "bg-green-100 text-green-800 border-green-200",
  cancelled:  "bg-red-100 text-red-800 border-red-200",
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function StatusStepper({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4 mb-8">
        <Ban className="h-5 w-5 text-red-500 shrink-0" />
        <div>
          <p className="font-semibold text-red-700 dark:text-red-400">Pedido cancelado</p>
          <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">
            Este pedido fue cancelado. Si realizaste el pago, el reembolso está en proceso.
          </p>
        </div>
      </div>
    )
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status)

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Seguimiento del pedido
      </p>
      <div className="flex items-start gap-0">
        {STEPS.map((step, idx) => {
          const done    = idx < currentIdx
          const active  = idx === currentIdx
          const pending = idx > currentIdx
          const Icon    = step.icon

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {/* connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 transition-colors duration-500 ${
                    done ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              {/* circle */}
              <div
                className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  done
                    ? "bg-primary border-primary text-primary-foreground"
                    : active
                    ? "bg-primary/10 border-primary text-primary animate-pulse"
                    : "bg-background border-border text-muted-foreground"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              {/* label */}
              <p
                className={`mt-2 text-center text-xs font-medium leading-tight ${
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("fetch error")
  const data = await res.json()
  return data.order as Order
}

export default function PedidoDetallePage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { user } = useAuthStore()
  const [cancelling, setCancelling] = useState(false)
  const [prevStatus, setPrevStatus] = useState<string | null>(null)

  // F3 + F5 – Poll the order every 10 s for real-time status updates
  const { data: order, error, isLoading, mutate } = useSWR<Order>(
    user && id ? `/api/orders/${id}` : null,
    fetcher,
    { refreshInterval: 10000, revalidateOnFocus: true }
  )

  // Notify the customer when status changes
  useEffect(() => {
    if (!order) return
    if (prevStatus && prevStatus !== order.status) {
      toast.info(
        `Tu pedido cambió de estado: ${STATUS_LABELS[prevStatus] ?? prevStatus} → ${STATUS_LABELS[order.status] ?? order.status}`,
        { duration: 6000 }
      )
    }
    setPrevStatus(order.status)
  }, [order?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCancel() {
    if (!id) return
    if (!confirm("¿Estás seguro de que quieres cancelar este pedido? Se procesará el reembolso.")) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "PATCH" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo cancelar el pedido.")
        return
      }
      await mutate()
      toast.success("Pedido cancelado. El reembolso está en proceso.")
    } finally {
      setCancelling(false)
    }
  }

  if (!user) return null

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/perfil/pedidos"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mis pedidos
        </Link>
        <p className="text-muted-foreground">Pedido no encontrado.</p>
      </div>
    )
  }

  const canCancel = order.status === "pending"
  const isCancelled = order.status === "cancelled"
  const isShippedOrBeyond = ["shipped", "delivered"].includes(order.status)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
      <Link
        href="/perfil/pedidos"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mis pedidos
      </Link>

      {/* Title + status badge */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Pedido #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-medium ${
            STATUS_COLORS[order.status] ?? "bg-muted text-foreground"
          }`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        {new Date(order.createdAt).toLocaleDateString("es-CO", { dateStyle: "long" })}
        <span className="ml-2 text-xs text-primary/60 font-medium">
          · Se actualiza automáticamente
        </span>
      </p>

      {/* F3 – Status stepper */}
      <StatusStepper status={order.status} />

      {/* Shipping address */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold text-foreground">Envío</h2>
        <p className="text-sm text-foreground leading-relaxed">
          {order.shippingAddress.fullName}<br />
          {order.shippingAddress.address}<br />
          {order.shippingAddress.city}
          {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}{" "}
          {order.shippingAddress.zipCode}<br />
          {order.shippingAddress.country}<br />
          {order.shippingAddress.phone}
        </p>
      </div>

      {/* Items */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold text-foreground">Productos</h2>
        <ul className="flex flex-col gap-4">
          {order.items.map((item) => (
            <li key={`${item.productId}-${item.name}`} className="flex items-center gap-4">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCOP(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="font-medium text-foreground">{formatCOP(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Totals */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">{formatCOP(order.subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-muted-foreground">Envío</span>
          <span className="text-foreground">{formatCOP(order.shipping)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-muted-foreground">IVA</span>
          <span className="text-foreground">{formatCOP(order.tax)}</span>
        </div>
        {isCancelled && (
          <div className="mt-2 flex justify-between text-sm text-red-500 font-medium">
            <span>Reembolso procesado</span>
            <span>-{formatCOP(order.total)}</span>
          </div>
        )}
        <div className="mt-4 flex justify-between border-t border-border pt-4 font-bold text-foreground">
          <span>Total</span>
          <span>{formatCOP(order.total)}</span>
        </div>
      </div>

      {/* Actions / messages */}
      {canCancel && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-muted-foreground mb-3">
            Tu pedido está pendiente de envío. Puedes cancelarlo ahora y solicitar el reembolso.
          </p>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelling}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            {cancelling ? "Cancelando..." : "Cancelar pedido y solicitar reembolso"}
          </Button>
        </div>
      )}

      {/* F3 – Cannot cancel once shipped */}
      {isShippedOrBeyond && !isCancelled && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
          <Truck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              Tu pedido ya fue {order.status === "delivered" ? "entregado" : "enviado"}
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-0.5">
              No es posible cancelarlo en este punto. Si hay algún problema con tu pedido, contacta soporte.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
