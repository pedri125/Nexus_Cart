import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "@/lib/types"

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => { success: boolean; message?: string }
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string }
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const state = get()
        const existingItem = state.items.find(
          (i) => i.productId === item.productId
        )
        const maxStock = item.maxStock ?? Infinity
        const currentQty = existingItem?.quantity ?? 0
        const newQty = currentQty + item.quantity

        if (newQty > maxStock) {
          // Si ya tiene el máximo, no añadir
          if (currentQty >= maxStock) {
            return {
              success: false,
              message: `Solo hay ${maxStock} unidades disponibles`,
            }
          }
          // Añadir solo hasta el límite
          const addable = maxStock - currentQty
          set((s) => ({
            items: s.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: maxStock }
                : i
            ),
          }))
          return {
            success: true,
            message: `Se añadieron ${addable} unidades (límite de stock alcanzado)`,
          }
        }

        if (existingItem) {
          set((s) => ({
            items: s.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          }))
        } else {
          set((s) => ({ items: [...s.items, item] }))
        }
        return { success: true }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        const item = get().items.find((i) => i.productId === productId)
        const maxStock = item?.maxStock ?? Infinity

        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
          }))
          return { success: true }
        }

        if (quantity > maxStock) {
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity: maxStock } : i
            ),
          }))
          return {
            success: false,
            message: `Máximo de stock disponible: ${maxStock}`,
          }
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }))
        return { success: true }
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: "nexuscart-cart",
    }
  )
)
