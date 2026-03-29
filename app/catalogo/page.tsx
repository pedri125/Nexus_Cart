"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import useSWR from "swr"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORIES, BRANDS, SORT_OPTIONS } from "@/lib/constants"
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react"
import type { Product } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  totalPages: number
}

function CatalogContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const category = searchParams.get("category") || ""
  const brand = searchParams.get("brand") || ""
  const sort = searchParams.get("sort") || "relevance"
  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search") || ""

  const params = new URLSearchParams()
  if (category) params.set("category", category)
  if (brand) params.set("brand", brand)
  if (sort) params.set("sort", sort)
  if (search) params.set("search", search)
  params.set("page", String(page))
  params.set("limit", "12")

  const { data, isLoading } = useSWR<ProductsResponse>(
    `/api/products?${params.toString()}`,
    fetcher
  )

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    newParams.set("page", "1")
    router.push(`/catalogo?${newParams.toString()}`)
  }

  const clearFilters = () => {
    router.push("/catalogo")
  }

  const goToPage = (p: number) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set("page", String(p))
    router.push(`/catalogo?${newParams.toString()}`)
  }

  const hasFilters = category || brand || search
  const categoryName = CATEGORIES.find((c) => c.slug === category)?.name

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground text-balance">
          {categoryName ? categoryName : search ? `Resultados para "${search}"` : "Catalogo"}
        </h1>
        {data && (
          <p className="mt-2 text-muted-foreground">
            {data.total} producto{data.total !== 1 ? "s" : ""} encontrado
            {data.total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Filters bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />

        <Select value={category} onValueChange={(v) => updateFilter("category", v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={brand} onValueChange={(v) => updateFilter("brand", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            {BRANDS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => updateFilter("sort", v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      ) : data && data.products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="icon"
                disabled={page >= data.totalPages}
                onClick={() => goToPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-lg font-medium text-foreground">
            No se encontraron productos
          </p>
          <p className="text-muted-foreground">
            Intenta ajustar los filtros o buscar algo diferente
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <Skeleton className="mb-4 h-10 w-48" />
          <Skeleton className="mb-8 h-5 w-32" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  )
}
