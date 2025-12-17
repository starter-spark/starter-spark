import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email/send"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const claimToken = searchParams.get("claim")
  const redirectTo = searchParams.get("redirect")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const user = data.user

    // Check if this is a new user (created within last 60 seconds)
    const isNewUser = user.created_at
      ? (Date.now() - new Date(user.created_at).getTime()) < 60000
      : false

    // Send welcome email to new users
    if (isNewUser && user.email) {
      try {
        // Get user's name from profile if available
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        await sendWelcomeEmail({
          to: user.email,
          userName: profile?.full_name || undefined,
        })
        console.log(`Welcome email sent to new user: ${user.email}`)
      } catch (emailErr) {
        // Log error but don't fail the auth flow
        console.error("Failed to send welcome email:", emailErr)
      }
    }

    // If there's a claim token, claim the license
    if (claimToken && user) {
      try {
        // Atomically claim the license using the claim token
        const { data: claimedLicense, error: claimError } = await supabaseAdmin
          .from("licenses")
          .update({
            owner_id: user.id,
            claimed_at: new Date().toISOString(),
            claim_token: null, // Clear the claim token after claiming
          })
          .eq("claim_token", claimToken)
          .is("owner_id", null) // Only claim if not already claimed
          .select("id, code, product:products(name)")
          .single()

        if (claimError) {
          console.error("Claim error:", claimError)
          // Still redirect, but the user can claim manually later
        } else if (claimedLicense) {
          console.log(`License ${claimedLicense.code} claimed by user ${user.id}`)
        }
      } catch (err) {
        console.error("Error claiming license:", err)
      }

      // Redirect to workshop after claiming
      return NextResponse.redirect(`${origin}/workshop?claimed=true`)
    }

    // Redirect to the requested page or default to workshop
    // Validate redirect to prevent open redirect attacks
    let destination = "/workshop"
    if (redirectTo) {
      // Only allow relative paths starting with / and no protocol/host manipulation
      const isValidRedirect =
        redirectTo.startsWith("/") &&
        !redirectTo.startsWith("//") &&
        !redirectTo.includes(":\\") &&
        !redirectTo.includes(":/") &&
        !/^\/[\\@]/.test(redirectTo)

      if (isValidRedirect) {
        destination = redirectTo
      }
    }
    return NextResponse.redirect(`${origin}${destination}`)
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
