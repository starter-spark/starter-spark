"use client"

import { useEffect } from "react"
import { useCartStore } from "@/store/cart"
import { trackPurchaseCompleted } from "@/lib/analytics"

interface ClearCartProps {
  orderId: string
  total: number
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
}

export function ClearCart({ orderId, total, items }: ClearCartProps) {
  const clearCart = useCartStore((state) => state.clearCart)

  useEffect(() => {
    // Track purchase completed event
    trackPurchaseCompleted({
      orderId,
      total,
      items,
    })

    // Clear the cart after successful checkout
    clearCart()
  }, [clearCart, orderId, total, items])

  return null
}
