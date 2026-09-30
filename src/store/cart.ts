import { create } from 'zustand'
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware'

export interface CartItem {
  slug: string
  name: string
  price: number
  quantity: number
  image?: string
  originalPrice?: number
  /** Max quantity available (from stock tracking). Undefined means unlimited. */
  maxQuantity?: number
  /** Filament colour chosen for 3D-printed parts, when the product offers a choice. */
  color?: string
}

/** Identifies a cart line: the same product in two colours is two lines. */
export const cartItemKey = (item: Pick<CartItem, 'slug' | 'color'>) =>
  item.color ? `${item.slug}::${item.color}` : item.slug

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  /** Takes a line key from `cartItemKey` (a bare slug for items without a colour). */
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
}

type CartStore = CartState & CartActions

const memoryStorage = (() => {
  const storage = new Map<string, string>()
  const api: StateStorage = {
    getItem: (name) => storage.get(name) ?? null,
    setItem: (name, value) => {
      storage.set(name, value)
    },
    removeItem: (name) => {
      storage.delete(name)
    },
  }
  return api
})()

const storage = createJSONStorage(() => {
  if (typeof window === 'undefined') return memoryStorage
  return window.localStorage
})

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, quantity = 1) => {
        const items = get().items
        const key = cartItemKey(item)
        const existingItem = items.find((i) => cartItemKey(i) === key)

        if (existingItem) {
          // Respect maxQuantity if set
          const maxQty = item.maxQuantity ?? existingItem.maxQuantity
          const newQuantity = existingItem.quantity + quantity
          const clampedQuantity = maxQty ? Math.min(newQuantity, maxQty) : newQuantity

          set({
            items: items.map((i) =>
              cartItemKey(i) === key
                ? { ...i, quantity: clampedQuantity, maxQuantity: maxQty }
                : i,
            ),
          })
        } else {
          // Respect maxQuantity on first add
          const clampedQuantity = item.maxQuantity
            ? Math.min(quantity, item.maxQuantity)
            : quantity

          set({
            items: [...items, { ...item, quantity: clampedQuantity }],
          })
        }

        set({ isOpen: true })
      },

      removeItem: (key) => {
        set({
          items: get().items.filter((i) => cartItemKey(i) !== key),
        })
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key)
          return
        }

        const item = get().items.find((i) => cartItemKey(i) === key)
        const clampedQuantity = item?.maxQuantity
          ? Math.min(quantity, item.maxQuantity)
          : quantity

        set({
          items: get().items.map((i) =>
            cartItemKey(i) === key ? { ...i, quantity: clampedQuantity } : i,
          ),
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen })
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },
    }),
    {
      name: 'starterspark-cart',
      storage,
      partialize: (state) => ({ items: state.items }),
    },
  ),
)

// Selectors

export const selectCartTotal = (state: CartStore) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0)

export const selectCartCount = (state: CartStore) =>
  state.items.reduce((count, item) => count + item.quantity, 0)

export const selectCartSavings = (state: CartStore) =>
  state.items.reduce((savings, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return savings + (item.originalPrice - item.price) * item.quantity
    }
    return savings
  }, 0)
