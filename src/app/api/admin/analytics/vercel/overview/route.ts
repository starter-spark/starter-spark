import { cacheDelete, cacheWrapJson } from '@/lib/cache'
import { createAnalyticsClient } from '@/lib/supabase/analytics-server'
import { type AnalyticsDatabase } from '@/lib/supabase/analytics-database.types'
import { NextResponse } from 'next/server'
import { type SupabaseClient } from '@supabase/supabase-js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function getNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.length > 0) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

type P75Row = { metric_type: string; p75: number; sample_count: number }

function normalizeP75Rows(value: unknown): P75Row[] {
  if (!Array.isArray(value)) return []
  return value
    .map((row) => {
      if (!isRecord(row)) return null
      const metric_type = getString(row.metric_type)
      if (!metric_type) return null
      return {
        metric_type,
        p75: getNumber(row.p75),
        sample_count: getNumber(row.sample_count),
      }
    })
    .filter((row): row is P75Row => row !== null)
}

type TopPage = { path: string; views: number }
function normalizeTopPages(value: unknown): TopPage[] {
  if (!Array.isArray(value)) return []
  return value
    .map((row) => {
      if (!isRecord(row)) return null
      const path = getString(row.path) ?? '/'
      return { path, views: getNumber(row.views) }
    })
    .filter((row): row is TopPage => row !== null)
}

function normalizeOverviewJson(value: unknown): {
  pageviews: number
  events: number
  unique_sessions: number
  top_pages: TopPage[]
} {
  if (!isRecord(value)) {
    return { pageviews: 0, events: 0, unique_sessions: 0, top_pages: [] }
  }
  return {
    pageviews: getNumber(value.pageviews),
    events: getNumber(value.events),
    unique_sessions: getNumber(value.unique_sessions),
    top_pages: normalizeTopPages(value.top_pages),
  }
}

function normalizeLogsOverview(value: unknown): {
  errors: number
  warnings: number
  top_errors: Array<{ message: string; count: number }>
} {
  if (!isRecord(value)) return { errors: 0, warnings: 0, top_errors: [] }

  const top_errors_raw = value.top_errors
  const top_errors = Array.isArray(top_errors_raw)
    ? top_errors_raw
        .map((row) => {
          if (!isRecord(row)) return null
          const message = getString(row.message)
          if (!message) return null
          return { message, count: getNumber(row.count) }
        })
        .filter((row): row is { message: string; count: number } => row !== null)
    : []

  return {
    errors: getNumber(value.errors),
    warnings: getNumber(value.warnings),
    top_errors,
  }
}

async function getLatestTimestamp(
  supabase: SupabaseClient<AnalyticsDatabase>,
  table:
    | 'vercel_speed_insights_events'
    | 'vercel_web_analytics_events'
    | 'vercel_log_entries',
): Promise<string | null> {
  const { data, error } = await supabase
    .from(table)
    .select('timestamp')
    .order('timestamp', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return null
  const first = data[0]
  return first?.timestamp ?? null
}

export async function GET(request: Request) {
  const supabase = await createAnalyticsClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const force = url.searchParams.get('force') === '1'
  const cacheKey = 'admin:vercel:overview'

  if (force) await cacheDelete(cacheKey)

  const payload = await cacheWrapJson(cacheKey, 60, async () => {
    const now = new Date()
    const nowIso = now.toISOString()
    const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      speedP75Res,
      web24Res,
      web7Res,
      logs24Res,
      latestSpeed,
      latestWeb,
      latestLogs,
    ] = await Promise.all([
      supabase.rpc('analytics_speed_insights_p75', {
        start_ts: start7d,
        end_ts: nowIso,
      }),
      supabase.rpc('analytics_web_analytics_overview', {
        start_ts: start24h,
        end_ts: nowIso,
      }),
      supabase.rpc('analytics_web_analytics_overview', {
        start_ts: start7d,
        end_ts: nowIso,
      }),
      supabase.rpc('analytics_logs_overview', {
        start_ts: start24h,
        end_ts: nowIso,
      }),
      getLatestTimestamp(supabase, 'vercel_speed_insights_events'),
      getLatestTimestamp(supabase, 'vercel_web_analytics_events'),
      getLatestTimestamp(supabase, 'vercel_log_entries'),
    ])

    const speedRows = normalizeP75Rows(speedP75Res.data)

    const web24 = normalizeOverviewJson(web24Res.data)
    const web7 = normalizeOverviewJson(web7Res.data)
    const logs24 = normalizeLogsOverview(logs24Res.data)

    return {
      ingestConfigured: {
        logs: Boolean(process.env.VERCEL_DRAIN_LOGS_SECRET),
        speedInsights: Boolean(process.env.VERCEL_DRAIN_SPEED_INSIGHTS_SECRET),
        webAnalytics: Boolean(process.env.VERCEL_DRAIN_WEB_ANALYTICS_SECRET),
        traces: Boolean(process.env.VERCEL_DRAIN_TRACES_SECRET),
      },
      windows: {
        now: nowIso,
        start24h,
        start7d,
      },
      latest: {
        speedInsights: latestSpeed,
        webAnalytics: latestWeb,
        logs: latestLogs,
      },
      speedInsights: {
        p75: speedRows,
      },
      webAnalytics: {
        last24h: web24,
        last7d: web7,
      },
      logs: {
        last24h: logs24,
      },
      errors: {
        speedInsights: speedP75Res.error?.message ?? null,
        web24h: web24Res.error?.message ?? null,
        web7d: web7Res.error?.message ?? null,
        logs24h: logs24Res.error?.message ?? null,
      },
    }
  })

  return NextResponse.json(payload)
}
