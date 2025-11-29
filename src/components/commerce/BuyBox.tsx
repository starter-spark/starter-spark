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
  originalPrice?: number
  inStock: boolean
  image?: string
}

export function BuyBox({
  id,
  slug,
  name,
  price,
  originalPrice,
  inStock,
  image,
}: BuyBoxProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = () => {
    addItem({ slug, name, price, image }, quantity)

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
            inStock
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {inStock ? "In Stock" : "Pre-Order"}
        </Badge>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-mono text-amber-600">${price.toFixed(2)}</span>
        {originalPrice && originalPrice > price && (
          <span className="text-xl font-mono text-slate-500 line-through">
            ${originalPrice.toFixed(2)}
          </span>
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
        className="w-full h-14 bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-lg"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        Add to Cart
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
