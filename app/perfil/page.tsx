"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Package, LogOut, Settings, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/store/auth-store"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PerfilPage() {
  const router = useRouter()
  const { user, setUser, logout } = useAuthStore()

  const { data } = useSWR("/api/auth/me", fetcher)

  useEffect(() => {
    if (data?.user) {
      setUser(data.user)
    } else if (data && !data.user && !user) {
      // Not logged in
    }
  }, [data, setUser, user])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 px-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Mi cuenta</h1>
        <p className="text-muted-foreground">
          Inicia sesion para ver tu perfil y gestionar tus pedidos
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/login">Iniciar sesion</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/registro">Crear cuenta</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Mi cuenta</h1>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {user.name}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Miembro desde{" "}
              {new Date(user.createdAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/perfil/pedidos"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
        >
          <Package className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Mis pedidos</p>
            <p className="text-sm text-muted-foreground">
              Ver historial de compras
            </p>
          </div>
        </Link>
        <Link
          href="/perfil/configuracion"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Configuracion</p>
            <p className="text-sm text-muted-foreground">
              Gestionar tu cuenta
            </p>
          </div>
        </Link>
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
          >
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Panel Admin</p>
              <p className="text-sm text-muted-foreground">
                Gestionar la tienda
              </p>
            </div>
          </Link>
        )}
      </div>

      <Separator className="my-6" />

      <Button
        variant="outline"
        onClick={handleLogout}
        className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesion
      </Button>
    </div>
  )
}
