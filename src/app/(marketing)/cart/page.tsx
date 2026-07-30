import { getSingleton } from '@/cms/content'
import { CartContent } from './CartContent'

export default async function CartPage() {
  const [copy, commerce] = await Promise.all([
    getSingleton('cart_page'),
    getSingleton('settings_commerce'),
  ])

  return (
    <CartContent
      title={copy.title}
      continueShopping={copy.continueShopping}
      emptyTitle={copy.emptyTitle}
      emptyDescription={copy.emptyDescription}
      emptyCta={copy.emptyCta}
      summaryTitle={copy.summaryTitle}
      subtotalLabel={copy.subtotalLabel}
      savingsLabel={copy.savingsLabel}
      shippingLabel={copy.shippingLabel}
      totalLabel={copy.totalLabel}
      freeShippingHint={copy.freeShippingHint}
      checkoutButton={copy.checkoutButton}
      processingText={copy.processingText}
      trustFreeShipping={copy.trustFreeShipping}
      trustSecureCheckout={copy.trustSecureCheckout}
      freeShippingThresholdCents={commerce.freeShippingThresholdCents}
      shippingRateCents={commerce.shippingRateCents}
    />
  )
}
