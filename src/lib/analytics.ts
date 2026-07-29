// PostHog event tracking

import posthog from 'posthog-js'

export const AnalyticsEvents = {
  ADD_TO_CART: 'add_to_cart',
  PURCHASE_COMPLETED: 'purchase_completed',
} as const

export type AnalyticsEvent =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]

const isBrowser = typeof window !== 'undefined'

export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
) {
  if (isBrowser) {
    posthog.capture(event, properties)
  }
}

export function trackAddToCart(product: {
  id: string
  name: string
  slug: string
  price: number
  quantity: number
}) {
  trackEvent(AnalyticsEvents.ADD_TO_CART, {
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    price: product.price,
    quantity: product.quantity,
  })
}

export function trackPurchaseCompleted(order: {
  orderId: string
  total: number
  items: { id: string; name: string; quantity: number; price: number }[]
}) {
  trackEvent(AnalyticsEvents.PURCHASE_COMPLETED, {
    order_id: order.orderId,
    value: order.total,
    item_count: order.items.length,
    items: order.items.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  })
}
