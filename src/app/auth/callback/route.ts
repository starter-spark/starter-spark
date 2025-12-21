import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email/send"
import { isValidClaimToken } from "@/lib/validation"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain) return "***"
  if (local.length <= 2) return `**@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

function maskLicenseCode(code: string): string {
  const normalized = code.replaceAll("-", "")
  if (normalized.length <= 8) return "****"
  return `${normalized.slice(0, 4)}-****-****-${normalized.slice(-4)}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const claimToken = searchParams.get("claim")
  const redirectTo = searchParams.get("redirect")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(new URL("/login?error=auth_failed", SITE_URL))
    }

    const user = data.user

    // Check if this is a new user (created within last 60 seconds)
    const isNewUser = user.created_at
      ? (Date.now() - new Date(user.created_at).getTime()) < 60_000
      : false

    // Send welcome email to new users
    if (isNewUser && user.email) {
      try {
        // Get user's name from profile if available
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle()

        if (profileError) {
          console.error("Failed to fetch profile name for welcome email:", profileError)
        }

        await sendWelcomeEmail({
          to: user.email,
          userName: profile?.full_name || undefined,
        })
        console.log(`Welcome email sent to new user: ${maskEmail(user.email)}`)
      } catch (emailErr) {
        // Log error but don't fail the auth flow
        console.error("Failed to send welcome email:", emailErr)
      }
    }

    // If there's a claim token, claim the license
    if (claimToken && user && isValidClaimToken(claimToken)) {
      try {
        // Look up the license for this claim token.
        const { data: license, error: fetchError } = await supabaseAdmin
          .from("licenses")
          .select("id, code, status, owner_id, customer_email, product:products(name)")
          .eq("claim_token", claimToken)
          .maybeSingle()

        if (fetchError || !license) {
          // Token was already used or never existed; continue normal redirect flow.
          if (fetchError) console.error("Claim lookup error:", fetchError)
        } else if (license.status !== "pending") {
          // Already processed; continue.
        } else if (license.owner_id) {
          // Already claimed; continue.
        } else {
          const isOriginalPurchaser =
            Boolean(license.customer_email) &&
            license.customer_email?.toLowerCase() === user.email?.toLowerCase()
          const newStatus = isOriginalPurchaser ? "claimed" : "claimed_by_other"

          // Atomically claim the license.
          const { data: claimedLicense, error: claimError } = await supabaseAdmin
            .from("licenses")
            .update({
              owner_id: user.id,
              claimed_at: new Date().toISOString(),
              claim_token: null, // Clear the claim token after claiming
              status: newStatus,
            })
            .eq("id", license.id)
            .eq("status", "pending")
            .eq("claim_token", claimToken)
            .is("owner_id", null)
            .select("id, code, status")
            .maybeSingle()

          if (claimError) {
            console.error("Claim error:", claimError)
            // Still redirect, but the user can claim manually later
          } else if (claimedLicense) {
            console.log(
              `License ${maskLicenseCode(claimedLicense.code)} claimed by user ${user.id} (status=${claimedLicense.status})`
            )
          }
        }
      } catch (err) {
        console.error("Error claiming license:", err)
      }

      // Redirect to workshop after claiming
      return NextResponse.redirect(new URL("/workshop?claimed=true", SITE_URL))
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
    return NextResponse.redirect(new URL(destination, SITE_URL))
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL("/login", SITE_URL))
}
