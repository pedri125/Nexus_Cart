"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import { SITE_CONFIG } from "@/lib/constants"

export default function RegistroPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = (formData.get("name") as string).trim()
    const email = (formData.get("email") as string).trim().toLowerCase()
    const password = formData.get("password") as string

    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
      const idToken = await cred.user.getIdToken()

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 503 && data.enableUrl) {
          toast.error(
            data.error ?? "Activa Firestore para poder registrarte.",
            { duration: 8000 }
          )
          if (typeof window !== "undefined") window.open(data.enableUrl, "_blank")
        } else {
          toast.error(data.error ?? "Error al registrar")
        }
        return
      }

      setUser(data.user)
      toast.success("Cuenta creada exitosamente")
      router.push("/perfil")
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "code" in err
          ? (err as { code: string }).code === "auth/email-already-in-use"
            ? "Este correo ya está registrado"
            : (err as { message?: string }).message ?? "Error de conexión"
          : "Error de conexión"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Crear cuenta</h1>
        <p className="mt-2 text-muted-foreground">
          Unete a {SITE_CONFIG.name} y disfruta de las mejores ofertas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            name="name"
            placeholder="Juan Garcia"
            required
            className="mt-1.5"
          />
        </div>

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
              placeholder="Minimo 6 caracteres"
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
          {isLoading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Iniciar sesion
        </Link>
      </p>
    </div>
  )
}
