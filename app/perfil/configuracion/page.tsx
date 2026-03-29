"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import { SITE_CONFIG } from "@/lib/constants"

export default function ConfiguracionPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: SITE_CONFIG.defaultCountry,
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    setForm((f) => ({
      ...f,
      name: user.name ?? "",
      country: user.country ?? SITE_CONFIG.defaultCountry,
    }))
    const f = async () => {
      try {
        const res = await fetch("/api/user/profile")
        if (res.status === 401) {
          router.push("/login")
          return
        }
        const data = await res.json()
        if (res.status === 503 && data.enableUrl) {
          toast.error(data.error ?? "Activa Firestore para cargar el perfil.", { duration: 8000 })
          if (typeof window !== "undefined") window.open(data.enableUrl, "_blank")
        } else if (res.ok && data.profile) {
          const p = data.profile
          setForm({
            name: p.name ?? user?.name ?? "",
            phone: p.phone ?? "",
            address: p.address ?? "",
            city: p.city ?? "",
            state: p.state ?? "",
            zipCode: p.zipCode ?? "",
            country: p.country ?? SITE_CONFIG.defaultCountry,
          })
        }
      } catch {
        toast.error("Error al cargar perfil")
      } finally {
        setLoading(false)
      }
    }
    f()
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 503 && data.enableUrl) {
          toast.error(data.error ?? "Activa Firestore para guardar el perfil.", { duration: 8000 })
          if (typeof window !== "undefined") window.open(data.enableUrl, "_blank")
        } else {
          toast.error(data.error ?? "Error al guardar")
        }
        return
      }
      const data = await res.json()
      setUser({ ...user, ...data.profile })
      toast.success("Perfil actualizado")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-xl px-4 py-8 lg:px-8">
      <Link
        href="/perfil"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mi cuenta
      </Link>

      <h1 className="mb-8 text-3xl font-bold text-foreground">
        Gestión de la cuenta
      </h1>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6"
        >
          <div>
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="email">Correo (no editable)</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="mt-1.5 bg-muted"
            />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+57 300 123 4567"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              placeholder="Calle 123 #45-67"
              className="mt-1.5"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                placeholder="Bogotá"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="state">Departamento / Estado</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value }))
                }
                placeholder="Cundinamarca"
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="zipCode">Código postal</Label>
              <Input
                id="zipCode"
                value={form.zipCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, zipCode: e.target.value }))
                }
                placeholder="110111"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country: e.target.value }))
                }
                className="mt-1.5"
              />
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      )}
    </div>
  )
}
