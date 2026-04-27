"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signInWithEmailAndPassword } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebaseClient"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import { SITE_CONFIG } from "@/lib/constants"

export default function LoginPage() {
  const router = useRouter()
  const { user, isHydrated, setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // If the user is already logged in as admin, redirect immediately to admin panel
  useEffect(() => {
    if (!isHydrated) return
    if (user?.role === "admin") {
      window.location.href = "/admin"
    }
  }, [isHydrated, user])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = (formData.get("email") as string).trim()
    const password = formData.get("password") as string

    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
      const idToken = await cred.user.getIdToken()

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Error al iniciar sesión")
        return
      }

      setUser(data.user)
      toast.success("Bienvenido de vuelta")
      if (data.user?.role === "admin") {
        // Use hard redirect to ensure session cookies are available on the admin page
        window.location.href = "/admin"
        return
      } else {
        router.push("/perfil")
      }
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : ""
      const message =
        code === "auth/invalid-credential" || code === "auth/wrong-password"
          ? "Correo o contraseña incorrectos"
          : code === "auth/user-not-found"
            ? "No existe una cuenta con este correo"
            : code === "auth/too-many-requests"
              ? "Demasiados intentos. Prueba más tarde"
              : err && typeof err === "object" && "message" in err
                ? String((err as { message: string }).message)
                : "Error de conexión"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Iniciar sesion</h1>
        <p className="mt-2 text-muted-foreground">
          Accede a tu cuenta de {SITE_CONFIG.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Correo electronico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@correo.com"
            required
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="password">Contrasena</Label>
          <div className="relative mt-1.5">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Tu contrasena"
              required
              minLength={6}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
          {isLoading ? "Iniciando sesion..." : "Iniciar sesion"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-primary hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}
