"use client"

import { useRef, useState } from "react"
import useSWR, { mutate } from "swr"
import {
  Package, Plus, Pencil, Search, X, Image as ImageIcon, Upload, ToggleLeft, ToggleRight,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIES, BRANDS, formatCOP } from "@/lib/constants"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const EMPTY_PRODUCT = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  price: 0,
  originalPrice: 0,
  discount: 0,
  category: "",
  brand: "",
  featured: false,
  images: [] as string[],
  specs: {} as Record<string, string>,
}

type ProductForm = typeof EMPTY_PRODUCT

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export default function ProductosAdmin() {
  // F6 – always fetch ALL products (incl. inactive) so they never disappear
  const { data: products, isLoading } = useSWR<any[]>("/api/admin/products?all=1", fetcher)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT)
  const [saving, setSaving] = useState(false)
  const [imageInput, setImageInput] = useState("")
  const [imageUploading, setImageUploading] = useState(false)
  const [specKey, setSpecKey] = useState("")
  const [specVal, setSpecVal] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = (products ?? []).filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  )

  function field(key: keyof ProductForm, value: any) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_PRODUCT)
    setImageInput("")
    setSpecKey("")
    setSpecVal("")
    setOpen(true)
  }

  function openEdit(product: any) {
    setEditing(product)
    setForm({
      name: product.name ?? "",
      slug: product.slug ?? "",
      description: product.description ?? "",
      shortDescription: product.shortDescription ?? "",
      price: product.price ?? 0,
      originalPrice: product.originalPrice ?? 0,
      discount: product.discount ?? 0,
      category: product.category ?? "",
      brand: product.brand ?? "",
      featured: product.featured ?? false,
      images: product.images ?? [],
      specs: product.specs ?? {},
    })
    setImageInput("")
    setSpecKey("")
    setSpecVal("")
    setOpen(true)
  }

  function addImage() {
    const url = imageInput.trim()
    if (!url) return
    setForm((f) => ({ ...f, images: [...f.images, url] }))
    setImageInput("")
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    try {
      const fd = new FormData()
      fd.append("image", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      if (!res.ok) { alert("Error al subir imagen."); return }
      const { url } = await res.json()
      setForm((f) => ({ ...f, images: [...f.images, url] }))
    } finally {
      setImageUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function removeImage(idx: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
  }

  function addSpec() {
    if (!specKey.trim()) return
    setForm((f) => ({ ...f, specs: { ...f.specs, [specKey.trim()]: specVal.trim() } }))
    setSpecKey("")
    setSpecVal("")
  }

  function removeSpec(key: string) {
    setForm((f) => {
      const s = { ...f.specs }
      delete s[key]
      return { ...f, specs: s }
    })
  }

  async function handleSave() {
    if (!form.name || !form.category || !form.brand || !form.slug) {
      alert("Nombre, Slug, Categoría y Marca son obligatorios.")
      return
    }
    setSaving(true)
    try {
      const id = editing?._id ?? editing?.id
      if (editing) {
        await fetch(`/api/admin/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      } else {
        await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }
      await mutate("/api/admin/products?all=1")
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    })
    await mutate("/api/admin/products?all=1")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Productos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {(products ?? []).length} productos en el catálogo
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Producto
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-4">
        <CardHeader className="pb-3 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre, categoría o marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Producto", "Categoría", "Precio", "Stock", "Destacado", "Estado", "Acciones"].map((h) => (
                      <th key={h} className="pb-3 text-left font-medium text-muted-foreground whitespace-nowrap pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p._id ?? p.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="py-3 pr-4 max-w-[200px]">
                        <div className="font-medium text-foreground truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.brand}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary" className="capitalize text-xs whitespace-nowrap">
                          {CATEGORIES.find((c) => c.slug === p.category)?.name ?? p.category}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 font-medium whitespace-nowrap">{formatCOP(p.price)}</td>
                      <td className="py-3 pr-4">
                        <span className={`font-semibold ${p.stock <= 10 ? "text-destructive" : "text-foreground"}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {p.featured
                          ? <Badge className="text-xs bg-amber-500/20 text-amber-600 border-amber-500/30">Sí</Badge>
                          : <span className="text-muted-foreground text-xs">No</span>}
                      </td>
                      <td className="py-3 pr-4">
                        {p.isActive !== false
                          ? <Badge className="text-xs bg-green-500/20 text-green-700 border-green-500/30">Activo</Badge>
                          : <Badge className="text-xs bg-gray-500/20 text-gray-500 border-gray-400/30">Inactivo</Badge>}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            title={p.isActive !== false ? "Desactivar producto" : "Activar producto"}
                            className={p.isActive !== false ? "text-amber-600 hover:text-amber-700" : "text-green-600 hover:text-green-700"}
                            onClick={() => handleToggleActive(p._id ?? p.id, p.isActive !== false)}
                          >
                            {p.isActive !== false
                              ? <ToggleLeft className="h-4 w-4" />
                              : <ToggleRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        {search ? "No hay productos que coincidan." : "No hay productos aún. ¡Crea el primero!"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name + Slug */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Nombre <span className="text-destructive">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    field("name", e.target.value)
                    if (!editing) field("slug", slugify(e.target.value))
                  }}
                  placeholder="ej. MacBook Pro 14 pulgadas"
                />
              </div>
              <div className="grid gap-1">
                <Label>Slug (URL) <span className="text-destructive">*</span></Label>
                <Input
                  value={form.slug}
                  onChange={(e) => field("slug", slugify(e.target.value))}
                  placeholder="ej. macbook-pro-14"
                />
              </div>
            </div>

            {/* Category + Brand */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Categoría <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={(v) => field("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Marca <span className="text-destructive">*</span></Label>
                <Select value={form.brand} onValueChange={(v) => field("brand", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                    <SelectItem value="__otro">Otra marca...</SelectItem>
                  </SelectContent>
                </Select>
                {form.brand === "__otro" && (
                  <Input
                    className="mt-1"
                    placeholder="Escribe la marca"
                    onChange={(e) => field("brand", e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Short description */}
            <div className="grid gap-1">
              <Label>Descripción corta</Label>
              <Input
                value={form.shortDescription}
                onChange={(e) => field("shortDescription", e.target.value)}
                placeholder="Resumen en una línea..."
              />
            </div>

            {/* Full description */}
            <div className="grid gap-1">
              <Label>Descripción completa</Label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                value={form.description}
                onChange={(e) => field("description", e.target.value)}
                placeholder="Descripción detallada del producto..."
              />
            </div>

            {/* Price + Original + Discount (NO STOCK – managed via purchases) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1">
                <Label>Precio <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => field("price", Number(e.target.value))}
                />
              </div>
              <div className="grid gap-1">
                <Label>Precio original</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.originalPrice}
                  onChange={(e) => field("originalPrice", Number(e.target.value))}
                />
              </div>
              <div className="grid gap-1">
                <Label>Descuento %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.discount}
                  onChange={(e) => field("discount", Number(e.target.value))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2 flex items-center gap-1">
              ⚠️ El stock se actualiza automáticamente al recibir una compra. No se puede editar manualmente.
            </p>

            {/* Featured */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) => field("featured", e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="featured" className="cursor-pointer">Producto destacado (aparece en inicio)</Label>
            </div>

            {/* Images – URL + File upload */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" /> Imágenes
              </Label>
              <div className="flex gap-2">
                <Input
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addImage} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {imageUploading ? "Subiendo..." : "Subir desde equipo"}
                </Button>
                <span className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.images.map((url, idx) => (
                    <div key={idx} className="group relative flex items-center gap-1 bg-accent rounded px-2 py-1 text-xs max-w-full">
                      <span className="truncate max-w-[200px] text-muted-foreground">{url}</span>
                      <button onClick={() => removeImage(idx)} className="text-destructive hover:text-destructive ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Specs */}
            <div className="grid gap-2">
              <Label>Especificaciones técnicas</Label>
              <div className="flex gap-2">
                <Input
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  placeholder="Clave (ej. RAM)"
                  className="flex-1"
                />
                <Input
                  value={specVal}
                  onChange={(e) => setSpecVal(e.target.value)}
                  placeholder="Valor (ej. 16GB)"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpec())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addSpec} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {Object.keys(form.specs).length > 0 && (
                <div className="rounded border border-border divide-y divide-border">
                  {Object.entries(form.specs).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-1.5 text-sm">
                      <span><span className="font-medium">{key}:</span> {val}</span>
                      <button onClick={() => removeSpec(key)} className="text-destructive ml-2">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
