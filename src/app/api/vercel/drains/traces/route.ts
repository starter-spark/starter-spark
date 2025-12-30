import crypto from 'crypto'
import { supabaseAnalyticsAdmin } from '@/lib/supabase/analytics-admin'
import { type Json } from '@/lib/supabase/database.types'
import { parseJsonOrNdjson, stableEventId, verifyVercelSignature } from '@/lib/vercel/drains'
import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: 'vercel-drains-traces',
      note: 'Send a POST request from Vercel Drains with x-vercel-signature.',
    },
    { status: 200 },
  )
}

export function HEAD() {
  return new NextResponse(null, { status: 200 })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asJson(value: unknown): Json {
  return value as Json
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export async function POST(request: Request) {
  const secret = process.env.VERCEL_DRAIN_TRACES_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'Drain not configured. Set VERCEL_DRAIN_TRACES_SECRET.' },
      { status: 500 },
    )
  }

  const contentType = request.headers.get('content-type') ?? ''
  const body = Buffer.from(await request.arrayBuffer())
  if (body.length > 5_000_000) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 })
  }

  const signatureHeader = request.headers.get('x-vercel-signature')
  const ok = verifyVercelSignature({ body, signatureHeader, secret })
  if (!ok) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  if (/protobuf/i.test(contentType)) {
    const event_id = crypto.createHash('sha256').update(body).digest('hex')
    const { error } = await supabaseAnalyticsAdmin
      .from('vercel_trace_events')
      .upsert(
        [
          {
            event_id,
            content_type: contentType,
            body_base64: body.toString('base64'),
          },
        ],
        { onConflict: 'event_id' },
      )
    if (error) {
      console.error('Vercel traces drain insert failed:', error)
      return NextResponse.json({ error: 'Insert failed.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, inserted: 1 })
  }

  const text = body.toString('utf8')
  const events = parseJsonOrNdjson(text)
  if (events.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 })
  }

  const rows = events
    .map((event, index) => {
      if (!isRecord(event)) return null
      return {
        event_id: stableEventId([contentType, index, JSON.stringify(event)]),
        content_type: contentType,
        body_json: asJson(event),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  for (const batch of chunk(rows, 500)) {
    const { error } = await supabaseAnalyticsAdmin
      .from('vercel_trace_events')
      .upsert(batch, { onConflict: 'event_id' })
    if (error) {
      console.error('Vercel traces drain insert failed:', error)
      return NextResponse.json({ error: 'Insert failed.' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, inserted: rows.length })
}
