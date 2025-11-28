import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY environment variable")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Audience ID for newsletter subscribers
// Create an audience in Resend dashboard and set this in .env.local
export const NEWSLETTER_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || ""
