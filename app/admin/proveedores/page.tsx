"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Truck, Plus, Pencil, Search, X, Mail, Phone, MapPin, ToggleLeft, ToggleRight } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const EMPTY = {
  name: "", contactName: "", email: "", phone: "",
  address: "", city: "", country: "", notes: "",
}

export default function ProveedoresAdmin() {
  // F6 – always fetch ALL suppliers (incl. inactive) so they never disappear
  const { data: suppliers, isLoading } = useSWR<any[]>("/api/admin/suppliers?all=1", fetcher)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)

  const filtered = (suppliers ?? []).filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  )

  function field(key: string, value: string) {
    setForm((f: any) => ({ ...f, [key]: value }))
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true) }
  function openEdit(s: any) { setEditing(s); setForm({ ...EMPTY, ...s }); setOpen(true) }

  async function handleSave() {
    if (!form.name?.trim()) { alert("El nombre es obligatorio."); return }
    setSaving(true)
    try {
      if (editing) {
        await fetch(`/api/admin/suppliers/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      } else {
        await fetch("/api/admin/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }
      await mutate("/api/admin/suppliers?all=1")
      setOpen(false)
    } finally { setSaving(false) }
  }

  async function handleToggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/suppliers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    })
    await mutate("/api/admin/suppliers?all=1")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" /> Proveedores
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {(suppliers ?? []).length} proveedores registrados
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Proveedor
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nombre, email o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Cargando...</CardContent></Card>
        )}
        {filtered.map((s) => (
          <Card key={s._id} className={`hover:shadow-md transition-shadow ${s.isActive === false ? "opacity-60" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{s.name}</p>
                  {s.contactName && <p className="text-xs text-muted-foreground mt-0.5">{s.contactName}</p>}
                  <div className="mt-1">
                    {s.isActive !== false
                      ? <Badge className="text-xs bg-green-500/20 text-green-700 border-green-500/30">Activo</Badge>
                      : <Badge className="text-xs bg-gray-500/20 text-gray-500 border-gray-400/30">Inactivo</Badge>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    title={s.isActive !== false ? "Desactivar proveedor" : "Activar proveedor"}
                    className={s.isActive !== false ? "text-amber-600 hover:text-amber-700" : "text-green-600 hover:text-green-700"}
                    onClick={() => handleToggleActive(s._id, s.isActive !== false)}
                  >
                    {s.isActive !== false
                      ? <ToggleLeft className="h-4 w-4" />
                      : <ToggleRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              {s.email && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> {s.email}
                </p>
              )}
              {s.phone && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> {s.phone}
                </p>
              )}
              {(s.city || s.country) && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {[s.city, s.country].filter(Boolean).join(", ")}
                </p>
              )}
              {s.notes && (
                <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-2 line-clamp-2">
                  {s.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {search ? "No hay proveedores que coincidan." : "No hay proveedores aún. ¡Registra el primero!"}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label>Nombre de la empresa <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => field("name", e.target.value)} placeholder="ej. Tech Supplies S.A." />
            </div>
            <div className="grid gap-1">
              <Label>Persona de contacto</Label>
              <Input value={form.contactName} onChange={(e) => field("contactName", e.target.value)} placeholder="ej. Juan García" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => field("email", e.target.value)} placeholder="contacto@empresa.com" />
              </div>
              <div className="grid gap-1">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => field("phone", e.target.value)} placeholder="+57 300 000 0000" />
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Dirección</Label>
              <Input value={form.address} onChange={(e) => field("address", e.target.value)} placeholder="Calle 123 # 45-67" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Ciudad</Label>
                <Input value={form.city} onChange={(e) => field("city", e.target.value)} placeholder="Bogotá" />
              </div>
              <div className="grid gap-1">
                <Label>País</Label>
                <Input value={form.country} onChange={(e) => field("country", e.target.value)} placeholder="Colombia" />
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Notas</Label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                value={form.notes}
                onChange={(e) => field("notes", e.target.value)}
                placeholder="Condiciones de pago, tiempo de entrega, observaciones..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar Proveedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
