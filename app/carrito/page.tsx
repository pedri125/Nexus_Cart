"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useCartStore } from "@/store/cart-store"
import { SITE_CONFIG, formatCOP } from "@/lib/constants"
import { toast } from "sonner"

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } =
    useCartStore()

  const total = getTotal()
  const shipping =
    total >= SITE_CONFIG.freeShippingMin ? 0 : SITE_CONFIG.shippingCost
  const tax = total * SITE_CONFIG.taxRate
  const grandTotal = total + shipping + tax

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    const result = updateQuantity(productId, newQty)
    if (!result.success && result.message) {
      toast.warning(result.message)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 px-4 py-20 lg:px-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Tu carrito esta vacio
        </h1>
        <p className="text-muted-foreground">
          Explora nuestro catalogo y encuentra productos increibles
        </p>
        <Button asChild className="gap-2">
          <Link href="/catalogo">
            Ir al catalogo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          Carrito de compras
        </h1>

        {/* Confirmación antes de vaciar */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
            >
              Vaciar carrito
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Vaciar el carrito?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminarán todos los productos del carrito. Esta acción no
                se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  clearCart()
                  toast.success("Carrito vaciado")
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sí, vaciar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatCOP(item.price)} por unidad
                    </p>
                    {item.maxStock !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Stock disponible: {item.maxStock}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.productId)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-lg border border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        handleUpdateQuantity(item.productId, item.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium text-foreground">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                      onClick={() =>
                        handleUpdateQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-bold text-foreground">
                    {formatCOP(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="h-fit rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Resumen del pedido
          </h2>
          <div className="flex flex-col gap-3">
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
            <div className="flex justify-between text-base font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">{formatCOP(grandTotal)}</span>
            </div>
          </div>
          {shipping > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Envío gratis en compras mayores a {formatCOP(SITE_CONFIG.freeShippingMin)}
            </p>
          )}
          <Button asChild className="mt-6 w-full gap-2">
            <Link href="/checkout">
              Proceder al pago
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="mt-2 w-full text-muted-foreground"
          >
            <Link href="/catalogo">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
