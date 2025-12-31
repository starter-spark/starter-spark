import { Resend } from 'resend'
import * as React from 'react'
import { randomUUID } from 'crypto'
import { PurchaseConfirmationEmail } from './templates/purchase-confirmation'
import { ClaimLinkEmail } from './templates/claim-link'
import { WelcomeEmail } from './templates/welcome'
import { ContactConfirmationEmail } from './templates/contact-confirmation'
import { ContactNotificationEmail } from './templates/contact-notification'
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
  console.log(`[Email] SKIPPED (example.com): ${subject} to ${to}`)
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

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

function parseCommaSeparatedEmails(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
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
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const resend = new Resend(apiKey)
  const licenseCount = licenses.length
  const licenseLabel = licenseCount === 1 ? 'license' : 'licenses'
  const subject = `Your StarterSpark Order is Confirmed! (${String(licenseCount)} ${licenseLabel})`

  if (shouldSkipResend(to)) {
    return mockResendSend(to, subject)
  }

  console.log(`[Email] Sending purchase confirmation to ${to.substring(0, 3)}***`)

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
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const resend = new Resend(apiKey)
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
  const resend = getResendClient()
  if (!resend) throw new Error('RESEND_API_KEY is not configured')
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

interface SendContactConfirmationParams {
  to: string
  name?: string
  subject: string
}

export async function sendContactConfirmation({
  to,
  name,
  subject,
}: SendContactConfirmationParams) {
  const resend = getResendClient()
  if (!resend) return null

  const emailSubject = 'We received your message — StarterSpark'

  if (shouldSkipResend(to)) {
    return mockResendSend(to, emailSubject)
  }

  const supportEmails = parseCommaSeparatedEmails(process.env.SUPPORT_TEAM_EMAILS)
  const replyTo = supportEmails.length > 0 ? supportEmails[0] : undefined

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: emailSubject,
    replyTo,
    react: (
      <ContactConfirmationEmail name={name} subject={subject} siteUrl={SITE_URL} />
    ),
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

interface SendContactNotificationParams {
  name: string
  email: string
  subject: string
  message: string
  submissionId?: string
  attachments?: Array<{
    name: string
    size: number
    type: string
  }>
}

export async function sendContactNotification({
  name,
  email,
  subject,
  message,
  submissionId,
  attachments,
}: SendContactNotificationParams) {
  const resend = getResendClient()
  if (!resend) return null

  const supportEmails = parseCommaSeparatedEmails(process.env.SUPPORT_TEAM_EMAILS)
  if (supportEmails.length === 0) return null

  const emailSubject = `New contact submission: ${subject}`

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: supportEmails,
    subject: emailSubject,
    replyTo: email,
    react: (
      <ContactNotificationEmail
        submissionId={submissionId}
        name={name}
        email={email}
        subject={subject}
        message={message}
        attachments={attachments}
        siteUrl={SITE_URL}
      />
    ),
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
