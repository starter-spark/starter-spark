type ResendWebhookPayload = {
  type?: string
  created_at?: string
  data?: {
    email_id?: string
    to?: string[]
    subject?: string
  }
}

type ResendEmailStatus = {
  id: string
  type: string
  status: string
  updatedAt: number
  to?: string[]
  subject?: string
}

const STATUS_TTL_MS = 1000 * 60 * 60
const emailStatusStore = new Map<string, ResendEmailStatus>()

function normalizeStatus(type?: string): string {
  switch (type) {
    case 'email.sent':
      return 'sent'
    case 'email.delivered':
      return 'delivered'
    case 'email.delivery_delayed':
      return 'delivery_delayed'
    case 'email.failed':
      return 'failed'
    case 'email.bounced':
      return 'bounced'
    case 'email.complained':
      return 'complained'
    case 'email.opened':
      return 'opened'
    case 'email.clicked':
      return 'clicked'
    case 'email.received':
      return 'received'
    default:
      return 'unknown'
  }
}

function pruneStatusStore(now: number) {
  for (const [key, entry] of emailStatusStore.entries()) {
    if (now - entry.updatedAt > STATUS_TTL_MS) {
      emailStatusStore.delete(key)
    }
  }
}

export function recordResendWebhookEvent(payload: ResendWebhookPayload) {
  const emailId = payload.data?.email_id
  if (!emailId) return

  const now = Date.now()
  pruneStatusStore(now)

  emailStatusStore.set(emailId, {
    id: emailId,
    type: payload.type || 'unknown',
    status: normalizeStatus(payload.type),
    updatedAt: now,
    to: payload.data?.to,
    subject: payload.data?.subject,
  })
}

export function getResendWebhookStatus(emailId: string) {
  if (!emailId) return null
  pruneStatusStore(Date.now())
  return emailStatusStore.get(emailId) || null
}
