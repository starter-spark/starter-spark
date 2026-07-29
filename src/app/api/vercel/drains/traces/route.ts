import crypto from 'crypto'
import { supabaseAnalyticsAdmin } from '@/lib/supabase/analytics-admin'
import { type Json } from '@/lib/supabase/database.types'
import { parseJsonOrNdjson, stableEventId } from '@/lib/vercel/drains'
import { guardVercelDrainRequest } from '@/lib/vercel/drains-guard'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export function GET() {
  return new NextResponse(null, { status: 404 })
}

export function HEAD() {
  return new NextResponse(null, { status: 404 })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 404 })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asJson(value: unknown): Json {
  return value as Json
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size))
  return out
}

export async function POST(request: Request) {
  const guarded = await guardVercelDrainRequest(request, {
    secret: process.env.VERCEL_DRAIN_TRACES_SECRET,
    allowedContentType: /protobuf|octet-stream|json|ndjson|text\/plain/i,
    requireAuthHeader: true,
  })
  if (!guarded.ok) return guarded.response

  const contentType = guarded.contentType
  const body = guarded.body

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
      return new NextResponse(null, { status: 500 })
    }
    return new NextResponse(null, { status: 204 })
  }

  const text = body.toString('utf8')
  const events = parseJsonOrNdjson(text)
  if (events.length === 0) {
    return new NextResponse(null, { status: 204 })
  }

  // Deduplicate by event_id (Postgres can't handle duplicate IDs in same upsert)
  const rowMap = new Map<
    string,
    { event_id: string; content_type: string; body_json: Json }
  >()

  for (const event of events) {
    if (!isRecord(event)) continue
    // Use content hash for stable ID instead of index
    const event_id = stableEventId([contentType, JSON.stringify(event)])
    rowMap.set(event_id, {
      event_id,
      content_type: contentType,
      body_json: asJson(event),
    })
  }

  const rows = Array.from(rowMap.values())

  for (const batch of chunk(rows, 500)) {
    const { error } = await supabaseAnalyticsAdmin
      .from('vercel_trace_events')
      .upsert(batch, { onConflict: 'event_id' })
    if (error) {
      console.error('Vercel traces drain insert failed:', error)
      return new NextResponse(null, { status: 500 })
    }
  }

  return new NextResponse(null, { status: 204 })
}
