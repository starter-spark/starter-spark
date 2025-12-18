import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

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

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to claim a kit" },
        { status: 401 }
      )
    }

    const { token } = (await request.json()) as { token: unknown }

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid claim token" },
        { status: 400 }
      )
    }

    // Atomically claim the license using the claim token
    // Only claim if owner_id is NULL (unclaimed)
    const { data: claimedLicense, error: claimError } = await supabaseAdmin
      .from("licenses")
      .update({
        owner_id: user.id,
        claimed_at: new Date().toISOString(),
        claim_token: null, // Clear the claim token after claiming
      })
      .eq("claim_token", token)
      .is("owner_id", null)
      .select("id, code, product:products(name)")
      .single()

    if (claimError) {
      // Check if no rows were updated (token doesn't exist or already claimed)
      if (claimError.code === "PGRST116") {
        // Check if the token exists at all
        const { data: existingLicense } = await supabaseAdmin
          .from("licenses")
          .select("owner_id")
          .eq("claim_token", token)
          .single()

        if (!existingLicense) {
          return NextResponse.json(
            { error: "Invalid or expired claim link. Please check your email for a valid link." },
            { status: 404 }
          )
        }

        // Token exists but license is already claimed
        if (existingLicense.owner_id === user.id) {
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

      console.error("Error claiming license by token:", claimError)
      return NextResponse.json(
        { error: "An error occurred. Please try again." },
        { status: 500 }
      )
    }

    const productName =
      (claimedLicense.product as unknown as { name: string } | null)?.name || "Kit"

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
