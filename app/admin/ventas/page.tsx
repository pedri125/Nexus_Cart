"use client"

import { useState, useCallback } from "react"
import useSWR, { mutate } from "swr"
import {
  TrendingUp, Eye, Download, FileSpreadsheet, FileText,
  RefreshCw, Ban
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { formatCOP } from "@/lib/constants"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-500/20 text-amber-600 border-amber-500/30",
  processing: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  shipped:    "bg-purple-500/20 text-purple-600 border-purple-500/30",
  delivered:  "bg-green-500/20 text-green-600 border-green-500/30",
  cancelled:  "bg-red-500/20 text-red-600 border-red-500/30",
}
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente", processing: "En proceso", shipped: "Enviado",
  delivered: "Entregado", cancelled: "Cancelado",
}

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { dateStyle: "medium" })
}

// ─── Export helpers ──────────────────────────────────────────────────────────

async function exportExcel(sales: any[]) {
  const XLSX = await import("xlsx")

  const income = sales.filter((s) => s.status !== "cancelled")
  const refunds = sales.filter((s) => s.status === "cancelled")

  const toRow = (s: any) => ({
    ID: s._id?.slice(-8),
    Cliente: s.userEmail,
    "Estado": STATUS_LABELS[s.status] ?? s.status,
    Método: s.paymentMethod,
    Subtotal: s.subtotal ?? 0,
    IVA: s.tax ?? 0,
    Total: s.total ?? 0,
    Fecha: formatDate(s.createdAt),
  })

  const wbIncome  = XLSX.utils.json_to_sheet(income.map(toRow))
  const wbRefunds = XLSX.utils.json_to_sheet(refunds.length ? refunds.map(toRow) : [{ Nota: "Sin devoluciones" }])

  // Summary
  const totalIngresos   = income.reduce((a, s) => a + (s.total ?? 0), 0)
  const totalDevoluciones = refunds.reduce((a, s) => a + (s.total ?? 0), 0)
  const neto = totalIngresos - totalDevoluciones
  const wbSummary = XLSX.utils.json_to_sheet([
    { Concepto: "Total Ingresos (ventas activas)", Monto: totalIngresos },
    { Concepto: "Total Devoluciones (canceladas)", Monto: totalDevoluciones },
    { Concepto: "Ingreso Neto", Monto: neto },
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wbSummary,  "Resumen")
  XLSX.utils.book_append_sheet(wb, wbIncome,   "Ingresos")
  XLSX.utils.book_append_sheet(wb, wbRefunds,  "Devoluciones")

  XLSX.writeFile(wb, `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`)
  toast.success("Reporte Excel descargado.")
}

async function exportPDF(sales: any[]) {
  const { default: jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default

  const income  = sales.filter((s) => s.status !== "cancelled")
  const refunds = sales.filter((s) => s.status === "cancelled")

  const totalIngresos     = income.reduce((a, s) => a + (s.total ?? 0), 0)
  const totalDevoluciones = refunds.reduce((a, s) => a + (s.total ?? 0), 0)
  const neto = totalIngresos - totalDevoluciones

  const doc = new jsPDF()
  const today = new Date().toLocaleDateString("es-CO", { dateStyle: "long" })

  doc.setFontSize(16)
  doc.text("Informe de Ventas – NexusCart", 14, 18)
  doc.setFontSize(10)
  doc.text(`Generado: ${today}`, 14, 26)

  /* Resumen box */
  autoTable(doc, {
    startY: 32,
    head: [["Concepto", "Monto"]],
    body: [
      ["Total Ingresos (ventas activas)", formatCOP(totalIngresos)],
      ["Total Devoluciones / Reembolsos  (canceladas)", formatCOP(totalDevoluciones)],
      ["Ingreso Neto", formatCOP(neto)],
    ],
    theme: "grid",
    headStyles: { fillColor: [99, 102, 241] },
  })

  /* Ingresos table */
  const afterSummary = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(12)
  doc.text("Detalle de Ingresos", 14, afterSummary)

  autoTable(doc, {
    startY: afterSummary + 4,
    head: [["ID", "Cliente", "Estado", "Método", "Subtotal", "IVA", "Total", "Fecha"]],
    body: income.map((s) => [
      `#${s._id?.slice(-8)}`,
      s.userEmail,
      STATUS_LABELS[s.status] ?? s.status,
      s.paymentMethod,
      formatCOP(s.subtotal),
      formatCOP(s.tax),
      formatCOP(s.total),
      formatDate(s.createdAt),
    ]),
    theme: "striped",
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 8 },
  })

  /* Devoluciones table */
  if (refunds.length > 0) {
    const afterIncome = (doc as any).lastAutoTable.finalY + 10
    doc.addPage()
    doc.setFontSize(12)
    doc.text("Detalle de Devoluciones / Reembolsos", 14, 14)
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Cliente", "Método", "Subtotal", "IVA", "Total Reembolso", "Fecha"]],
      body: refunds.map((s) => [
        `#${s._id?.slice(-8)}`,
        s.userEmail,
        s.paymentMethod,
        formatCOP(s.subtotal),
        formatCOP(s.tax),
        formatCOP(s.total),
        formatDate(s.createdAt),
      ]),
      theme: "striped",
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 8 },
    })
  }

  doc.save(`ventas_${new Date().toISOString().slice(0, 10)}.pdf`)
  toast.success("Reporte PDF descargado.")
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VentasAdmin() {
  // F5 – refreshInterval for near-real-time sync
  const { data: sales, isLoading, isValidating } = useSWR<any[]>(
    "/api/admin/sales",
    fetcher,
    { refreshInterval: 8000 }
  )
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [detail, setDetail] = useState<any>(null)
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const filtered = (sales ?? []).filter((s) => {
    const matchSearch =
      !search ||
      s.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      s._id?.includes(search)
    const matchStatus = filter === "all" || s.status === filter
    return matchSearch && matchStatus
  })

  const activeSales  = (sales ?? []).filter((s) => s.status !== "cancelled")
  const cancelledSales = (sales ?? []).filter((s) => s.status === "cancelled")
  const totalRevenue = activeSales.reduce((sum, v) => sum + (v.total ?? 0), 0)
  const totalRefunds = cancelledSales.reduce((sum, v) => sum + (v.total ?? 0), 0)
  const delivered    = (sales ?? []).filter((s) => s.status === "delivered").length

  async function changeStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/sales/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "No se pudo cambiar el estado.")
    } else {
      toast.success("Estado actualizado.")
    }
    await mutate("/api/admin/sales")
  }

  async function handleExport(type: "excel" | "pdf") {
    if (!sales?.length) { toast.error("No hay datos para exportar."); return }
    setExporting(true)
    setShowExportMenu(false)
    try {
      if (type === "excel") await exportExcel(sales)
      else await exportPDF(sales)
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
            <TrendingUp className="h-6 w-6 text-primary" /> Ventas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {(sales ?? []).length} ventas ·{" "}
            <span className="text-green-600 font-medium">{formatCOP(totalRevenue)} ingresos</span>
            {totalRefunds > 0 && (
              <> · <span className="text-red-500 font-medium">{formatCOP(totalRefunds)} devoluciones</span></>
            )}
            · {delivered} entregadas
            {isValidating && <RefreshCw className="inline h-3 w-3 ml-2 animate-spin text-muted-foreground" />}
          </p>
        </div>

        {/* F4 – Export dropdown */}
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
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Ingresos netos</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCOP(totalRevenue - totalRefunds)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total ingresos</p>
            <p className="text-2xl font-bold mt-1">{formatCOP(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Devoluciones</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{formatCOP(totalRefunds)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <Input
              className="max-w-xs"
              placeholder="Buscar por email o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
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
                    {["ID", "Cliente", "Total", "Método", "Estado", "Fecha", ""].map((h) => (
                      <th key={h} className="pb-3 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const isCancelled = s.status === "cancelled"
                    return (
                      <tr
                        key={s._id}
                        className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${
                          isCancelled ? "opacity-70" : ""
                        }`}
                      >
                        <td className="py-3 font-mono text-xs text-muted-foreground">
                          #{s._id?.slice(-8)}
                        </td>
                        <td className="py-3">{s.userEmail}</td>
                        <td className="py-3 font-semibold">{formatCOP(s.total)}</td>
                        <td className="py-3 capitalize text-muted-foreground">{s.paymentMethod}</td>
                        <td className="py-3">
                          {/* F1 – Cancelled state is locked; show badge instead of select */}
                          {isCancelled ? (
                            <div className="flex items-center gap-1">
                              <Badge className={`text-xs ${STATUS_COLORS.cancelled}`}>
                                <Ban className="h-3 w-3 mr-1" />
                                Cancelado
                              </Badge>
                            </div>
                          ) : (
                            <Select
                              value={s.status}
                              onValueChange={(val) => changeStatus(s._id, val)}
                            >
                              <SelectTrigger className="h-7 text-xs w-36">
                                <SelectValue>
                                  <Badge className={`text-xs ${STATUS_COLORS[s.status] ?? ""}`}>
                                    {STATUS_LABELS[s.status] ?? s.status}
                                  </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                  <SelectItem
                                    key={k}
                                    value={k}
                                    disabled={k === "cancelled" && s.status === "delivered"}
                                  >
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString("es-CO")}
                        </td>
                        <td className="py-3">
                          <Button size="sm" variant="ghost" onClick={() => setDetail(s)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        No hay ventas que coincidan.
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
              <DialogTitle>Detalle Venta #{detail._id?.slice(-8)}</DialogTitle>
            </DialogHeader>
            <div className="text-sm space-y-2">
              <p><span className="font-medium">Cliente:</span> {detail.userEmail}</p>
              <p><span className="font-medium">Pago:</span> {detail.paymentMethod}</p>
              <p>
                <span className="font-medium">Estado:</span>{" "}
                <Badge className={`text-xs ${STATUS_COLORS[detail.status] ?? ""}`}>
                  {STATUS_LABELS[detail.status] ?? detail.status}
                </Badge>
              </p>
              <div className="border-t border-border pt-2">
                <p className="font-medium mb-1">Artículos:</p>
                {(detail.items ?? []).map((it: any, i: number) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{it.name} x{it.quantity}</span>
                    <span>{formatCOP(it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-2 space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCOP(detail.subtotal)}</span></div>
                <div className="flex justify-between"><span>IVA</span><span>{formatCOP(detail.tax)}</span></div>
                {detail.status === "cancelled" && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Reembolso procesado</span>
                    <span>-{formatCOP(detail.total)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-border pt-1">
                  <span>Total</span>
                  <span>{formatCOP(detail.total)}</span>
                </div>
              </div>
              {detail.status === "cancelled" && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 mt-2">
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ Esta venta fue cancelada. El importe de {formatCOP(detail.total)} fue registrado como devolución/reembolso.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
