import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error(
      'Missing RESEND_WEBHOOK_SECRET for Resend webhook verification.',
    )
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 },
    )
  }

  const id = request.headers.get('svix-id')
  const timestamp = request.headers.get('svix-timestamp')
  const signature = request.headers.get('svix-signature')

  if (!id || !timestamp || !signature) {
    return NextResponse.json(
      { error: 'Missing signature headers' },
      { status: 400 },
    )
  }

  const payloadText = await request.text()

  let event: unknown
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    event = resend.webhooks.verify({
      payload: payloadText,
      headers: { id, timestamp, signature },
      webhookSecret,
    })
  } catch (error) {
    console.error('Invalid Resend webhook signature:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const { type, data } = (event ?? {}) as {
    type?: string
    data?: { email_id?: string }
  }
  if (type === 'email.bounced' || type === 'email.complained') {
    console.error(`Resend delivery problem: ${type} for ${data?.email_id}`)
  }

  return NextResponse.json({ received: true })
}
