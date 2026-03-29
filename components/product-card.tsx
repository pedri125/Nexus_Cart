"use client"

import Link from "next/link"
import Image from "next/image"
import { Star, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/store/cart-store"
import { toast } from "sonner"
import type { Product } from "@/lib/types"

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (product.stock === 0) {
      toast.error("Producto sin stock disponible")
      return
    }

    const result = addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1,
      maxStock: product.stock,
    })

    if (result.success) {
      toast.success(`${product.name} agregado al carrito`)
    } else {
      toast.warning(result.message ?? "No se pudo agregar")
    }
  }

  return (
    <Link href={`/producto/${product.slug}`}>
      <Card className="group h-full overflow-hidden border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {product.discount && product.discount > 0 && (
            <Badge className="absolute left-3 top-3 bg-destructive text-destructive-foreground">
              -{product.discount}%
            </Badge>
          )}
          <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center p-3 transition-transform duration-300 group-hover:translate-y-0">
            <Button
              size="sm"
              className="w-full gap-2"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
              Agregar al carrito
            </Button>
          </div>
        </div>
        <CardContent className="flex flex-col gap-2 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground leading-snug">
            {product.name}
          </h3>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="text-xs font-medium text-foreground">
              {product.rating}
            </span>
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">
              ${product.price.toLocaleString()}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
