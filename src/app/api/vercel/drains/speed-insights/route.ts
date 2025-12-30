import { supabaseAnalyticsAdmin } from '@/lib/supabase/analytics-admin'
import { type Json } from '@/lib/supabase/database.types'
import { parseJsonOrNdjson, stableEventId, verifyVercelSignature } from '@/lib/vercel/drains'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: 'vercel-drains-speed-insights',
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

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function getNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.length > 0) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export async function POST(request: Request) {
  const secret = process.env.VERCEL_DRAIN_SPEED_INSIGHTS_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'Drain not configured. Set VERCEL_DRAIN_SPEED_INSIGHTS_SECRET.' },
      { status: 500 },
    )
  }

  const body = Buffer.from(await request.arrayBuffer())
  if (body.length > 5_000_000) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 })
  }

  const signatureHeader = request.headers.get('x-vercel-signature')
  const ok = verifyVercelSignature({ body, signatureHeader, secret })
  if (!ok) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  const text = body.toString('utf8')
  const events = parseJsonOrNdjson(text)
  if (events.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 })
  }

  // Deduplicate by event_id (Postgres can't handle duplicate IDs in same upsert)
  const rowMap = new Map<string, NonNullable<ReturnType<typeof mapEventToRow>>>()

  function mapEventToRow(event: unknown) {
    if (!isRecord(event)) return null

    const timestampIso = getString(event.timestamp)
    const timestamp = timestampIso ? new Date(timestampIso).toISOString() : new Date().toISOString()
    const metricType = getString(event.metricType) ?? 'unknown'
    const value = getNumber(event.value) ?? 0
    const path = getString(event.path)
    const route = getString(event.route)
    const deviceId = getNumber(event.deviceId) ?? getString(event.deviceId)

    const event_id =
      getString(event.eventId) ??
      stableEventId([timestamp, metricType, value, path ?? '', route ?? '', deviceId ?? ''])

    return {
      event_id,
      timestamp,
      metric_type: metricType,
      value,
      project_id: getString(event.projectId),
      owner_id: getString(event.ownerId),
      device_id: deviceId ? String(deviceId) : null,
      origin: getString(event.origin),
      path,
      route,
      country: getString(event.country),
      region: getString(event.region),
      city: getString(event.city),
      os_name: getString(event.osName),
      os_version: getString(event.osVersion),
      client_name: getString(event.clientName),
      client_type: getString(event.clientType),
      client_version: getString(event.clientVersion),
      device_type: getString(event.deviceType),
      device_brand: getString(event.deviceBrand),
      connection_speed: getString(event.connectionSpeed),
      browser_engine: getString(event.browserEngine),
      browser_engine_version: getString(event.browserEngineVersion),
      sdk_name: getString(event.sdkName),
      sdk_version: getString(event.sdkVersion),
      vercel_environment: getString(event.vercelEnvironment),
      vercel_url: getString(event.vercelUrl),
      deployment_id: getString(event.deploymentId),
      raw: asJson(event),
    }
  }

  for (const event of events) {
    const row = mapEventToRow(event)
    if (row) {
      rowMap.set(row.event_id, row)
    }
  }

  const rows = Array.from(rowMap.values())

  for (const batch of chunk(rows, 500)) {
    const { error } = await supabaseAnalyticsAdmin
      .from('vercel_speed_insights_events')
      .upsert(batch, { onConflict: 'event_id' })
    if (error) {
      console.error('Vercel speed insights drain insert failed:', error)
      return NextResponse.json({ error: 'Insert failed.' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, inserted: rows.length })
}
