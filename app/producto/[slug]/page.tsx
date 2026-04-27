"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import useSWR from "swr"
import {
  Star,
  ShoppingCart,
  Minus,
  Plus,
  ChevronLeft,
  Truck,
  Shield,
  RotateCcw,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useCartStore } from "@/store/cart-store"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import { formatCOP } from "@/lib/constants"
import type { Product } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProductoPage() {
  const params = useParams()
  const slug = params.slug as string
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const addItem = useCartStore((s) => s.addItem)
  const { user } = useAuthStore()

  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const { data: product, isLoading } = useSWR<Product>(
    `/api/products/${slug}`,
    fetcher
  )

  const { data: reviewsData, mutate: mutateReviews } = useSWR<{ reviews: any[] }>(
    product ? `/api/products/${slug}/reviews` : null,
    fetcher
  )
  const reviews = reviewsData?.reviews || []

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity,
    })
    toast.success(`${product.name} agregado al carrito`)
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return toast.error("Debes iniciar sesión para comentar")
    if (!reviewComment.trim()) return toast.error("El comentario no puede estar vacío")
    
    setIsSubmittingReview(true)
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al enviar")
      
      toast.success("Reseña agregada con éxito")
      setReviewComment("")
      setReviewRating(5)
      mutateReviews() // recargar comentarios
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium text-foreground">
          Producto no encontrado
        </p>
        <Button asChild variant="outline">
          <Link href="/catalogo">Volver al catalogo</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/catalogo" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Catalogo
        </Link>
        <span>/</span>
        <Link
          href={`/catalogo?category=${product.category}`}
          className="capitalize hover:text-foreground transition-colors"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Images */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
            <Image
              src={product.images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {product.discount && product.discount > 0 && (
              <Badge className="absolute left-4 top-4 bg-destructive text-destructive-foreground">
                -{product.discount}%
              </Badge>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === selectedImage
                      ? "border-primary"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} vista ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </p>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl text-balance">
              {product.name}
            </h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "fill-primary text-primary"
                      : "text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">
              {product.rating}
            </span>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount} opiniones)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">
              {formatCOP(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatCOP(product.originalPrice)}
                </span>
                <Badge variant="secondary" className="text-primary">
                  Ahorras {formatCOP(product.originalPrice - product.price)}
                </Badge>
              </>
            )}
          </div>

          {/* Stock status */}
          <div className="flex items-center gap-2">
            {product.stock > 0 ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  En stock ({product.stock} disponibles)
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-destructive">
                Agotado
              </span>
            )}
          </div>

          <Separator />

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          {/* Quantity + Add to cart */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-lg border border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium text-foreground">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <ShoppingCart className="h-5 w-5" />
              Agregar al carrito
            </Button>
          </div>

          <Separator />

          {/* Specs */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Especificaciones
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(product.specs).map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-col gap-0.5 rounded-lg bg-muted/50 p-3"
                >
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {key}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Envio gratis</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Garantia 2 anos</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Devolucion 30 dias</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seccion de Reseñas */}
      <div className="mt-16 border-t border-border pt-12">
        <h2 className="mb-8 text-2xl font-bold text-foreground">
          Comentarios y Calificaciones
        </h2>
        
        <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
          {/* Listado de reviews */}
          <div className="flex flex-col gap-6">
            {reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <p>Aún no hay comentarios. ¡Sé el primero en opinar!</p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-3">
                    <span className="font-semibold text-foreground">{rev.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rev.createdAt).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                  <div className="mb-3 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < rev.rating ? "fill-primary text-primary" : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{rev.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Formulario */}
          <div className="h-fit sticky top-24">
            <div className="rounded-xl bg-card p-6 border border-border shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Escribe una reseña
              </h3>
              {!user ? (
                <div className="text-sm text-muted-foreground">
                  Debes <Link href="/login" className="text-primary hover:underline font-medium">iniciar sesión</Link> para dejar un comentario.
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="flex flex-col gap-5">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-foreground">Tu calificación</label>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setReviewRating(i + 1)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              i < reviewRating ? "fill-primary text-primary" : "text-muted hover:text-primary/50"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <label className="mb-3 block text-sm font-medium text-foreground">Tu comentario</label>
                    <Textarea 
                      placeholder="¿Qué te pareció el producto? Escribe tu experiencia..." 
                      className="resize-none dark:bg-muted/50"
                      rows={5}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmittingReview} className="w-full">
                    {isSubmittingReview ? "Enviando..." : "Enviar reseña"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
