import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

interface CartItem {
  slug: string
  name: string
  price: number
  quantity: number
  image?: string
}

export async function POST(request: Request) {
  // Rate limit: 10 requests per minute
  const rateLimitResponse = await rateLimit(request, "checkout")
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { items } = (await request.json()) as { items: CartItem[] }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart" },
        { status: 400 }
      )
    }

    // Calculate shipping - free over $75
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const shippingCost = subtotal >= 75 ? 0 : 999 // 9.99 in cents

    // Build line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          metadata: {
            slug: item.slug,
          },
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    // Add shipping as a line item if not free
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shipping",
            metadata: {
              slug: "shipping",
            },
          },
          unit_amount: shippingCost,
        },
        quantity: 1,
      })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    // Create Stripe Checkout Session
    // Note: Item info is stored in each line_item's product_data.metadata.slug
    // The webhook retrieves line_items directly from Stripe to avoid metadata size limits
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart`,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      // Allow guest checkout - no customer_email required
      // Stripe will collect email during checkout
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
