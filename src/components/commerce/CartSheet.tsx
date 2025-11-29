"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { useCartStore, selectCartTotal, selectCartCount } from "@/store/cart"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import Link from "next/link"

export function CartSheet() {
  const items = useCartStore((state) => state.items)
  const isOpen = useCartStore((state) => state.isOpen)
  const closeCart = useCartStore((state) => state.closeCart)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const total = useCartStore(selectCartTotal)
  const count = useCartStore(selectCartCount)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-mono text-slate-900">
            Your Cart ({count})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-600 mb-4">Your cart is empty</p>
            <Button
              onClick={closeCart}
              variant="outline"
              className="font-mono"
              asChild
            >
              <Link href="/shop">Browse Kits</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-auto py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.slug}
                  className="flex gap-4 p-4 bg-slate-50 rounded border border-slate-200"
                >
                  {/* Image Placeholder */}
                  <div className="w-20 h-20 rounded bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-500 text-[10px] font-mono">
                      Image
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 text-sm truncate">
                      {item.name}
                    </h4>
                    <p className="text-amber-600 font-mono text-sm mt-1">
                      ${item.price.toFixed(2)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.slug, item.quantity - 1)
                        }
                        className="cursor-pointer w-7 h-7 rounded border border-slate-200 flex items-center justify-center hover:border-slate-300 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3 text-slate-600" />
                      </button>
                      <span className="w-8 text-center font-mono text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.slug, item.quantity + 1)
                        }
                        className="cursor-pointer w-7 h-7 rounded border border-slate-200 flex items-center justify-center hover:border-slate-300 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3 text-slate-600" />
                      </button>
                      <button
                        onClick={() => removeItem(item.slug)}
                        className="cursor-pointer ml-auto p-1.5 text-slate-500 hover:text-red-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <SheetFooter className="border-t border-slate-200 pt-4 flex-col gap-4">
              {/* Subtotal */}
              <div className="w-full flex justify-between items-center">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-2xl font-mono text-slate-900">
                  ${total.toFixed(2)}
                </span>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Shipping calculated at checkout
              </p>

              {/* Checkout Button */}
              <Button
                className="w-full h-12 bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
                asChild
              >
                <Link href="/cart" onClick={closeCart}>
                  Proceed to Checkout
                </Link>
              </Button>

              {/* Continue Shopping */}
              <Button
                variant="ghost"
                className="w-full font-mono text-slate-600"
                onClick={closeCart}
              >
                Continue Shopping
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
