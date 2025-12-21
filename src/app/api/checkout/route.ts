import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

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
    const body: unknown = await request.json()
    const rawItems = (body as { items?: unknown }).items
    if (!Array.isArray(rawItems)) {
      return NextResponse.json(
        { error: "Invalid cart payload" },
        { status: 400 }
      )
    }

    // Normalize + validate items (no negative/NaN/huge quantities; merge duplicates)
    const quantitiesBySlug = new Map<string, number>()
    for (const raw of rawItems) {
      if (!raw || typeof raw !== "object") {
        return NextResponse.json({ error: "Invalid cart item" }, { status: 400 })
      }

      const item = raw as Partial<CartItem>
      const slug = typeof item.slug === "string" ? item.slug.trim() : ""
      if (!slug || slug.length > 80) {
        return NextResponse.json({ error: "Invalid product slug" }, { status: 400 })
      }

      const quantityRaw =
        typeof item.quantity === "number"
          ? item.quantity
          : typeof item.quantity === "string"
            ? Number(item.quantity)
            : Number.NaN

      if (!Number.isFinite(quantityRaw) || !Number.isInteger(quantityRaw)) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
      }

      if (quantityRaw <= 0) {
        return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 })
      }

      const nextQty = (quantitiesBySlug.get(slug) ?? 0) + quantityRaw
      if (nextQty > 99) {
        return NextResponse.json({ error: "Quantity too large" }, { status: 400 })
      }
      quantitiesBySlug.set(slug, nextQty)
    }

    const items = Array.from(quantitiesBySlug.entries()).map(([slug, quantity]) => ({
      slug,
      quantity,
    }))

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart" },
        { status: 400 }
      )
    }

    // Verify prices from database (Phase 14.3 - discount validation)
    const supabase = await createClient()
    const slugs = items.map((item) => item.slug)
    const { data: products, error: dbError } = await supabase
      .from("products")
      .select("slug, name, price_cents, discount_percent, discount_expires_at, original_price_cents")
      .in("slug", slugs)

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Failed to verify products" },
        { status: 500 }
      )
    }

    // Create a map for quick lookup
    const productMap = new Map(products?.map((p) => [p.slug, p]) || [])

    // Verify each item exists and has valid price
    const verifiedItems: { slug: string; name: string; priceCents: number; quantity: number }[] = []
    for (const item of items) {
      const product = productMap.get(item.slug)
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.slug}` },
          { status: 400 }
        )
      }

      // Check if discount is still valid
      let currentPriceCents = product.price_cents
      if (product.discount_expires_at) {
        const expiresAt = new Date(product.discount_expires_at)
        if (expiresAt <= new Date() && // Discount expired - use original price if available
          product.original_price_cents) {
            currentPriceCents = product.original_price_cents
          }
      }

      verifiedItems.push({
        slug: product.slug,
        name: product.name,
        priceCents: currentPriceCents,
        quantity: item.quantity,
      })
    }

    // Calculate shipping - free over $75
    const subtotal = verifiedItems.reduce(
      (sum, item) => sum + (item.priceCents / 100) * item.quantity,
      0
    )
    const shippingCost = subtotal >= 75 ? 0 : 999 // 9.99 in cents

    // Build line items for Stripe using verified prices
    const lineItems = verifiedItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          metadata: {
            slug: item.slug,
          },
        },
        unit_amount: item.priceCents,
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

    // Use explicit site URL, or Vercel's branch URL (consistent), or deployment URL, or localhost
	    const siteUrl =
	      process.env.NEXT_PUBLIC_SITE_URL ||
	      (process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null) ||
	      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
	    const checkoutSessionIdPlaceholder = ["{", "CHECKOUT", "_SESSION", "_ID", "}"].join("")

	    // Create Stripe Checkout Session
	    // Note: Item info is stored in each line_item's product_data.metadata.slug
	    // The webhook retrieves line_items directly from Stripe to avoid metadata size limits
	    const session = await stripe.checkout.sessions.create({
	      mode: "payment",
	      line_items: lineItems,
	      success_url: `${siteUrl}/checkout/success?session_id=${checkoutSessionIdPlaceholder}`,
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
