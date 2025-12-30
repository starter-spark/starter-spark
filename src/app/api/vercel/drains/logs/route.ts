import { supabaseAnalyticsAdmin } from '@/lib/supabase/analytics-admin'
import { type Json } from '@/lib/supabase/database.types'
import { parseJsonOrNdjson, stableEventId, verifyVercelSignature } from '@/lib/vercel/drains'
import { NextResponse } from 'next/server'

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
  const secret = process.env.VERCEL_DRAIN_LOGS_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'Drain not configured. Set VERCEL_DRAIN_LOGS_SECRET.' },
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

      const id =
        getString(event.id) ??
        stableEventId([
          getString(event.deploymentId),
          getString(event.source),
          getNumber(event.timestamp) ?? '',
          getString(event.level),
          getString(event.message) ?? '',
        ])

      const tsMs = getNumber(event.timestamp)
      const timestamp = tsMs ? new Date(tsMs).toISOString() : new Date().toISOString()

      return {
        id,
        deployment_id: getString(event.deploymentId),
        source: getString(event.source) ?? 'unknown',
        host: getString(event.host),
        timestamp,
        project_id: getString(event.projectId),
        level: getString(event.level) ?? 'info',
        message: getString(event.message),
        build_id: getString(event.buildId),
        entrypoint: getString(event.entrypoint),
        destination: getString(event.destination),
        path: getString(event.path),
        type: getString(event.type),
        status_code: getNumber(event.statusCode),
        request_id: getString(event.requestId),
        environment: getString(event.environment),
        branch: getString(event.branch),
        ja3_digest: getString(event.ja3Digest),
        ja4_digest: getString(event.ja4Digest),
        edge_type: getString(event.edgeType),
        project_name: getString(event.projectName),
        execution_region: getString(event.executionRegion),
        trace_id: getString(event.traceId) ?? getString(event['trace.id']),
        span_id: getString(event.spanId) ?? getString(event['span.id']),
        proxy: isRecord(event.proxy) ? asJson(event.proxy) : null,
        raw: asJson(event),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  for (const batch of chunk(rows, 500)) {
    const { error } = await supabaseAnalyticsAdmin
      .from('vercel_log_entries')
      .upsert(batch, { onConflict: 'id' })
    if (error) {
      console.error('Vercel logs drain insert failed:', error)
      return NextResponse.json({ error: 'Insert failed.' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, inserted: rows.length })
}
