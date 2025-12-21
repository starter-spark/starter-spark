import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse, after } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { checkKitClaimAchievements } from "@/lib/achievements"
import { isValidClaimToken } from "@/lib/validation"

export async function POST(request: Request) {
  // Rate limit: 5 requests per minute
  const rateLimitResponse = await rateLimit(request, "claimByToken")
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Get the user from the session
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to claim a kit" },
        { status: 401 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const token =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>).token
        : undefined

    if (!token || typeof token !== "string" || !isValidClaimToken(token)) {
      return NextResponse.json(
        { error: "Invalid claim token" },
        { status: 400 }
      )
    }

    // First, check if the license exists and get customer_email
    const { data: license, error: licenseError } = await supabaseAdmin
      .from("licenses")
      .select("id, customer_email, status, owner_id")
      .eq("claim_token", token)
      .maybeSingle()

    if (licenseError) {
      console.error("Error fetching license by token:", licenseError)
      return NextResponse.json(
        { error: "An error occurred. Please try again." },
        { status: 500 }
      )
    }

    if (!license) {
      // Can't find by token - it was already used or never existed
      return NextResponse.json(
        { error: "Invalid or expired claim link. Please check your email for a valid link." },
        { status: 404 }
      )
    }

    // Check if already claimed
    if (license.status !== "pending") {
      if (license.owner_id === user.id) {
        return NextResponse.json(
          { error: "You have already claimed this kit." },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "This kit has already been claimed by another user." },
        { status: 400 }
      )
    }

    // Check if claimer's email matches purchase email
    const isOriginalPurchaser = license.customer_email?.toLowerCase() === user.email.toLowerCase()

    // Claim the license
    // If claimed by a different user, status becomes 'claimed_by_other' so original purchaser sees it
    const newStatus = isOriginalPurchaser ? "claimed" : "claimed_by_other"

    const { data: claimedLicense, error: claimError } = await supabaseAdmin
      .from("licenses")
      .update({
        owner_id: user.id,
        claimed_at: new Date().toISOString(),
        claim_token: null, // Clear the claim token after claiming
        status: newStatus,
      })
      .eq("id", license.id)
      .eq("status", "pending") // Atomic check
      .eq("claim_token", token)
      .is("owner_id", null)
      .select("id, code, product:products(name)")
      .maybeSingle()

    if (claimError) {
      console.error("Error claiming license by token:", claimError)
      return NextResponse.json(
        { error: "An error occurred. Please try again." },
        { status: 500 }
      )
    }

    if (!claimedLicense) {
      // Race condition - someone else claimed it between our read and update
      return NextResponse.json(
        { error: "This kit was just claimed by another user. Please refresh and try again." },
        { status: 409 }
      )
    }

    const productName =
      (claimedLicense.product as unknown as { name: string } | null)?.name || "Kit"

    // Trigger achievement check asynchronously (after response)
    after(async () => {
      try {
        await checkKitClaimAchievements(user.id)
      } catch (err) {
        console.error("Error checking kit achievements:", err)
      }
    })

    return NextResponse.json({
      message: `${productName} claimed successfully!`,
      license: {
        id: claimedLicense.id,
        code: claimedLicense.code,
      },
    })
  } catch (error) {
    console.error("Error in claim-by-token:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
