"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Shield,
} from "lucide-react"
import { useState } from "react"
import { useCartStore } from "@/store/cart"
import { trackAddToCart } from "@/lib/analytics"

interface BuyBoxProps {
  id: string
  slug: string
  name: string
  price: number
  originalPrice?: number | null
  inStock: boolean
  image?: string
  // Discount fields (Phase 14.3)
  discountPercent?: number | null
  discountExpiresAt?: string | null
  // Inventory fields (Phase 14.4)
  stockQuantity?: number | null
  isLimitedStock?: boolean
}

export function BuyBox({
  id,
  slug,
  name,
  price,
  originalPrice,
  inStock,
  image,
  discountPercent,
  discountExpiresAt,
  stockQuantity,
  isLimitedStock,
}: BuyBoxProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  // Check if discount is active (exists and not expired)
  const hasActiveDiscount =
    discountPercent &&
    originalPrice &&
    (!discountExpiresAt || new Date(discountExpiresAt) > new Date())

  // Calculate time remaining for countdown (if discount expires within 7 days)
  const getTimeRemaining = () => {
    if (!discountExpiresAt) return null
    const now = new Date()
    const expires = new Date(discountExpiresAt)
    const diff = expires.getTime() - now.getTime()
    if (diff <= 0) return null
    if (diff > 7 * 24 * 60 * 60 * 1000) return null // More than 7 days, don't show countdown

    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))

    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  const timeRemaining = hasActiveDiscount ? getTimeRemaining() : null

  const handleAddToCart = () => {
    addItem({ slug, name, price, image, originalPrice: hasActiveDiscount ? originalPrice ?? undefined : undefined }, quantity)

    // Track add to cart event
    trackAddToCart({
      id,
      name,
      slug,
      price,
      quantity,
    })

    setQuantity(1) // Reset quantity after adding
  }

  return (
    <div className="sticky top-24 bg-white rounded border border-slate-200 shadow-md p-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-mono text-2xl lg:text-3xl text-slate-900 mb-2">
          {name}
        </h1>
        <Badge
          variant="outline"
          className={`font-mono text-xs ${
            !inStock
              ? "bg-red-50 text-red-700 border-red-200"
              : isLimitedStock
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          {!inStock
            ? "Out of Stock"
            : isLimitedStock && stockQuantity !== null && stockQuantity !== undefined
            ? `Only ${stockQuantity} left`
            : "In Stock"}
        </Badge>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-4xl font-mono text-amber-600">${price.toFixed(2)}</span>
          {hasActiveDiscount && originalPrice && (
            <>
              <span className="text-xl font-mono text-slate-400 line-through">
                ${originalPrice.toFixed(2)}
              </span>
              <span className="px-2 py-1 bg-red-500 text-white text-sm font-mono rounded">
                {discountPercent}% OFF
              </span>
            </>
          )}
        </div>
        {timeRemaining && (
          <p className="text-sm text-red-600 font-mono">
            Sale ends: {timeRemaining}
          </p>
        )}
        {hasActiveDiscount && originalPrice && (
          <p className="text-sm text-green-600 font-mono">
            You save ${(originalPrice - price).toFixed(2)}
          </p>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="text-sm text-slate-600">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded border border-slate-200 flex items-center justify-center hover:border-slate-300 transition-colors cursor-pointer"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4 text-slate-600" />
          </button>
          <span className="w-12 text-center font-mono text-lg">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 rounded border border-slate-200 flex items-center justify-center hover:border-slate-300 transition-colors cursor-pointer"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Add to Cart */}
      <Button
        onClick={handleAddToCart}
        disabled={!inStock}
        className={`w-full h-14 font-mono text-lg ${
          inStock
            ? "bg-cyan-700 hover:bg-cyan-600 text-white"
            : "bg-slate-200 text-slate-500 cursor-not-allowed"
        }`}
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        {inStock ? "Add to Cart" : "Out of Stock"}
      </Button>

      {/* Trust Signals */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Truck className="w-4 h-4 text-cyan-700" />
          <span>Free shipping on orders $75+</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <RotateCcw className="w-4 h-4 text-cyan-700" />
          <span>30-day returns</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Shield className="w-4 h-4 text-cyan-700" />
          <span>Secure checkout</span>
        </div>
      </div>

      {/* Charity Notice */}
      <div className="p-3 bg-amber-50 rounded border border-amber-200 text-sm text-slate-600">
        <span className="font-mono text-amber-700 font-semibold">70%</span> of
        your purchase supports Hawaii STEM education.
      </div>
    </div>
  )
}
