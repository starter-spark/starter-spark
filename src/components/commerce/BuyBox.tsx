'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Shield,
} from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useCartStore } from '@/store/cart'
import { trackAddToCart } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { QuantityButton } from '@/components/commerce/QuantityButton'

interface BuyBoxProps {
  id: string
  slug: string
  name: string
  price: number
  originalPrice?: number | null
  inStock: boolean
  image?: string
  // Discount fields
  discountPercent?: number | null
  discountExpiresAt?: string | null
  // Inventory fields
  stockQuantity?: number | null
  lowStockThreshold?: number | null
  /** Admin-configured max quantity per order (null = no limit) */
  maxQuantityPerOrder?: number | null
  // Charity percentage from site content
  charityPercentage?: string
}

const trustSignals = [
  { icon: Truck, label: 'Free shipping on orders $75+' },
  { icon: RotateCcw, label: '30-day returns' },
  { icon: Shield, label: 'Secure checkout' },
]

function getDiscountTimeRemaining(discountExpiresAt?: string | null) {
  if (!discountExpiresAt) return null
  const now = new Date()
  const expires = new Date(discountExpiresAt)
  const diff = expires.getTime() - now.getTime()
  if (diff <= 0) return null
  if (diff > 7 * 24 * 60 * 60 * 1000) return null

  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

function getStockBadge({
  inStock,
  stockQuantity,
  lowStockThreshold = 10,
}: {
  inStock: boolean
  stockQuantity?: number | null
  lowStockThreshold?: number | null
}) {
  if (!inStock) {
    return {
      label: 'Out of Stock',
      className: 'bg-red-50 text-red-700 border-red-200',
    }
  }

  // Show "Only X left" when tracking inventory and stock is at or below threshold
  const threshold = lowStockThreshold ?? 10
  if (
    stockQuantity !== null &&
    stockQuantity !== undefined &&
    stockQuantity <= threshold
  ) {
    return {
      label: `Only ${stockQuantity} left`,
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    }
  }

  return {
    label: 'In Stock',
    className: 'bg-green-50 text-green-700 border-green-200',
  }
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
  lowStockThreshold,
  maxQuantityPerOrder,
  charityPercentage = '67%',
}: BuyBoxProps) {
  const [quantity, setQuantity] = useState(1)
  const [shiftHeld, setShiftHeld] = useState(false)
  const quantityLabelId = useId()
  const addItem = useCartStore((state) => state.addItem)

  // Track shift key for bulk quantity adjustments
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Step amount: 10 when shift is held, 1 otherwise
  const step = shiftHeld ? 10 : 1

  // Max quantity is the lower of: stock quantity, admin limit, or default 99
  const stockLimit = stockQuantity !== null && stockQuantity !== undefined
    ? stockQuantity
    : 99
  const adminLimit = maxQuantityPerOrder !== null && maxQuantityPerOrder !== undefined
    ? maxQuantityPerOrder
    : 99
  const maxQuantity = Math.min(stockLimit, adminLimit)

  // Check if discount is active (exists and not expired)
  const hasActiveDiscount = Boolean(
    discountPercent &&
      originalPrice &&
      (!discountExpiresAt || new Date(discountExpiresAt) > new Date()),
  )

  // Calculate time remaining for countdown (if discount expires within 7 days)
  const timeRemaining = hasActiveDiscount
    ? getDiscountTimeRemaining(discountExpiresAt)
    : null
  const stockBadge = getStockBadge({
    inStock,
    stockQuantity,
    lowStockThreshold,
  })
  const addToCartClassName = cn(
    'w-full h-14 font-mono text-lg',
    inStock
      ? 'bg-cyan-700 hover:bg-cyan-600 text-white'
      : 'bg-slate-200 text-slate-600 cursor-not-allowed',
  )

  const handleAddToCart = () => {
    addItem(
      {
        slug,
        name,
        price,
        image,
        originalPrice: hasActiveDiscount
          ? (originalPrice ?? undefined)
          : undefined,
        // Pass max quantity for cart stock enforcement
        maxQuantity: maxQuantity < 99 ? maxQuantity : undefined,
      },
      quantity,
    )

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
    <div className="lg:sticky lg:top-24 bg-white rounded border border-slate-200 shadow-md p-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-mono text-2xl lg:text-3xl text-slate-900 mb-2">
          {name}
        </h1>
        <Badge
          variant="outline"
          className={cn('font-mono text-xs', stockBadge.className)}
        >
          {stockBadge.label}
        </Badge>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-4xl font-mono text-amber-600">
            ${price.toFixed(2)}
          </span>
          {hasActiveDiscount && originalPrice && (
            <>
              <span className="text-xl font-mono text-slate-600 line-through">
                ${originalPrice.toFixed(2)}
              </span>
              <span className="px-2 py-1 bg-red-700 text-white text-sm font-mono rounded">
                {discountPercent}% OFF
              </span>
            </>
          )}
        </div>
        {timeRemaining && (
          <p className="text-sm text-red-700 font-mono">
            Sale ends: {timeRemaining}
          </p>
        )}
        {hasActiveDiscount && originalPrice && (
          <p className="text-sm text-green-700 font-mono">
            You save ${(originalPrice - price).toFixed(2)}
          </p>
        )}
      </div>

      {/* Quantity Selector - only show when in stock */}
      {inStock && (
        <div className="space-y-2" role="group" aria-labelledby={quantityLabelId}>
          <div className="flex items-center justify-between">
            <span id={quantityLabelId} className="text-sm text-slate-700">
              Quantity
            </span>
            {shiftHeld && (
              <span className="text-xs text-cyan-600 font-mono">
                ±10 mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <QuantityButton
              size="lg"
              onClick={() => {
                setQuantity(Math.max(1, quantity - step))
              }}
              disabled={quantity <= 1}
              aria-label={`Decrease quantity by ${step}`}
            >
              <span className="w-6 flex items-center justify-center">
                {shiftHeld ? (
                  <span className="text-xs font-mono text-slate-600">-10</span>
                ) : (
                  <Minus className="w-4 h-4 text-slate-600" aria-hidden="true" />
                )}
              </span>
            </QuantityButton>
            <span className="w-12 text-center font-mono text-lg">{quantity}</span>
            <QuantityButton
              size="lg"
              onClick={() => {
                setQuantity(Math.min(maxQuantity, quantity + step))
              }}
              disabled={quantity >= maxQuantity}
              aria-label={`Increase quantity by ${step}`}
            >
              <span className="w-6 flex items-center justify-center">
                {shiftHeld ? (
                  <span className="text-xs font-mono text-slate-600">+10</span>
                ) : (
                  <Plus className="w-4 h-4 text-slate-600" aria-hidden="true" />
                )}
              </span>
            </QuantityButton>
          </div>
          {maxQuantity < 99 && maxQuantity > 0 && quantity >= maxQuantity && (
            <p className="text-xs text-amber-600">
              Maximum available quantity selected
            </p>
          )}
        </div>
      )}

      {/* Add to Cart */}
      <Button
        onClick={handleAddToCart}
        disabled={!inStock}
        className={addToCartClassName}
      >
        <ShoppingCart className="w-5 h-5 mr-2" aria-hidden="true" />
        {inStock ? 'Add to Cart' : 'Out of Stock'}
      </Button>

      {/* Trust Signals */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        {trustSignals.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 text-sm text-slate-700"
          >
            <Icon className="w-4 h-4 text-cyan-700" aria-hidden="true" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Charity Notice */}
      <div
        data-testid="product-charity"
        className="p-3 bg-amber-50 rounded border border-amber-200 text-sm text-slate-700"
      >
        <span className="font-mono text-amber-700 font-semibold">
          {charityPercentage}
        </span>{' '}
        of your purchase supports Hawaii STEM education.
      </div>
    </div>
  )
}
