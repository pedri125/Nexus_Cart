"use client"

import { useState } from "react"
import useSWR from "swr"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AlertasAdmin() {
  const [threshold, setThreshold] = useState(10)
  const [inputVal, setInputVal] = useState("10")
  const { data, isLoading, mutate } = useSWR<{ alerts: any[]; threshold: number }>(
    `/api/admin/alerts?threshold=${threshold}`, fetcher
  )

  const alerts = data?.alerts ?? []

  function applyThreshold() {
    const n = parseInt(inputVal)
    if (!isNaN(n) && n >= 0) setThreshold(n)
  }

  const urgentCount = alerts.filter((a) => a.stock === 0).length
  const lowCount = alerts.filter((a) => a.stock > 0 && a.stock <= 5).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" /> Alertas de Stock
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {alerts.length} producto(s) con stock ≤ {threshold}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-destructive">{urgentCount}</p>
            <p className="text-sm text-muted-foreground">Sin stock (0 uds)</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-amber-600">{lowCount}</p>
            <p className="text-sm text-muted-foreground">Stock crítico (1–5 uds)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-foreground">{alerts.length - urgentCount - lowCount}</p>
            <p className="text-sm text-muted-foreground">Stock bajo (6–{threshold} uds)</p>
          </CardContent>
        </Card>
      </div>

      {/* Threshold control */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-end gap-3">
            <div className="grid gap-1">
              <Label>Umbral de alerta (uds)</Label>
              <Input type="number" min={0} className="w-32" value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
            </div>
            <Button onClick={applyThreshold}>Aplicar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts table */}
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Cargando...</div>
          ) : alerts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg font-medium text-foreground">¡Todo bien!</p>
              <p className="text-muted-foreground text-sm mt-1">No hay productos con stock por debajo de {threshold}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Producto", "Categoría", "Marca", "Stock", "Estado"].map((h) => (
                      <th key={h} className="pb-3 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((p) => (
                    <tr key={p._id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="py-3 font-medium">{p.name}</td>
                      <td className="py-3"><Badge variant="secondary" className="capitalize text-xs">{p.category}</Badge></td>
                      <td className="py-3 text-muted-foreground">{p.brand}</td>
                      <td className="py-3">
                        <span className={`font-bold text-lg ${p.stock === 0 ? "text-destructive" : p.stock <= 5 ? "text-amber-600" : "text-foreground"}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3">
                        {p.stock === 0
                          ? <Badge variant="destructive" className="text-xs">Sin stock</Badge>
                          : p.stock <= 5
                          ? <Badge className="text-xs bg-amber-500/20 text-amber-600 border-amber-500/30">Crítico</Badge>
                          : <Badge className="text-xs bg-orange-500/20 text-orange-600 border-orange-500/30">Bajo</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
