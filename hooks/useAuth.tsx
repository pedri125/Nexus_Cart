"use client"

import { useCallback } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import { firebaseAuth } from "@/lib/firebaseClient"
import { useAuthStore } from "@/store/auth-store"

/**
 * Hook de autenticación unificado.
 * Usa useAuthStore como única fuente de verdad.
 * Sincroniza el estado de Firebase Auth con el store en cada operación.
 */
export function useAuth() {
  const { user, isLoading, isHydrated, setUser, setLoading } = useAuthStore()

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setLoading(true)
      try {
        const cred = await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        )
        const idToken = await cred.user.getIdToken()

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, name }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Error al registrar usuario")

        setUser(data.user)
      } catch (error: any) {
        throw new Error(error.message ?? "Error al registrar usuario")
      } finally {
        setLoading(false)
      }
    },
    [setUser, setLoading]
  )

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      try {
        const cred = await signInWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        )
        const idToken = await cred.user.getIdToken()

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Error al iniciar sesión")

        setUser(data.user)
      } catch (error: any) {
        throw new Error(error.message ?? "Error al iniciar sesión")
      } finally {
        setLoading(false)
      }
    },
    [setUser, setLoading]
  )

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await signOut(firebaseAuth)
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
    } catch (error: any) {
      throw new Error(error.message ?? "Error al cerrar sesión")
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading])

  return {
    user,
    loading: isLoading,
    isHydrated,
    register,
    login,
    logout,
  }
}
