import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { checkKitClaimAchievements } from "@/lib/achievements"

export async function POST(request: Request) {
  // Rate limit: 5 requests per minute
  const rateLimitResponse = await rateLimit(request, "claimLicense")
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Get the user from the session
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to claim a kit" },
        { status: 401 }
      )
    }

    const { code } = (await request.json()) as { code: unknown }

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Please enter a valid kit code" },
        { status: 400 }
      )
    }

    const normalizedCode = code.trim().toUpperCase()

    if (normalizedCode.length < 4 || normalizedCode.length > 19) {
      return NextResponse.json(
        { error: "Invalid code format" },
        { status: 400 }
      )
    }

    // Use atomic update with RETURNING to prevent race conditions
    // Only claim if owner_id is NULL (unclaimed)
    const { data: claimedLicense, error: claimError } = await supabaseAdmin
      .from("licenses")
      .update({
        owner_id: user.id,
        claimed_at: new Date().toISOString(),
        claim_token: null, // Clear the claim token
      })
      .eq("code", normalizedCode)
      .is("owner_id", null)
      .select("id, code, product:products(name)")
      .single()

    if (claimError) {
      // Check if no rows were updated (code doesn't exist or already claimed)
      if (claimError.code === "PGRST116") {
        // Check if the code exists at all
        const { data: existingLicense } = await supabaseAdmin
          .from("licenses")
          .select("owner_id")
          .eq("code", normalizedCode)
          .single()

        if (!existingLicense) {
          return NextResponse.json(
            { error: "Invalid kit code. Please check and try again." },
            { status: 404 }
          )
        }

        // Code exists but is already claimed
        if (existingLicense.owner_id === user.id) {
          return NextResponse.json(
            { error: "You have already claimed this kit." },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { error: "This kit code has already been claimed." },
          { status: 400 }
        )
      }

      console.error("Error claiming license:", claimError)
      return NextResponse.json(
        { error: "An error occurred. Please try again." },
        { status: 500 }
      )
    }

    const productName =
      (claimedLicense.product as unknown as { name: string } | null)?.name || "Kit"

    // Check and award kit-related achievements (non-blocking)
    checkKitClaimAchievements(user.id).catch((err) =>
      console.error("Error checking kit achievements:", err)
    )

    return NextResponse.json({
      message: `${productName} claimed successfully!`,
      license: {
        id: claimedLicense.id,
        code: claimedLicense.code,
      },
    })
  } catch (error) {
    console.error("Error in claim-license:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
