"use client"

import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import Fuse from "fuse.js"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import { PRODUCTS_DATA } from "@/lib/products-data"

const fuse = new Fuse(PRODUCTS_DATA, {
  keys: [
    { name: "name", weight: 0.4 },
    { name: "brand", weight: 0.2 },
    { name: "category", weight: 0.2 },
    { name: "description", weight: 0.1 },
    { name: "shortDescription", weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
})

export default function BuscarPage() {
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    if (!query.trim()) return []
    return fuse.search(query).map((r) => r.item)
  }, [query])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Buscar</h1>

      {/* Search input */}
      <div className="relative mb-8 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar productos, marcas, categorias..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-12 text-base"
          autoFocus
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results */}
      {query.trim() ? (
        <>
          <p className="mb-6 text-muted-foreground">
            {results.length} resultado{results.length !== 1 ? "s" : ""} para{" "}
            <span className="font-medium text-foreground">
              {'"'}{query}{'"'}
            </span>
          </p>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="text-lg font-medium text-foreground">
                No se encontraron resultados
              </p>
              <p className="text-muted-foreground">
                Intenta con otros terminos de busqueda
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-foreground">
            Busca cualquier producto
          </p>
          <p className="text-muted-foreground">
            Escribe el nombre, marca o categoria para encontrar lo que necesitas
          </p>
        </div>
      )}
    </div>
  )
}
