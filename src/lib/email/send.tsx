import { Resend } from 'resend'
import * as React from 'react'
import { randomUUID } from 'crypto'
import { PurchaseConfirmationEmail } from './templates/purchase-confirmation'
import { ClaimLinkEmail } from './templates/claim-link'
import { WelcomeEmail } from './templates/welcome'
import { recordResendWebhookEvent } from '@/lib/email/webhook-status'

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'StarterSpark <no-reply@starterspark.org>'
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : null) ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000')

function extractEmailAddress(value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(/<([^>]+)>/)
  return (match ? match[1] : trimmed).trim().toLowerCase()
}

function shouldSkipResend(to: string): boolean {
  const email = extractEmailAddress(to)
  const domain = email.split('@')[1]
  return domain === 'example.com'
}

function mockResendSend(to: string, subject: string) {
  const emailId = `skip_${randomUUID()}`
  recordResendWebhookEvent({
    type: 'email.sent',
    data: {
      email_id: emailId,
      to: [extractEmailAddress(to)],
      subject,
    },
  })
  return { id: emailId }
}

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

export async function sendPurchaseConfirmation({
  to,
  customerName,
  orderTotal,
  licenses,
  isGuestPurchase,
}: SendPurchaseConfirmationParams) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const licenseCount = licenses.length
  const licenseLabel = licenseCount === 1 ? 'license' : 'licenses'
  const subject = `Your StarterSpark Order is Confirmed! (${String(licenseCount)} ${licenseLabel})`

  if (shouldSkipResend(to)) {
    return mockResendSend(to, subject)
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    react: (
      <PurchaseConfirmationEmail
        customerName={customerName}
        orderTotal={orderTotal}
        licenses={licenses}
        isGuestPurchase={isGuestPurchase}
        siteUrl={SITE_URL}
      />
    ),
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

interface SendClaimLinkParams {
  to: string
  productName: string
  licenseCode: string
  claimToken: string
}

export async function sendClaimLink({
  to,
  productName,
  licenseCode,
  claimToken,
}: SendClaimLinkParams) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = `Claim Your ${productName} License - StarterSpark`

  if (shouldSkipResend(to)) {
    return mockResendSend(to, subject)
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    react: (
      <ClaimLinkEmail
        productName={productName}
        licenseCode={licenseCode}
        claimToken={claimToken}
        siteUrl={SITE_URL}
      />
    ),
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

interface SendWelcomeEmailParams {
  to: string
  userName?: string
}

export async function sendWelcomeEmail({
  to,
  userName,
}: SendWelcomeEmailParams) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = "Welcome to StarterSpark! Let's Build Something Amazing"

  if (shouldSkipResend(to)) {
    return mockResendSend(to, subject)
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    react: <WelcomeEmail userName={userName} siteUrl={SITE_URL} />,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
