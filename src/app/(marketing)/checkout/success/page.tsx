import { stripe } from '@/lib/stripe'
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClearCart } from './ClearCart'
import { getContent } from '@/lib/content'
import { cn } from '@/lib/utils'
import {
  actionPrimaryLink,
  actionSecondaryLink,
} from '@/components/marketing/link-classes'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

interface SuccessPageProps {
  searchParams: MaybePromise<{ session_id?: string }>
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await resolveParams(searchParams)
  const sessionId = params.session_id

  if (!sessionId) {
    redirect('/shop')
  }

  // Fetch session from Stripe
  let session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer_details'],
    })
  } catch {
    redirect('/shop')
  }

  // Verify payment was successful
  if (session.payment_status !== 'paid') {
    redirect('/cart')
  }

  const customerEmail = session.customer_details?.email

  // Extract items for analytics tracking
  const lineItems = session.line_items?.data || []
  const orderItems = lineItems.map((item) => ({
    id: (item.price?.product as string) || '',
    name: item.description || 'Product',
    quantity: item.quantity || 1,
    price: Math.round((item.amount_total || 0) / (item.quantity || 1) / 100),
  }))

  // Fetch charity percentage
  const charityPercentage = await getContent('global.charity.percentage', '67%')

  return (
    <div className="bg-slate-50">
      {/* Clear cart and track purchase on client side */}
      <ClearCart
        orderId={session.id}
        total={Math.round((session.amount_total || 0) / 100)}
        items={orderItems}
      />

      <section className="pt-32 pb-24 px-6 lg:px-20">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <div className="bg-white rounded border border-slate-200 p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="font-mono text-3xl font-bold text-slate-900 mb-2">
              Thank You!
            </h1>
            <p className="text-slate-600 mb-8">
              Your order has been confirmed and is being processed.
            </p>

            {/* Order Details */}
            <div className="bg-slate-50 rounded border border-slate-200 p-6 mb-8 text-left">
              <h2 className="font-mono text-sm text-cyan-700 uppercase tracking-wider mb-4">
                Order Details
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Order ID</span>
                  <span className="font-mono text-slate-900">
                    {session.id.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount Paid</span>
                  <span className="font-mono text-slate-900">
                    ${((session.amount_total || 0) / 100).toFixed(2)}
                  </span>
                </div>
                {customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Receipt sent to</span>
                    <span className="font-mono text-slate-900">
                      {customerEmail}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* What's Next */}
            <div className="space-y-4 mb-8">
              <h2 className="font-mono text-sm text-cyan-700 uppercase tracking-wider">
                What&apos;s Next
              </h2>

              <div className="flex items-start gap-4 text-left p-4 bg-amber-50 rounded border border-amber-200">
                <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">
                    Check Your Email
                  </p>
                  <p className="text-slate-600 text-sm">
                    You&apos;ll receive a confirmation email with your kit
                    activation code shortly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 text-left p-4 bg-slate-50 rounded border border-slate-200">
                <Package className="w-5 h-5 text-cyan-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">
                    Shipping Update
                  </p>
                  <p className="text-slate-600 text-sm">
                    We&apos;ll send tracking information once your kit ships
                    (typically 2-3 business days).
                  </p>
                </div>
              </div>
            </div>

            {/* Charity Notice */}
            <div className="p-4 bg-amber-50 rounded border border-amber-200 mb-8">
              <p className="text-sm text-slate-600">
                <span className="font-mono text-amber-600 font-semibold">
                  {charityPercentage}
                </span>{' '}
                of your purchase will go directly to Hawaii STEM education
                programs. Thank you for supporting the next generation of
                engineers!
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/shop"
                className={cn(actionPrimaryLink, 'flex-1')}
              >
                Continue Shopping
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className={cn(actionSecondaryLink, 'flex-1')}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
