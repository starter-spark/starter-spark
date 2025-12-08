import { getContents } from "@/lib/content"
import { CartContent } from "./CartContent"

const DEFAULT_CONTENT = {
  "cart.title": "Your Cart",
  "cart.continueShipping": "Continue Shopping",
  "cart.empty.title": "Your cart is empty",
  "cart.empty.description": "Looks like you haven't added any kits yet. Browse our collection to get started on your robotics journey.",
  "cart.empty.cta": "Browse Kits",
  "cart.summary.title": "Order Summary",
  "cart.summary.subtotal": "Subtotal",
  "cart.summary.savings": "Your Savings",
  "cart.summary.shipping": "Shipping",
  "cart.summary.total": "Total",
  "cart.summary.freeShippingHint": "Add ${amount} more for free shipping",
  "cart.checkout.button": "Checkout",
  "cart.checkout.processing": "Processing...",
  "cart.trust.freeShipping": "Free shipping on orders $75+",
  "cart.trust.secureCheckout": "Secure checkout with Stripe",
  "cart.charity.notice": "of your purchase supports Hawaii STEM education.",
  "cart.charity.percentage": "70%",
}

export default async function CartPage() {
  const content = await getContents(Object.keys(DEFAULT_CONTENT), DEFAULT_CONTENT)

  return (
    <CartContent
      title={content["cart.title"]}
      continueShopping={content["cart.continueShipping"]}
      emptyTitle={content["cart.empty.title"]}
      emptyDescription={content["cart.empty.description"]}
      emptyCta={content["cart.empty.cta"]}
      summaryTitle={content["cart.summary.title"]}
      subtotalLabel={content["cart.summary.subtotal"]}
      savingsLabel={content["cart.summary.savings"]}
      shippingLabel={content["cart.summary.shipping"]}
      totalLabel={content["cart.summary.total"]}
      freeShippingHint={content["cart.summary.freeShippingHint"]}
      checkoutButton={content["cart.checkout.button"]}
      processingText={content["cart.checkout.processing"]}
      trustFreeShipping={content["cart.trust.freeShipping"]}
      trustSecureCheckout={content["cart.trust.secureCheckout"]}
      charityNotice={content["cart.charity.notice"]}
      charityPercentage={content["cart.charity.percentage"]}
    />
  )
}
