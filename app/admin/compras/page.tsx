"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { ShoppingBag, Plus, CheckCircle, XCircle, Clock, Ban } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_MAP: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  pending:   { label: "Pendiente", icon: Clock,         cls: "bg-amber-500/20 text-amber-600 border-amber-500/30" },
  received:  { label: "Recibida",  icon: CheckCircle,   cls: "bg-green-500/20 text-green-600 border-green-500/30" },
  cancelled: { label: "Cancelada", icon: XCircle,       cls: "bg-red-500/20 text-red-600 border-red-500/30" },
}

const EMPTY_FORM = {
  supplierId: "",
  supplierName: "",
  status: "pending" as "pending" | "received" | "cancelled",
  notes: "",
  items: [{ productId: "", name: "", quantity: 1, unitCost: 0 }] as Array<{
    productId: string; name: string; quantity: number; unitCost: number
  }>,
}

export default function ComprasAdmin() {
  const { data: purchases, isLoading } = useSWR<any[]>("/api/admin/purchases", fetcher)
  const { data: suppliers } = useSWR<any[]>("/api/admin/suppliers", fetcher)
  const { data: products } = useSWR<any[]>("/api/admin/products", fetcher)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const totalCost = form.items.reduce((s, it) => s + it.quantity * it.unitCost, 0)

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { productId: "", name: "", quantity: 1, unitCost: 0 }] }))
  }
  function removeItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }
  function updateItem(idx: number, key: string, val: any) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => i === idx ? { ...it, [key]: val } : it),
    }))
  }
  function pickProduct(idx: number, productId: string) {
    const p = (products ?? []).find((pr) => (pr._id ?? pr.id) === productId)
    if (!p) return
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) =>
        i === idx ? { ...it, productId, name: p.name, unitCost: p.price ?? 0 } : it
      ),
    }))
  }

  async function handleSave() {
    if (!form.supplierId) { alert("Selecciona un proveedor."); return }
    if (form.items.some((it) => !it.name.trim() || it.quantity <= 0)) {
      alert("Completa todos los artículos (nombre y cantidad > 0).")
      return
    }
    setSaving(true)
    try {
      await fetch("/api/admin/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, totalCost }),
      })
      await mutate("/api/admin/purchases")
      setOpen(false)
      setForm(EMPTY_FORM)
    } finally { setSaving(false) }
  }

  async function changeStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/purchases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? "No se pudo cambiar el estado.")
    }
    await mutate("/api/admin/purchases")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" /> Compras
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {(purchases ?? []).length} órdenes de compra
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Compra
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Cargando...</CardContent></Card>
        )}
        {(purchases ?? []).map((p) => {
          const st = STATUS_MAP[p.status] ?? STATUS_MAP.pending
          return (
            <Card key={p._id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{p.supplierName}</p>
                    <p className="text-xs text-muted-foreground font-mono">#{p._id?.slice(-8)}</p>
                    <p className="text-sm mt-1">
                      {p.items?.length ?? 0} artículo(s) ·{" "}
                      Total: <span className="font-semibold">${p.totalCost?.toLocaleString()}</span>
                    </p>
                    {p.notes && <p className="text-xs text-muted-foreground mt-1 max-w-md">{p.notes}</p>}
                    {/* items detail */}
                    {p.items?.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                        {p.items.map((it: any, i: number) => (
                          <div key={i}>{it.name} × {it.quantity} @ ${it.unitCost?.toLocaleString()}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge className={`text-xs ${st.cls}`}>
                      <st.icon className="h-3 w-3 mr-1" />{st.label}
                    </Badge>
                    {/* F1 – cancelled is terminal: show locked badge, not a select */}
                    {p.status === "cancelled" ? (
                      <div className="flex items-center gap-1 h-7 px-2 rounded-md text-xs text-red-600 bg-red-500/10 border border-red-500/20">
                        <Ban className="h-3 w-3" /> Estado bloqueado
                      </div>
                    ) : (
                      <Select value={p.status} onValueChange={(val) => changeStatus(p._id, val)}>
                        <SelectTrigger className="h-7 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="received">Recibida</SelectItem>
                          <SelectItem value="cancelled" disabled={p.status === "received"}>Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {!isLoading && (purchases ?? []).length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No hay compras registradas.</CardContent></Card>
        )}
      </div>

      {/* Dialog nueva compra */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Orden de Compra</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Proveedor */}
            <div className="grid gap-1">
              <Label>Proveedor <span className="text-destructive">*</span></Label>
              <Select
                value={form.supplierId}
                onValueChange={(val) => {
                  const s = (suppliers ?? []).find((s) => s._id === val)
                  setForm((f) => ({ ...f, supplierId: val, supplierName: s?.name ?? "" }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {(suppliers ?? []).length === 0
                    ? <SelectItem value="__none" disabled>No hay proveedores registrados</SelectItem>
                    : (suppliers ?? []).map((s) => (
                        <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Notas */}
            <div className="grid gap-1">
              <Label>Notas / Observaciones</Label>
              <textarea
                className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Plazo de entrega, condiciones, etc."
              />
            </div>

            {/* Artículos */}
            <div>
              <Label className="mb-2 block">Artículos <span className="text-destructive">*</span></Label>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    {/* Producto desde lista */}
                    <div className="col-span-4">
                      <Select
                        value={item.productId || "__manual"}
                        onValueChange={(val) => {
                          if (val === "__manual") updateItem(idx, "productId", "")
                          else pickProduct(idx, val)
                        }}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Producto..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__manual">✏️ Manual</SelectItem>
                          {(products ?? []).map((p) => (
                            <SelectItem key={p._id ?? p.id} value={p._id ?? p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      className="col-span-2 text-xs"
                      placeholder="Nombre"
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                    />
                    <Input
                      className="col-span-2 text-xs"
                      type="number" min={1}
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                    />
                    <Input
                      className="col-span-2 text-xs"
                      type="number" min={0}
                      placeholder="Costo"
                      value={item.unitCost}
                      onChange={(e) => updateItem(idx, "unitCost", Number(e.target.value))}
                    />
                    <Button
                      type="button" size="sm" variant="ghost"
                      className="col-span-2 text-destructive"
                      onClick={() => removeItem(idx)}
                      disabled={form.items.length === 1}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2 gap-1">
                <Plus className="h-3 w-3" /> Agregar artículo
              </Button>
              <p className="mt-2 text-sm font-medium">
                Total estimado: <span className="text-primary">${totalCost.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.supplierId}>
              {saving ? "Guardando..." : "Crear Orden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
