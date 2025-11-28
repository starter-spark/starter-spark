import { resend } from "@/lib/resend"
import { PurchaseConfirmationEmail } from "./templates/purchase-confirmation"
import { ClaimLinkEmail } from "./templates/claim-link"
import { WelcomeEmail } from "./templates/welcome"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "StarterSpark <hello@starterspark.com>"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

interface LicenseInfo {
  code: string
  productName: string
  claimToken?: string | null
}

interface SendPurchaseConfirmationParams {
  to: string
  customerName?: string
  orderTotal: string
  licenses: LicenseInfo[]
  isGuestPurchase: boolean
}

/**
 * Send purchase confirmation email
 * Includes order summary and claim links (for guests)
 */
export async function sendPurchaseConfirmation({
  to,
  customerName,
  orderTotal,
  licenses,
  isGuestPurchase,
}: SendPurchaseConfirmationParams) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your StarterSpark Order is Confirmed! (${licenses.length} license${licenses.length > 1 ? "s" : ""})`,
    react: PurchaseConfirmationEmail({
      customerName,
      orderTotal,
      licenses,
      isGuestPurchase,
      siteUrl: SITE_URL,
    }),
  })

  if (error) {
    console.error("Failed to send purchase confirmation:", error)
    throw new Error(`Failed to send purchase confirmation: ${error.message}`)
  }

  console.log("Purchase confirmation sent:", data?.id)
  return data
}

interface SendClaimLinkParams {
  to: string
  productName: string
  licenseCode: string
  claimToken: string
}

/**
 * Send claim link email for a specific license
 * Used for guest purchases who need to claim their license
 */
export async function sendClaimLink({
  to,
  productName,
  licenseCode,
  claimToken,
}: SendClaimLinkParams) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Claim Your ${productName} License - StarterSpark`,
    react: ClaimLinkEmail({
      productName,
      licenseCode,
      claimToken,
      siteUrl: SITE_URL,
    }),
  })

  if (error) {
    console.error("Failed to send claim link:", error)
    throw new Error(`Failed to send claim link: ${error.message}`)
  }

  console.log("Claim link sent:", data?.id)
  return data
}

interface SendWelcomeEmailParams {
  to: string
  userName?: string
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail({ to, userName }: SendWelcomeEmailParams) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Welcome to StarterSpark! Let's Build Something Amazing",
    react: WelcomeEmail({
      userName,
      siteUrl: SITE_URL,
    }),
  })

  if (error) {
    console.error("Failed to send welcome email:", error)
    throw new Error(`Failed to send welcome email: ${error.message}`)
  }

  console.log("Welcome email sent:", data?.id)
  return data
}
