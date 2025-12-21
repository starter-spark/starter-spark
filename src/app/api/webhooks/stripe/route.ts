import { stripe } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { generateLicenseCode, generateClaimToken, formatPrice } from "@/lib/validation"
import { sendPurchaseConfirmation } from "@/lib/email/send"

type StripeCheckoutFulfillmentStatus = "processing" | "completed" | "failed"

type StripeCheckoutFulfillmentRow = {
  stripe_session_id: string
  stripe_event_id: string | null
  status: StripeCheckoutFulfillmentStatus
  attempt_count: number
  last_error: string | null
  stock_decremented_at: string | null
  email_sent_at: string | null
  processed_at: string | null
  updated_at: string | null
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain) return "***"
  if (local.length <= 2) return `**@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

function purchaseItemRef(sessionId: string, lineItemId: string, unitIndex: number): string {
  return `stripe:${sessionId}:${lineItemId}:${unitIndex}`
}

async function loadFulfillment(sessionId: string): Promise<StripeCheckoutFulfillmentRow | null> {
  const { data, error } = await supabaseAdmin
    .from("stripe_checkout_fulfillments")
    .select(
      "stripe_session_id,stripe_event_id,status,attempt_count,last_error,stock_decremented_at,email_sent_at,processed_at,updated_at"
    )
    .eq("stripe_session_id", sessionId)
    .maybeSingle()

  if (error) {
    console.error("Error fetching stripe_checkout_fulfillments:", error)
    return null
  }

  return (data as StripeCheckoutFulfillmentRow | null) ?? null
}

async function startFulfillment(sessionId: string, eventId: string): Promise<StripeCheckoutFulfillmentRow | null> {
  const { data, error } = await supabaseAdmin
    .from("stripe_checkout_fulfillments")
    .insert({
      stripe_session_id: sessionId,
      stripe_event_id: eventId,
      status: "processing",
      attempt_count: 1,
    })
    .select(
      "stripe_session_id,stripe_event_id,status,attempt_count,last_error,stock_decremented_at,email_sent_at,processed_at,updated_at"
    )
    .maybeSingle()

  if (!error) {
    return (data as StripeCheckoutFulfillmentRow | null) ?? null
  }

  // Duplicate (another attempt already created the row).
  if (error.code === "23505" || error.message?.toLowerCase().includes("duplicate")) {
    const existing = await loadFulfillment(sessionId)
    if (!existing) return null

    if (existing.status === "completed") return existing

    const { data: updated } = await supabaseAdmin
      .from("stripe_checkout_fulfillments")
      .update({
        status: "processing",
        stripe_event_id: eventId,
        attempt_count: (existing.attempt_count ?? 0) + 1,
        last_error: null,
      })
      .eq("stripe_session_id", sessionId)
      .select(
        "stripe_session_id,stripe_event_id,status,attempt_count,last_error,stock_decremented_at,email_sent_at,processed_at,updated_at"
      )
      .maybeSingle()

    return (updated as StripeCheckoutFulfillmentRow | null) ?? existing
  }

  console.error("Error inserting stripe_checkout_fulfillments:", error)
  return null
}

async function markFulfillmentFailed(sessionId: string, message: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("stripe_checkout_fulfillments")
    .update({ status: "failed", last_error: message })
    .eq("stripe_session_id", sessionId)

  if (error) {
    console.error("Error updating stripe_checkout_fulfillments failure status:", error)
  }
}

async function markFulfillmentCompleted(sessionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("stripe_checkout_fulfillments")
    .update({ status: "completed", processed_at: new Date().toISOString(), last_error: null })
    .eq("stripe_session_id", sessionId)

  if (error) {
    console.error("Error updating stripe_checkout_fulfillments completed status:", error)
  }
}

async function claimOnce(sessionId: string, field: "stock_decremented_at" | "email_sent_at"): Promise<boolean> {
  const payload: Record<string, string> = { [field]: new Date().toISOString() }

  const { data, error } = await supabaseAdmin
    .from("stripe_checkout_fulfillments")
    .update(payload)
    .eq("stripe_session_id", sessionId)
    .is(field, null)
    .select("stripe_session_id")
    .maybeSingle()

  if (error) {
    console.error(`Error claiming ${field} for fulfillment:`, error)
    return false
  }

  return Boolean(data)
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature) {
    console.error("Missing Stripe signature")
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    )
  }

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET")
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object

      // DB-backed idempotency: create/update a fulfillment row. This prevents double stock decrement
      // and repeated email sends, and provides a single place to record failures.
      const fulfillment = await startFulfillment(session.id, event.id)
      if (!fulfillment) {
        return NextResponse.json({ error: "Unable to start fulfillment" }, { status: 500 })
      }

      if (fulfillment.status === "completed") {
        console.log(`Session ${session.id} already fulfilled, skipping`)
        return NextResponse.json({ received: true, status: "already_processed" })
      }

      // Get customer email from session
      const customerEmail = session.customer_details?.email || session.customer_email

      if (!customerEmail) {
        console.error("No customer email found in session")
        await markFulfillmentFailed(session.id, "Missing customer email")
        return NextResponse.json(
          { error: "No customer email" },
          { status: 400 }
        )
      }

      // Retrieve line items from Stripe (avoids metadata size limits)
      let lineItems: Stripe.ApiList<Stripe.LineItem>
      try {
        lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ["data.price.product"],
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        console.error("Error fetching Stripe line items:", message)
        await markFulfillmentFailed(session.id, `Stripe line items error: ${message}`)
        return NextResponse.json({ error: "Failed to fetch line items" }, { status: 500 })
      }

      // Extract items from line items, filtering out shipping
      const productItems: { slug: string; quantity: number; lineItemId: string }[] = []
      for (const lineItem of lineItems.data) {
        const product = lineItem.price?.product as Stripe.Product | undefined
        const slug = product?.metadata?.slug

        // Skip shipping or items without slug
        if (!slug || slug === "shipping") continue

        productItems.push({
          slug,
          quantity: lineItem.quantity || 1,
          lineItemId: lineItem.id,
        })
      }

      if (productItems.length === 0) {
        console.log(`Session ${session.id} contains no license-bearing items`)
        await markFulfillmentCompleted(session.id)
        return NextResponse.json({ received: true, status: "no_licenses" })
      }

      // Look up products by slug (include inventory fields for stock decrement)
      const slugs = [...new Set(productItems.map((item) => item.slug))]
      const { data: products, error: productsError } = await supabaseAdmin
        .from("products")
        .select("id, slug, name, track_inventory, stock_quantity")
        .in("slug", slugs)

      if (productsError || !products) {
        console.error("Error fetching products:", productsError)
        return NextResponse.json(
          { error: "Failed to fetch products" },
          { status: 500 }
        )
      }

      // Create a map of slug -> product
      const productMap = new Map(products.map(p => [p.slug, p]))

      // Load any existing licenses for this session. If a legacy fulfillment created licenses
      // before `purchase_item_ref` existed, we avoid creating duplicates and mark this session
      // fulfilled immediately.
      const { data: existingSessionLicenses, error: existingSessionLicensesError } =
        await supabaseAdmin
          .from("licenses")
          .select("id,purchase_item_ref")
          .eq("stripe_session_id", session.id)

      if (existingSessionLicensesError) {
        console.error("Error checking existing session licenses:", existingSessionLicensesError)
        await markFulfillmentFailed(session.id, "Failed to check existing licenses")
        return NextResponse.json({ error: "Failed to check existing licenses" }, { status: 500 })
      }

      if (
        Array.isArray(existingSessionLicenses) &&
        existingSessionLicenses.length > 0 &&
        existingSessionLicenses.every((l) => l.purchase_item_ref == null)
      ) {
        console.log(`Session ${session.id} already has licenses (legacy), skipping`)
        await markFulfillmentCompleted(session.id)
        return NextResponse.json({ received: true, status: "already_processed" })
      }

      const existingRefs = new Set(
        (existingSessionLicenses ?? [])
          .map((l) => l.purchase_item_ref)
          .filter((ref): ref is string => typeof ref === "string" && ref.length > 0)
      )

      // Create licenses for each item (idempotent via purchase_item_ref)
      // NOTE: Licenses are NEVER auto-claimed. All licenses start as 'pending'
      // and must be explicitly claimed by the user in their workshop.
      const licensesToCreate: {
        code: string
        product_id: string
        owner_id: null
        source: string
        stripe_session_id: string
        customer_email: string
        claim_token: string
        status: "pending"
        purchase_item_ref: string
      }[] = []

      for (const item of productItems) {
        const product = productMap.get(item.slug)
        if (!product) {
          const message = `Product not found for slug: ${item.slug}`
          console.error(message)
          await markFulfillmentFailed(session.id, message)
          return NextResponse.json({ error: "Unknown product" }, { status: 500 })
        }

        // Create one license per quantity
        for (let i = 0; i < item.quantity; i++) {
          const ref = purchaseItemRef(session.id, item.lineItemId, i + 1)
          if (existingRefs.has(ref)) continue

          licensesToCreate.push({
            code: generateLicenseCode(),
            product_id: product.id,
            owner_id: null, // Never auto-claim
            source: "online_purchase",
            stripe_session_id: session.id,
            customer_email: customerEmail,
            claim_token: generateClaimToken(),
            status: "pending",
            purchase_item_ref: ref,
          })
        }
      }

      if (licensesToCreate.length === 0) {
        console.log(`No new licenses to create for session ${session.id}`)
        await markFulfillmentCompleted(session.id)
        return NextResponse.json({ received: true, status: "no_licenses" })
      }

      // Insert all licenses. Use purchase_item_ref to make it safe under retries/concurrency.
      const maxInsertRounds = 5
      let createdOrExisting: Array<{
        id: string
        code: string
        product_id: string
        claim_token: string | null
        purchase_item_ref: string | null
      }> = []
      let insertSucceeded = false

      for (let round = 0; round < maxInsertRounds; round++) {
        const { data: inserted, error: insertError } = await supabaseAdmin
          .from("licenses")
          .upsert(licensesToCreate, {
            onConflict: "purchase_item_ref",
            ignoreDuplicates: true,
          })
          .select("id,code,product_id,claim_token,purchase_item_ref")

        if (!insertError) {
          if (inserted) createdOrExisting = inserted
          insertSucceeded = true
          break
        }

        // Rare: code/claim_token collisions. Regenerate and retry.
        const isUniqueViolation =
          insertError.code === "23505" ||
          insertError.message?.toLowerCase().includes("duplicate")
        if (!isUniqueViolation) {
          console.error("Error creating licenses:", insertError)
          await markFulfillmentFailed(session.id, `License insert error: ${insertError.message}`)
          return NextResponse.json({ error: "Failed to create licenses" }, { status: 500 })
        }

        console.warn(`Unique violation inserting licenses (round ${round + 1}/${maxInsertRounds}); retrying`)
        for (const row of licensesToCreate) {
          row.code = generateLicenseCode()
          row.claim_token = generateClaimToken()
        }
      }

      if (!insertSucceeded) {
        console.error(`Failed to insert licenses for session ${session.id} after ${maxInsertRounds} attempts`)
        await markFulfillmentFailed(session.id, "Failed to insert licenses after retries")
        return NextResponse.json({ error: "Failed to create licenses" }, { status: 500 })
      }

      // Fetch full license list for this session (covers retries where this attempt inserted 0 rows).
      const { data: allSessionLicenses, error: allSessionLicensesError } = await supabaseAdmin
        .from("licenses")
        .select("id,code,product_id,claim_token,purchase_item_ref")
        .eq("stripe_session_id", session.id)

      if (allSessionLicensesError || !allSessionLicenses) {
        console.error("Error fetching session licenses:", allSessionLicensesError)
        await markFulfillmentFailed(session.id, "Failed to fetch created licenses")
        return NextResponse.json({ error: "Failed to fetch created licenses" }, { status: 500 })
      }

      createdOrExisting = allSessionLicenses

      console.log(`Session ${session.id}: ${createdOrExisting.length} total licenses (created+existing)`)

      // Decrement stock for products with inventory tracking (Phase 14.4)
      const shouldDecrement = await claimOnce(session.id, "stock_decremented_at")
      if (shouldDecrement) {
        const quantityBySlug = new Map<string, number>()
        for (const item of productItems) {
          quantityBySlug.set(item.slug, (quantityBySlug.get(item.slug) ?? 0) + item.quantity)
        }

        for (const [slug, quantity] of quantityBySlug.entries()) {
          const product = productMap.get(slug)
          if (!product) continue

          // Only decrement if inventory tracking is enabled
          if (product.track_inventory && product.stock_quantity !== null) {
            const { data: updatedStock, error: stockError } = await supabaseAdmin.rpc(
              "decrement_product_stock",
              {
                p_product_id: product.id,
                p_quantity: quantity,
              }
            )

            if (stockError) {
              console.error("Failed to decrement stock for product:", slug, stockError)
              // Don't fail the webhook, just log the error. (Inventory can be reconciled.)
            } else {
              const newQuantity = updatedStock?.[0]?.stock_quantity
              if (typeof newQuantity === "number") {
                console.log(`Decremented stock for ${slug}: now ${newQuantity}`)
              }
            }
          }
        }
      }

      // Send purchase confirmation email
      // Always show claim links since licenses are never auto-claimed
      const orderTotal = formatPrice(session.amount_total || 0)

      // Build license info for email
      const licenseInfoForEmail = createdOrExisting.map((license) => {
        const product = products.find((p) => p.id === license.product_id)
        return {
          code: license.code,
          productName: product?.name || "StarterSpark Kit",
          claimToken: license.claim_token || "",
        }
      })

      const shouldSendEmail = await claimOnce(session.id, "email_sent_at")
      if (shouldSendEmail) {
        try {
          await sendPurchaseConfirmation({
            to: customerEmail,
            customerName: session.customer_details?.name || undefined,
            orderTotal,
            licenses: licenseInfoForEmail,
            // Always true - user must explicitly claim in workshop
            isGuestPurchase: true,
          })
          console.log(`Purchase confirmation email sent to ${maskEmail(customerEmail)}`)
        } catch (emailError) {
          // Log email error but don't fail the webhook
          console.error("Failed to send purchase confirmation email:", emailError)
        }
      }

      await markFulfillmentCompleted(session.id)

      return NextResponse.json({
        received: true,
        status: "licenses_created",
        count: createdOrExisting.length,
      })
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
