import { cacheWrapJson } from '@/lib/cache'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function getNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

function getSupabaseProjectRef(): string | null {
  const explicit = process.env.SUPABASE_PROJECT_REF
  if (explicit) return explicit

  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!url) return null

  const match = /https:\/\/([^.]+)\.supabase\.co/.exec(url)
  return match?.[1] ?? null
}

type UsageSeriesPoint = {
  timestamp: string
  total_auth_requests: number
  total_realtime_requests: number
  total_rest_requests: number
  total_storage_requests: number
}

function normalizeUsageSeries(payload: unknown): {
  series: UsageSeriesPoint[]
  error: string | null
} {
  if (!isRecord(payload)) return { series: [], error: null }

  const error = getString(payload.error) ?? null
  const rawResult = payload.result
  if (!isUnknownArray(rawResult)) return { series: [], error }

  const series: UsageSeriesPoint[] = rawResult
    .map((row) => {
      if (!isRecord(row)) return null
      const timestamp = getString(row.timestamp)
      if (!timestamp) return null

      return {
        timestamp,
        total_auth_requests: getNumber(row.total_auth_requests),
        total_realtime_requests: getNumber(row.total_realtime_requests),
        total_rest_requests: getNumber(row.total_rest_requests),
        total_storage_requests: getNumber(row.total_storage_requests),
      }
    })
    .filter((row): row is UsageSeriesPoint => row !== null)

  return { series, error }
}

function normalizeApiRequestsCount(payload: unknown): { count: number; error: string | null } {
  if (!isRecord(payload)) return { count: 0, error: null }
  const error = getString(payload.error) ?? null
  const rawResult = payload.result
  if (!isUnknownArray(rawResult)) return { count: 0, error }

  const first = rawResult[0]
  if (!isRecord(first)) return { count: 0, error }
  return { count: getNumber(first.count), error }
}

export async function GET(request: Request) {
  const supabase = await createClient()
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

  const projectRef = getSupabaseProjectRef()
  const token = process.env.SUPABASE_MGMT_TOKEN

  if (!projectRef) {
    return NextResponse.json({
      configured: false,
      error:
        'Supabase project ref not found. Set SUPABASE_PROJECT_REF or SUPABASE_URL.',
      projectRef: null,
      series: [],
      totals: null,
      totalRequests: null,
    })
  }

  if (!token) {
    return NextResponse.json({
      configured: false,
      error:
        'Supabase Management API not configured. Set SUPABASE_MGMT_TOKEN to enable usage analytics.',
      projectRef,
      series: [],
      totals: null,
      totalRequests: null,
    })
  }

  const url = new URL(request.url)
  const interval = url.searchParams.get('interval')

  const cacheKey = `supabase:usage:${projectRef}:${interval ?? 'default'}`

  const payload = await cacheWrapJson(
    cacheKey,
    120,
    async (): Promise<{
      configured: true
      projectRef: string
      interval: string | null
      series: UsageSeriesPoint[]
      totals: {
        rest: number
        auth: number
        storage: number
        realtime: number
      }
      totalRequests: number
      errors: { usage?: string; totalRequests?: string } | null
    }> => {
      const usageUrl = new URL(
        `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/usage.api-counts`,
      )
      if (interval) usageUrl.searchParams.set('interval', interval)

      const [usageRes, totalRes] = await Promise.all([
        fetch(usageUrl.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(
          `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/usage.api-requests-count`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          },
        ),
      ])

      const errors: { usage?: string; totalRequests?: string } = {}

      const usageJson: unknown = usageRes.ok ? await usageRes.json() : null
      if (!usageRes.ok) {
        errors.usage = `Supabase Management API error (${usageRes.status})`
      }

      const totalJson: unknown = totalRes.ok ? await totalRes.json() : null
      if (!totalRes.ok) {
        errors.totalRequests = `Supabase Management API error (${totalRes.status})`
      }

      const { series, error: usageError } = normalizeUsageSeries(usageJson)
      const { count, error: totalError } = normalizeApiRequestsCount(totalJson)

      if (usageError) errors.usage = usageError
      if (totalError) errors.totalRequests = totalError

      const totals = series.reduce(
        (acc, point) => ({
          rest: acc.rest + point.total_rest_requests,
          auth: acc.auth + point.total_auth_requests,
          storage: acc.storage + point.total_storage_requests,
          realtime: acc.realtime + point.total_realtime_requests,
        }),
        { rest: 0, auth: 0, storage: 0, realtime: 0 },
      )

      const totalRequests =
        count > 0 ? count : totals.rest + totals.auth + totals.storage + totals.realtime

      return {
        configured: true,
        projectRef,
        interval,
        series,
        totals,
        totalRequests,
        errors: Object.keys(errors).length ? errors : null,
      }
    },
  )

  return NextResponse.json(payload)
}
