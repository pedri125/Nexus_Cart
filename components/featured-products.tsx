"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-24" />
    </div>
  )
}

export function FeaturedProducts() {
  const { data: products, isLoading } = useSWR<Product[]>(
    "/api/products/featured",
    fetcher
  )

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl text-balance">
            Productos destacados
          </h2>
          <p className="text-muted-foreground">
            Lo mejor en tecnologia seleccionado para ti
          </p>
        </div>
        <Button asChild variant="ghost" className="hidden gap-1 sm:flex">
          <Link href="/catalogo">
            Ver todo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))
          : products
              ?.slice(0, 8)
              .map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
      </div>

      <div className="mt-8 flex justify-center sm:hidden">
        <Button asChild variant="outline" className="gap-1">
          <Link href="/catalogo">
            Ver todos los productos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
