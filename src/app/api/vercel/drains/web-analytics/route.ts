import { supabaseAnalyticsAdmin } from '@/lib/supabase/analytics-admin'
import { type Json } from '@/lib/supabase/database.types'
import { parseJsonOrNdjson, stableEventId, verifyVercelSignature } from '@/lib/vercel/drains'
import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: 'vercel-drains-web-analytics',
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

function tryParseJsonString(value: unknown): unknown {
  if (typeof value !== 'string' || value.length === 0) return null
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export async function POST(request: Request) {
  const secret = process.env.VERCEL_DRAIN_WEB_ANALYTICS_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'Drain not configured. Set VERCEL_DRAIN_WEB_ANALYTICS_SECRET.' },
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

  const rows = events
    .map((event) => {
      if (!isRecord(event)) return null

      const ts = getNumber(event.timestamp)
      const timestamp = ts ? new Date(ts).toISOString() : new Date().toISOString()
      const eventType = getString(event.eventType) ?? 'event'
      const eventName = getString(event.eventName)
      const eventData = getString(event.eventData)

      const sessionId = getNumber(event.sessionId) ?? getString(event.sessionId)
      const deviceId = getNumber(event.deviceId) ?? getString(event.deviceId)

      const path = getString(event.path) ?? '/'
      const origin = getString(event.origin)

      const event_id = stableEventId([
        timestamp,
        getString(event.projectId) ?? '',
        eventType,
        eventName ?? '',
        path,
        sessionId ?? '',
        deviceId ?? '',
        eventData ?? '',
      ])

      const flagsParsed = tryParseJsonString(event.flags)
      const eventDataParsed = tryParseJsonString(event.eventData)

      return {
        event_id,
        schema: getString(event.schema),
        event_type: eventType,
        event_name: eventName,
        event_data: eventData,
        event_data_json:
          isRecord(eventDataParsed) || Array.isArray(eventDataParsed)
            ? asJson(eventDataParsed)
            : null,
        timestamp,
        project_id: getString(event.projectId),
        owner_id: getString(event.ownerId),
        data_source_name: getString(event.dataSourceName),
        session_id: sessionId ? String(sessionId) : null,
        device_id: deviceId ? String(deviceId) : null,
        origin,
        path,
        referrer: getString(event.referrer),
        query_params: getString(event.queryParams),
        route: getString(event.route),
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
        device_model: getString(event.deviceModel),
        browser_engine: getString(event.browserEngine),
        browser_engine_version: getString(event.browserEngineVersion),
        sdk_name: getString(event.sdkName),
        sdk_version: getString(event.sdkVersion),
        sdk_version_full: getString(event.sdkVersionFull),
        vercel_environment: getString(event.vercelEnvironment),
        vercel_url: getString(event.vercelUrl),
        flags: isRecord(flagsParsed) || Array.isArray(flagsParsed) ? asJson(flagsParsed) : null,
        deployment: getString(event.deployment),
        raw: asJson(event),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  for (const batch of chunk(rows, 500)) {
    const { error } = await supabaseAnalyticsAdmin
      .from('vercel_web_analytics_events')
      .upsert(batch, { onConflict: 'event_id' })
    if (error) {
      console.error('Vercel web analytics drain insert failed:', error)
      return NextResponse.json({ error: 'Insert failed.' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, inserted: rows.length })
}
