import Link from 'next/link'
import type { Metadata } from 'next'
import {
  compactPrimaryLink,
  compactSecondaryLink,
} from '@/components/marketing/link-classes'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Checkout starts from your cart after selecting a kit.',
}

export default function CheckoutPage() {
  return (
    <div className="min-h-[60vh] bg-white px-6 py-24 lg:px-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-mono text-cyan-700 mb-3">Checkout</p>
        <h1 className="font-mono text-3xl lg:text-4xl text-slate-900 mb-4">
          Start from your cart
        </h1>
        <p className="text-slate-600 leading-relaxed mb-8">
          Checkout begins after you add a kit to your cart. Visit the cart to
          review your items and proceed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/cart"
            className={compactPrimaryLink}
          >
            Go to Cart
          </Link>
          <Link
            href="/shop"
            className={compactSecondaryLink}
          >
            Browse Kits
          </Link>
        </div>
      </div>
    </div>
  )
}
