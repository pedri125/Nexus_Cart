"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import {
  ShoppingBag, Plus, CheckCircle, XCircle, Clock, Ban,
  Download, FileSpreadsheet, FileText, RefreshCw, Eye,
  TrendingUp, TrendingDown, Scale,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { formatCOP } from "@/lib/constants"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_MAP: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  pending:   { label: "Pendiente", icon: Clock,       cls: "bg-amber-500/20 text-amber-600 border-amber-500/30" },
  received:  { label: "Recibida",  icon: CheckCircle, cls: "bg-green-500/20 text-green-600 border-green-500/30" },
  cancelled: { label: "Cancelada", icon: XCircle,     cls: "bg-red-500/20 text-red-600 border-red-500/30" },
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

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { dateStyle: "medium" })
}

// ─── Export helpers ──────────────────────────────────────────────────────────

async function exportExcel(purchases: any[], totalRevenue: number) {
  const XLSX = await import("xlsx")

  const received  = purchases.filter((p) => p.status === "received")
  const cancelled = purchases.filter((p) => p.status === "cancelled")

  const toRow = (p: any) => ({
    ID: p._id?.slice(-8),
    Proveedor: p.supplierName,
    Estado: STATUS_MAP[p.status]?.label ?? p.status,
    Artículos: (p.items ?? []).map((it: any) => `${it.name} ×${it.quantity}`).join(", "),
    "Costo Total": p.totalCost ?? 0,
    Notas: p.notes ?? "",
    Fecha: formatDate(p.createdAt),
  })

  const wsReceived  = XLSX.utils.json_to_sheet(received.length ? received.map(toRow) : [{ Nota: "Sin compras recibidas" }])
  const wsCancelled = XLSX.utils.json_to_sheet(cancelled.length ? cancelled.map(toRow) : [{ Nota: "Sin compras canceladas" }])

  // Summary
  const totalGastado   = received.reduce((a, p) => a + (p.totalCost ?? 0), 0)
  const totalCancelado = cancelled.reduce((a, p) => a + (p.totalCost ?? 0), 0)
  const balance = totalRevenue - totalGastado

  const wsSummary = XLSX.utils.json_to_sheet([
    { Concepto: "Total Ingresos (ventas activas)", Monto: totalRevenue },
    { Concepto: "Total Gastado (compras recibidas)", Monto: totalGastado },
    { Concepto: "Total Cancelado (compras canceladas)", Monto: totalCancelado },
    { Concepto: "Balance (Ingresos − Gastos)", Monto: balance },
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsSummary,    "Resumen")
  XLSX.utils.book_append_sheet(wb, wsReceived,   "Compras recibidas")
  XLSX.utils.book_append_sheet(wb, wsCancelled,  "Compras canceladas")

  XLSX.writeFile(wb, `compras_${new Date().toISOString().slice(0, 10)}.xlsx`)
  toast.success("Reporte Excel de compras descargado.")
}

async function exportPDF(purchases: any[], totalRevenue: number) {
  const { default: jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default

  const received  = purchases.filter((p) => p.status === "received")
  const cancelled = purchases.filter((p) => p.status === "cancelled")

  const totalGastado   = received.reduce((a, p) => a + (p.totalCost ?? 0), 0)
  const totalCancelado = cancelled.reduce((a, p) => a + (p.totalCost ?? 0), 0)
  const balance = totalRevenue - totalGastado

  const doc = new jsPDF()
  const today = new Date().toLocaleDateString("es-CO", { dateStyle: "long" })

  doc.setFontSize(16)
  doc.text("Informe de Compras – NexusCart", 14, 18)
  doc.setFontSize(10)
  doc.text(`Generado: ${today}`, 14, 26)

  /* Resumen financiero */
  autoTable(doc, {
    startY: 32,
    head: [["Concepto", "Monto"]],
    body: [
      ["Total Ingresos (ventas activas)", formatCOP(totalRevenue)],
      ["Total Gastado (compras recibidas)", formatCOP(totalGastado)],
      ["Total Cancelado (compras canceladas)", formatCOP(totalCancelado)],
      ["Balance (Ingresos − Gastos)", formatCOP(balance)],
    ],
    theme: "grid",
    headStyles: { fillColor: [99, 102, 241] },
  })

  /* Detalle de compras recibidas */
  const afterSummary = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(12)
  doc.text("Detalle de Compras Recibidas", 14, afterSummary)

  autoTable(doc, {
    startY: afterSummary + 4,
    head: [["ID", "Proveedor", "Artículos", "Costo Total", "Fecha"]],
    body: received.map((p) => [
      `#${p._id?.slice(-8)}`,
      p.supplierName,
      (p.items ?? []).map((it: any) => `${it.name} ×${it.quantity}`).join(", "),
      formatCOP(p.totalCost),
      formatDate(p.createdAt),
    ]),
    theme: "striped",
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 8 },
  })

  /* Gasto por proveedor */
  const supplierMap: Record<string, number> = {}
  for (const p of received) {
    supplierMap[p.supplierName] = (supplierMap[p.supplierName] ?? 0) + (p.totalCost ?? 0)
  }
  const supplierRows = Object.entries(supplierMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, total]) => [name, formatCOP(total)])

  if (supplierRows.length > 0) {
    const afterReceived = (doc as any).lastAutoTable.finalY + 10
    if (afterReceived > 250) doc.addPage()
    const startY = afterReceived > 250 ? 14 : afterReceived
    doc.setFontSize(12)
    doc.text("Gasto por Proveedor", 14, startY)
    autoTable(doc, {
      startY: startY + 4,
      head: [["Proveedor", "Total Gastado"]],
      body: supplierRows,
      theme: "striped",
      headStyles: { fillColor: [249, 115, 22] },
      styles: { fontSize: 9 },
    })
  }

  /* Compras canceladas */
  if (cancelled.length > 0) {
    doc.addPage()
    doc.setFontSize(12)
    doc.text("Detalle de Compras Canceladas", 14, 14)
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Proveedor", "Artículos", "Costo Total", "Fecha"]],
      body: cancelled.map((p) => [
        `#${p._id?.slice(-8)}`,
        p.supplierName,
        (p.items ?? []).map((it: any) => `${it.name} ×${it.quantity}`).join(", "),
        formatCOP(p.totalCost),
        formatDate(p.createdAt),
      ]),
      theme: "striped",
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 8 },
    })
  }

  doc.save(`compras_${new Date().toISOString().slice(0, 10)}.pdf`)
  toast.success("Reporte PDF de compras descargado.")
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ComprasAdmin() {
  const { data: purchases, isLoading, isValidating } = useSWR<any[]>(
    "/api/admin/purchases",
    fetcher,
    { refreshInterval: 8000 }
  )
  const { data: sales } = useSWR<any[]>("/api/admin/sales", fetcher)
  const { data: suppliers } = useSWR<any[]>("/api/admin/suppliers", fetcher)
  const { data: products } = useSWR<any[]>("/api/admin/products", fetcher)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [detail, setDetail] = useState<any>(null)
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const totalCost = form.items.reduce((s, it) => s + it.quantity * it.unitCost, 0)

  // ── Summary metrics ──
  const receivedPurchases  = (purchases ?? []).filter((p) => p.status === "received")
  const cancelledPurchases = (purchases ?? []).filter((p) => p.status === "cancelled")
  const totalSpent   = receivedPurchases.reduce((sum, p) => sum + (p.totalCost ?? 0), 0)
  const totalCancelled = cancelledPurchases.reduce((sum, p) => sum + (p.totalCost ?? 0), 0)
  // Ingresos coherentes con ventas y dashboard: solo ventas activas (no canceladas)
  const activeSales = (sales ?? []).filter((s: any) => s.status !== "cancelled")
  const totalRevenue = activeSales.reduce((sum: number, v: any) => sum + (v.total ?? 0), 0)
  const balance = totalRevenue - totalSpent

  // ── Filters ──
  const filtered = (purchases ?? []).filter((p) => {
    const matchSearch =
      !search ||
      p.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
      p._id?.includes(search)
    const matchStatus = filter === "all" || p.status === filter
    return matchSearch && matchStatus
  })

  // ── Form helpers ──
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

  async function handleExport(type: "excel" | "pdf") {
    if (!(purchases ?? []).length) { toast.error("No hay datos para exportar."); return }
    setExporting(true)
    setShowExportMenu(false)
    try {
      if (type === "excel") await exportExcel(purchases!, totalRevenue)
      else await exportPDF(purchases!, totalRevenue)
    } catch (e) {
      console.error(e)
      toast.error("Error al generar el reporte.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" /> Compras
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {(purchases ?? []).length} órdenes de compra ·{" "}
            <span className="text-orange-600 font-medium">{formatCOP(totalSpent)} gastado</span>
            {isValidating && <RefreshCw className="inline h-3 w-3 ml-2 animate-spin text-muted-foreground" />}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Export dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              className="gap-2"
              disabled={exporting}
              onClick={() => setShowExportMenu((v) => !v)}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exportando..." : "Exportar"}
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                <button
                  onClick={() => handleExport("excel")}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  Exportar Excel
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  Exportar PDF
                </button>
              </div>
            )}
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva Compra
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total gastado</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{formatCOP(totalSpent)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{receivedPurchases.length} compras recibidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Canceladas</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{formatCOP(totalCancelled)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{cancelledPurchases.length} compras canceladas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" /> Ingresos
            </p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCOP(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ventas activas (sin canceladas)</p>
          </CardContent>
        </Card>
        <Card className={balance >= 0 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Scale className="h-3 w-3" /> Balance
            </p>
            <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? "text-green-600" : "text-red-500"}`}>
              {formatCOP(balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Ingresos − Gastos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <Input
              className="max-w-xs"
              placeholder="Buscar por proveedor o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "Proveedor", "Artículos", "Costo Total", "Estado", "Fecha", ""].map((h) => (
                      <th key={h} className="pb-3 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const st = STATUS_MAP[p.status] ?? STATUS_MAP.pending
                    const isCancelled = p.status === "cancelled"
                    return (
                      <tr
                        key={p._id}
                        className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${
                          isCancelled ? "opacity-70" : ""
                        }`}
                      >
                        <td className="py-3 font-mono text-xs text-muted-foreground">
                          #{p._id?.slice(-8)}
                        </td>
                        <td className="py-3 font-medium">{p.supplierName}</td>
                        <td className="py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                          {(p.items ?? []).map((it: any) => `${it.name} ×${it.quantity}`).join(", ")}
                        </td>
                        <td className="py-3 font-semibold">{formatCOP(p.totalCost)}</td>
                        <td className="py-3">
                          {isCancelled ? (
                            <div className="flex items-center gap-1">
                              <Badge className={`text-xs ${STATUS_MAP.cancelled.cls}`}>
                                <Ban className="h-3 w-3 mr-1" />
                                Cancelada
                              </Badge>
                            </div>
                          ) : (
                            <Select value={p.status} onValueChange={(val) => changeStatus(p._id, val)}>
                              <SelectTrigger className="h-7 text-xs w-36">
                                <SelectValue>
                                  <Badge className={`text-xs ${st.cls}`}>
                                    <st.icon className="h-3 w-3 mr-1" />{st.label}
                                  </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="received">Recibida</SelectItem>
                                <SelectItem value="cancelled" disabled={p.status === "received"}>Cancelada</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString("es-CO")}
                        </td>
                        <td className="py-3">
                          <Button size="sm" variant="ghost" onClick={() => setDetail(p)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        No hay compras que coincidan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      {detail && (
        <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalle Compra #{detail._id?.slice(-8)}</DialogTitle>
            </DialogHeader>
            <div className="text-sm space-y-2">
              <p><span className="font-medium">Proveedor:</span> {detail.supplierName}</p>
              <p>
                <span className="font-medium">Estado:</span>{" "}
                <Badge className={`text-xs ${STATUS_MAP[detail.status]?.cls ?? ""}`}>
                  {STATUS_MAP[detail.status]?.label ?? detail.status}
                </Badge>
              </p>
              {detail.notes && <p><span className="font-medium">Notas:</span> {detail.notes}</p>}
              <div className="border-t border-border pt-2">
                <p className="font-medium mb-1">Artículos:</p>
                {(detail.items ?? []).map((it: any, i: number) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{it.name} ×{it.quantity}</span>
                    <span>{formatCOP(it.unitCost * it.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between font-bold">
                  <span>Costo Total</span>
                  <span>{formatCOP(detail.totalCost)}</span>
                </div>
              </div>
              {detail.createdAt && (
                <p className="text-xs text-muted-foreground">Fecha: {formatDate(detail.createdAt)}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

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
                Total estimado: <span className="text-primary">{formatCOP(totalCost)}</span>
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
