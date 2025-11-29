"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useCartStore, selectCartTotal, selectCartCount } from "@/store/cart"
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
} from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  const total = useCartStore(selectCartTotal)
  const count = useCartStore(selectCartCount)

  // Fix hydration mismatch with Zustand persist
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      })

      const data = await response.json()

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        console.error("No checkout URL returned")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Checkout error:", error)
      setIsLoading(false)
    }
  }

  const shipping = total >= 75 ? 0 : 9.99
  const grandTotal = total + shipping

  // Show loading state during hydration to prevent mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <section className="pt-32 pb-8 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
            <h1 className="font-mono text-4xl font-bold text-slate-900">
              Your Cart
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
          <h1 className="font-mono text-4xl font-bold text-slate-900">
            Your Cart
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
                Your cart is empty
              </h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Looks like you haven&apos;t added any kits yet. Browse our
                collection to get started on your robotics journey.
              </p>
              <Button
                className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
                asChild
              >
                <Link href="/shop">Browse Kits</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="pb-24 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Cart Items (Left - 60%) */}
              <div className="w-full lg:w-3/5">
                <div className="bg-white rounded border border-slate-200 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-mono text-slate-900">
                      {count} {count === 1 ? "item" : "items"}
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
                              onClick={() => removeItem(item.slug)}
                              className="cursor-pointer p-1 text-slate-500 hover:text-red-600 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-amber-600 font-mono mb-4">
                            ${item.price}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.slug, item.quantity - 1)
                                }
                                className="cursor-pointer w-8 h-8 rounded border border-slate-200 flex items-center justify-center hover:border-slate-300 transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3 text-slate-600" />
                              </button>
                              <span className="w-10 text-center font-mono">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.slug, item.quantity + 1)
                                }
                                className="cursor-pointer w-8 h-8 rounded border border-slate-200 flex items-center justify-center hover:border-slate-300 transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3 text-slate-600" />
                              </button>
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

              {/* Order Summary (Right - 40%) */}
              <div className="w-full lg:w-2/5">
                <div className="sticky top-24 bg-white rounded border border-slate-200 p-6 space-y-6">
                  <h2 className="font-mono text-xl text-slate-900">
                    Order Summary
                  </h2>

                  {/* Line Items */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-mono text-slate-900">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Shipping</span>
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
                        Add ${(75 - total).toFixed(2)} more for free shipping
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-900 font-medium">Total</span>
                      <span className="text-2xl font-mono text-slate-900">
                        ${grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="w-full h-14 bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Checkout
                      </>
                    )}
                  </Button>

                  {/* Trust Signals */}
                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Truck className="w-4 h-4 text-cyan-700" />
                      <span>Free shipping on orders $75+</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Shield className="w-4 h-4 text-cyan-700" />
                      <span>Secure checkout with Stripe</span>
                    </div>
                  </div>

                  {/* Charity Notice */}
                  <div className="p-3 bg-amber-50 rounded border border-amber-200 text-sm text-slate-600">
                    <span className="font-mono text-amber-600 font-semibold">
                      70%
                    </span>{" "}
                    of your purchase supports Hawaii STEM education.
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
