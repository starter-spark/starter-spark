'use client'

import { useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { ActionStatusBanner } from '@/components/ui/action-status'
import {
  useCartStore,
  selectCartTotal,
  selectCartCount,
  selectCartSavings,
} from '@/store/cart'
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  Truck,
  Shield,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { QuantityButton } from '@/components/commerce/QuantityButton'

interface CheckoutResponse {
  url?: string
  error?: string
}

export interface CartContentProps {
  title?: string
  continueShopping?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyCta?: string
  summaryTitle?: string
  subtotalLabel?: string
  savingsLabel?: string
  shippingLabel?: string
  totalLabel?: string
  freeShippingHint?: string
  checkoutButton?: string
  processingText?: string
  trustFreeShipping?: string
  trustSecureCheckout?: string
  charityNotice?: string
  charityPercentage?: string
}

export function CartContent({
  title = 'Your Cart',
  continueShopping = 'Continue Shopping',
  emptyTitle = 'Your cart is empty',
  emptyDescription = "Looks like you haven't added any kits yet. Browse our collection to get started on your robotics journey.",
  emptyCta = 'Browse Kits',
  summaryTitle = 'Order Summary',
  subtotalLabel = 'Subtotal',
  savingsLabel = 'Your Savings',
  shippingLabel = 'Shipping',
  totalLabel = 'Total',
  freeShippingHint = 'Add ${amount} more for free shipping',
  checkoutButton = 'Checkout',
  processingText = 'Processing...',
  trustFreeShipping = 'Free shipping on orders $75+',
  trustSecureCheckout = 'Secure checkout with Stripe',
  charityNotice = 'of your purchase supports Hawaii STEM education.',
  charityPercentage = '67%',
}: CartContentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const hasHydrated = useSyncExternalStore(
    useCartStore.persist.onFinishHydration,
    () => useCartStore.persist.hasHydrated(),
    () => false,
  )
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  const total = useCartStore(selectCartTotal)
  const count = useCartStore(selectCartCount)
  const savings = useCartStore(selectCartSavings)

  // Potentially janky: gate render until persisted cart data hydrates.

  const handleCheckout = async () => {
    setIsLoading(true)
    setCheckoutError(null)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      })

      const data = (await response.json()) as CheckoutResponse

      if (data.url) {
        globalThis.location.href = data.url
      } else {
        setCheckoutError(data.error || 'Unable to start checkout. Please try again.')
        setIsLoading(false)
      }
    } catch {
      setCheckoutError('Connection error. Please check your internet and try again.')
      setIsLoading(false)
    }
  }

  const shipping = total >= 75 ? 0 : 9.99
  const grandTotal = total + shipping
  const amountForFreeShipping = (75 - total).toFixed(2)

  // Show loading state during hydration
  if (!hasHydrated) {
    return (
      <div className="bg-slate-50">
        <section className="pt-32 pb-8 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {continueShopping}
            </Link>
            <h1 className="font-mono text-4xl font-bold text-slate-900">
              {title}
            </h1>
          </div>
        </section>
        <section className="pb-24 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-slate-500 animate-spin" />
              </div>
              <p className="text-slate-600">Loading cart...</p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="bg-slate-50">
      {/* Header */}
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {continueShopping}
          </Link>
          <h1 className="font-mono text-4xl font-bold text-slate-900">
            {title}
          </h1>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="pb-24 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-slate-500" />
              </div>
              <h2 className="font-mono text-2xl text-slate-900 mb-2">
                {emptyTitle}
              </h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {emptyDescription}
              </p>
              <Button
                className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
                asChild
              >
                <Link href="/shop">{emptyCta}</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="pb-24 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Cart items (60%) */}
              <div className="w-full lg:w-3/5">
                <div className="bg-white rounded border border-slate-200 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-mono text-slate-900">
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="cursor-pointer text-sm text-slate-500 hover:text-red-600 transition-colors"
                    >
                      Clear Cart
                    </button>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <div key={item.slug} className="p-6 flex gap-6">
                        {/* Image Placeholder */}
                        <div className="w-24 h-24 rounded bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-500 text-xs font-mono">
                            Image
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <Link
                              href={`/shop/${item.slug}`}
                              className="font-medium text-slate-900 hover:text-cyan-700 transition-colors"
                            >
                              {item.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                removeItem(item.slug)
                              }}
                              className="cursor-pointer p-1 text-slate-500 hover:text-red-600 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-amber-600 font-mono mb-4">
                            ${item.price.toFixed(2)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <QuantityButton
                                size="md"
                                tone={item.quantity === 1 ? 'danger' : 'neutral'}
                                onClick={() => {
                                  if (item.quantity === 1) {
                                    removeItem(item.slug)
                                  } else {
                                    updateQuantity(item.slug, item.quantity - 1)
                                  }
                                }}
                                aria-label={
                                  item.quantity === 1
                                    ? 'Remove item'
                                    : 'Decrease quantity'
                                }
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                ) : (
                                  <Minus className="w-3 h-3 text-slate-600" />
                                )}
                              </QuantityButton>
                              <span className="w-10 text-center font-mono">
                                {item.quantity}
                              </span>
                              <QuantityButton
                                size="md"
                                onClick={() => {
                                  updateQuantity(item.slug, item.quantity + 1)
                                }}
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3 text-slate-600" />
                              </QuantityButton>
                            </div>

                            <span className="font-mono text-slate-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order summary (40%) */}
              <div className="w-full lg:w-2/5">
                <div className="sticky top-24 bg-white rounded border border-slate-200 p-6 space-y-6">
                  <h2 className="font-mono text-xl text-slate-900">
                    {summaryTitle}
                  </h2>

                  {/* Line Items */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">{subtotalLabel}</span>
                      <span className="font-mono text-slate-900">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                    {savings > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-600">{savingsLabel}</span>
                        <span className="font-mono text-green-600">
                          -${savings.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">{shippingLabel}</span>
                      <span className="font-mono text-slate-900">
                        {shipping === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `$${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-xs text-slate-500">
                        {freeShippingHint.replace(
                          '${amount}',
                          amountForFreeShipping,
                        )}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-900 font-medium">
                        {totalLabel}
                      </span>
                      <span className="text-2xl font-mono text-slate-900">
                        ${grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Error State */}
                  {checkoutError && (
                    <ActionStatusBanner
                      status="error"
                      message={checkoutError}
                    />
                  )}

                  {/* Checkout Button */}
                  <Button
                    onClick={() => void handleCheckout()}
                    disabled={isLoading}
                    className="w-full h-14 bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {processingText}
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        {checkoutButton}
                      </>
                    )}
                  </Button>

                  {/* Trust Signals */}
                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Truck className="w-4 h-4 text-cyan-700" />
                      <span>{trustFreeShipping}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Shield className="w-4 h-4 text-cyan-700" />
                      <span>{trustSecureCheckout}</span>
                    </div>
                  </div>

                  {/* Charity Notice */}
                  <div
                    data-testid="cart-charity"
                    className="p-3 bg-amber-50 rounded border border-amber-200 text-sm text-slate-600"
                  >
                    <span className="font-mono text-amber-600 font-semibold">
                      {charityPercentage}
                    </span>{' '}
                    {charityNotice}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
