import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/lib/types"

interface AuthState {
  user: User | null
  isLoading: boolean
  /** true cuando Zustand ya leyó localStorage (hidratación completada) */
  isHydrated: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  _setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isHydrated: false,

      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        set({ user: null })
        fetch("/api/auth/logout", { method: "POST" })
      },

      _setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "nexuscart-auth",
      // Se llama cuando Zustand termina de leer localStorage
      onRehydrateStorage: () => (state) => {
        state?._setHydrated()
      },
    }
  )
)
