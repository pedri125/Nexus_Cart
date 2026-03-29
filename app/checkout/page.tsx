"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle, CreditCard, Truck, ArrowLeft, Wallet, Building2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useCartStore } from "@/store/cart-store"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import Link from "next/link"
import { SITE_CONFIG, formatCOP } from "@/lib/constants"
import type { PaymentMethod } from "@/lib/types"

/** Formatea número de tarjeta con espacios cada 4 dígitos */
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ")
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isHydrated } = useAuthStore()
  const { items, getTotal, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [cardNumber, setCardNumber] = useState("")

  const total = getTotal()
  const shipping =
    total >= SITE_CONFIG.freeShippingMin ? 0 : SITE_CONFIG.shippingCost
  const tax = total * SITE_CONFIG.taxRate
  const grandTotal = total + shipping + tax

  const handleCardNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCardNumber(formatCardNumber(e.target.value))
    },
    []
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) {
      toast.error("Inicia sesión para realizar el pedido")
      router.push("/login")
      return
    }
    setIsSubmitting(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const fullName = (formData.get("fullName") as string)?.trim() || user.name
    const email = (formData.get("email") as string)?.trim() || user.email
    const shippingAddress = {
      fullName,
      address: (formData.get("address") as string)?.trim() ?? "",
      city: (formData.get("city") as string)?.trim() ?? "",
      state: (formData.get("state") as string)?.trim() ?? "",
      zipCode: (formData.get("zipCode") as string)?.trim() ?? "",
      country: (formData.get("country") as string)?.trim() || SITE_CONFIG.defaultCountry,
      phone: (formData.get("phone") as string)?.trim() ?? "",
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          subtotal: total,
          shipping,
          tax,
          total: grandTotal,
          paymentMethod,
          shippingAddress,
          userName: user.name,
          userEmail: user.email,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 503 && data.enableUrl) {
          toast.error(
            data.error ?? "Firestore no está habilitado. Activa la API para guardar pedidos.",
            { duration: 8000 }
          )
          if (typeof window !== "undefined") window.open(data.enableUrl, "_blank")
        } else {
          toast.error(data.error ?? "Error al crear el pedido")
        }
        setIsSubmitting(false)
        return
      }
      setOrderId(data.orderId)
      clearCart()
      setOrderComplete(true)
      toast.success("Pedido realizado con éxito")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderComplete && orderId) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-6 px-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Pedido confirmado
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Tu pedido ha sido registrado. Puedes verlo en Mis pedidos.
        </p>
        <p className="text-sm font-medium text-foreground">
          Pedido #{orderId.slice(0, 8).toUpperCase()}
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/perfil/pedidos">Ver mis pedidos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/catalogo">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Esperar a que Zustand hidrate el store desde localStorage
  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (items.length === 0 && !orderComplete) {
    router.push("/carrito")
    return null
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Link
        href="/carrito"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al carrito
      </Link>

      <h1 className="mb-8 text-3xl font-bold text-foreground">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* Shipping info */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Datos de envío
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={user?.name}
                    placeholder="Juan García López"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user?.email}
                    placeholder="juan@ejemplo.com"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Calle 123 #45-67"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Bogotá"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Departamento / Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="Cundinamarca"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="zip">Código postal</Label>
                  <Input
                    id="zip"
                    name="zipCode"
                    placeholder="110111"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    name="country"
                    defaultValue={SITE_CONFIG.defaultCountry}
                    required
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Payment method & card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Método de pago
                </h2>
              </div>
              <div className="mb-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    paymentMethod === "paypal"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  PayPal
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pse")}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    paymentMethod === "pse"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  PSE
                </button>
              </div>
              {paymentMethod === "card" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                    <Input
                      id="cardName"
                      name="cardName"
                      placeholder="Juan García López"
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="cardNumber">Número de tarjeta</Label>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      required
                      className="mt-1.5 font-mono tracking-wider"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Vencimiento (MM/AA)</Label>
                    <Input
                      id="expiry"
                      name="expiry"
                      placeholder="12/28"
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      name="cvv"
                      placeholder="123"
                      required
                      className="mt-1.5"
                    />
                  </div>
                </div>
              )}
              {paymentMethod !== "card" && (
                <p className="text-sm text-muted-foreground">
                  {paymentMethod === "paypal"
                    ? "Serás redirigido a PayPal para completar el pago."
                    : "Pago seguro con PSE (bancos de Colombia)."}
                </p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Checkout de demostración. No se procesan pagos reales.
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="h-fit rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Tu pedido
            </h2>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      x{item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {formatCOP(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatCOP(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span className="text-foreground">
                  {shipping === 0 ? "Gratis" : formatCOP(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (19%)</span>
                <span className="text-foreground">{formatCOP(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">{formatCOP(grandTotal)}</span>
              </div>
            </div>
            {!user && (
              <p className="mt-4 text-sm text-amber-600 dark:text-amber-500">
                Inicia sesión para poder finalizar el pedido.
              </p>
            )}
            <Button
              type="submit"
              className="mt-6 w-full"
              size="lg"
              disabled={isSubmitting || !user}
            >
              {isSubmitting
                ? "Procesando..."
                : `Confirmar pedido · ${formatCOP(grandTotal)}`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
