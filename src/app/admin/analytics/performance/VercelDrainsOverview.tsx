'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, RefreshCw, Zap, Activity, AlertTriangle } from 'lucide-react'

type VercelOverviewResponse = {
  ingestConfigured: {
    logs: boolean
    speedInsights: boolean
    webAnalytics: boolean
    traces: boolean
  }
  windows: {
    now: string
    start24h: string
    start7d: string
  }
  latest: {
    speedInsights: string | null
    webAnalytics: string | null
    logs: string | null
  }
  speedInsights: {
    p75: Array<{ metric_type: string; p75: number; sample_count: number }>
  }
  webAnalytics: {
    last24h: {
      pageviews: number
      events: number
      unique_sessions: number
      top_pages: Array<{ path: string; views: number }>
    }
    last7d: {
      pageviews: number
      events: number
      unique_sessions: number
      top_pages: Array<{ path: string; views: number }>
    }
  }
  logs: {
    last24h: {
      errors: number
      warnings: number
      top_errors: Array<{ message: string; count: number }>
    }
  }
  errors: {
    speedInsights: string | null
    web24h: string | null
    web7d: string | null
    logs24h: string | null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function getNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

type SpeedP75Row = { metric_type: string; p75: number; sample_count: number }

function parseOverview(value: unknown): VercelOverviewResponse | null {
  if (!isRecord(value)) return null
  if (!isRecord(value.ingestConfigured)) return null
  if (!isRecord(value.windows)) return null
  if (!isRecord(value.latest)) return null
  if (!isRecord(value.speedInsights)) return null
  if (!isRecord(value.webAnalytics)) return null
  if (!isRecord(value.logs)) return null
  if (!isRecord(value.errors)) return null

  const normalizeTopPages = (top: unknown): Array<{ path: string; views: number }> =>
    Array.isArray(top)
      ? top
          .map((row) => {
            if (!isRecord(row)) return null
            const path = getString(row.path) ?? '/'
            return { path, views: getNumber(row.views) }
          })
          .filter((row): row is { path: string; views: number } => row !== null)
      : []

  const normalizeWeb = (
    w: unknown,
  ): {
    pageviews: number
    events: number
    unique_sessions: number
    top_pages: Array<{ path: string; views: number }>
  } => {
    if (!isRecord(w)) return { pageviews: 0, events: 0, unique_sessions: 0, top_pages: [] }
    return {
      pageviews: getNumber(w.pageviews),
      events: getNumber(w.events),
      unique_sessions: getNumber(w.unique_sessions),
      top_pages: normalizeTopPages(w.top_pages),
    }
  }

  const normalizeLogs = (
    l: unknown,
  ): { errors: number; warnings: number; top_errors: Array<{ message: string; count: number }> } => {
    if (!isRecord(l)) return { errors: 0, warnings: 0, top_errors: [] }

    const top_errors = Array.isArray(l.top_errors)
      ? l.top_errors
          .map((row) => {
            if (!isRecord(row)) return null
            const message = getString(row.message)
            if (!message) return null
            return { message, count: getNumber(row.count) }
          })
          .filter((row): row is { message: string; count: number } => row !== null)
      : []

    return { errors: getNumber(l.errors), warnings: getNumber(l.warnings), top_errors }
  }

  const speedP75 = Array.isArray(value.speedInsights.p75)
    ? value.speedInsights.p75
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
        .filter((row): row is SpeedP75Row => row !== null)
    : []

  return {
    ingestConfigured: {
      logs: Boolean(value.ingestConfigured.logs),
      speedInsights: Boolean(value.ingestConfigured.speedInsights),
      webAnalytics: Boolean(value.ingestConfigured.webAnalytics),
      traces: Boolean(value.ingestConfigured.traces),
    },
    windows: {
      now: getString(value.windows.now) ?? '',
      start24h: getString(value.windows.start24h) ?? '',
      start7d: getString(value.windows.start7d) ?? '',
    },
    latest: {
      speedInsights: getString(value.latest.speedInsights),
      webAnalytics: getString(value.latest.webAnalytics),
      logs: getString(value.latest.logs),
    },
    speedInsights: { p75: speedP75 },
    webAnalytics: {
      last24h: normalizeWeb(value.webAnalytics.last24h),
      last7d: normalizeWeb(value.webAnalytics.last7d),
    },
    logs: {
      last24h: normalizeLogs(value.logs.last24h),
    },
    errors: {
      speedInsights: getString(value.errors.speedInsights),
      web24h: getString(value.errors.web24h),
      web7d: getString(value.errors.web7d),
      logs24h: getString(value.errors.logs24h),
    },
  }
}

function formatVercelMetric(metricType: string, value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (metricType === 'CLS') return value.toFixed(3)

  const isSeconds = metricType === 'LCP' || metricType === 'FCP'
  if (isSeconds) {
    const seconds = value >= 50 ? value / 1000 : value
    return `${seconds.toFixed(seconds < 10 ? 2 : 1)}s`
  }

  const ms = value >= 50_000 ? value / 1000 : value
  return `${Math.round(ms)}ms`
}

export function VercelDrainsOverview() {
  const [data, setData] = useState<VercelOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/analytics/vercel/overview${force ? '?force=1' : ''}`, {
        cache: 'no-store',
      })
      const raw: unknown = await res.json()
      const parsed = parseOverview(raw)
      if (!parsed) {
        setError('Unexpected response from Vercel analytics endpoint.')
        return
      }
      setData(parsed)

      const apiError =
        parsed.errors.speedInsights ??
        parsed.errors.web24h ??
        parsed.errors.web7d ??
        parsed.errors.logs24h

      if (apiError) setError(apiError)
    } catch {
      setError('Failed to load Vercel drains overview.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchOverview()
  }, [])

  const p75 = data?.speedInsights.p75 ?? []
  const speedMetrics = [
    { key: 'LCP', label: 'LCP (p75)' },
    { key: 'INP', label: 'INP (p75)' },
    { key: 'CLS', label: 'CLS (p75)' },
    { key: 'FCP', label: 'FCP (p75)' },
    { key: 'TTFB', label: 'TTFB (p75)' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Vercel Drains
              </CardTitle>
              <CardDescription>
                Speed Insights, Web Analytics, and Logs ingested via drains
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchOverview(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-600">Secrets</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className={data.ingestConfigured.speedInsights ? 'border-green-300 text-green-700' : ''}>
                      Speed Insights
                    </Badge>
                    <Badge variant="outline" className={data.ingestConfigured.webAnalytics ? 'border-green-300 text-green-700' : ''}>
                      Web Analytics
                    </Badge>
                    <Badge variant="outline" className={data.ingestConfigured.logs ? 'border-green-300 text-green-700' : ''}>
                      Logs
                    </Badge>
                    <Badge variant="outline" className={data.ingestConfigured.traces ? 'border-green-300 text-green-700' : ''}>
                      Traces
                    </Badge>
                  </div>
                </div>

                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-600">Latest Speed Insight</p>
                  <p className="mt-2 font-mono text-xs text-slate-900">
                    {data.latest.speedInsights ?? '—'}
                  </p>
                </div>

                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-600">Latest Web Event</p>
                  <p className="mt-2 font-mono text-xs text-slate-900">
                    {data.latest.webAnalytics ?? '—'}
                  </p>
                </div>

                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-600">Latest Log</p>
                  <p className="mt-2 font-mono text-xs text-slate-900">
                    {data.latest.logs ?? '—'}
                  </p>
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-2">
                <p>
                  Endpoint URLs:{' '}
                  <span className="font-mono">/api/vercel/drains/speed-insights</span>,{' '}
                  <span className="font-mono">/api/vercel/drains/web-analytics</span>,{' '}
                  <span className="font-mono">/api/vercel/drains/logs</span>,{' '}
                  <span className="font-mono">/api/vercel/drains/traces</span>
                </p>
                <p>
                  Security: <span className="font-mono">POST</span> only; requires{' '}
                  <span className="font-mono">x-vercel-signature</span> and{' '}
                  <span className="font-mono">x-starterspark-drains-token</span>{' '}
                  (value from <span className="font-mono">VERCEL_DRAINS_AUTH_TOKEN</span>).
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Speed Insights (p75, last 7 days)
          </CardTitle>
          <CardDescription>Computed from ingested Speed Insights events</CardDescription>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="text-sm text-slate-600">No data loaded.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {speedMetrics.map((m) => {
                const row = p75.find((r) => r.metric_type === m.key)
                const value = row ? formatVercelMetric(m.key, row.p75) : '—'
                return (
                  <div key={m.key} className="rounded border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-600">{m.label}</p>
                    <p className="mt-2 font-mono text-xl font-bold text-slate-900">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      samples: <span className="font-mono">{row?.sample_count ?? 0}</span>
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Web Analytics
          </CardTitle>
          <CardDescription>Ingested pageviews and custom events</CardDescription>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="text-sm text-slate-600">No data loaded.</div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-600">Pageviews (24h)</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                    {data.webAnalytics.last24h.pageviews.toLocaleString()}
                  </p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-600">Sessions (24h)</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                    {data.webAnalytics.last24h.unique_sessions.toLocaleString()}
                  </p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-600">Custom Events (24h)</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                    {data.webAnalytics.last24h.events.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-3">
                  Top Pages (7 days)
                </p>
                {data.webAnalytics.last7d.top_pages.length === 0 ? (
                  <div className="text-sm text-slate-600">No pageviews found.</div>
                ) : (
                  <div className="space-y-2">
                    {data.webAnalytics.last7d.top_pages.map((page, idx) => (
                      <div
                        key={`${page.path}-${idx}`}
                        className="flex items-center justify-between rounded bg-slate-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="text-xs">
                            {idx + 1}
                          </Badge>
                          <code className="text-sm text-slate-700 truncate">
                            {page.path}
                          </code>
                        </div>
                        <span className="font-mono text-sm text-slate-600">
                          {page.views.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Logs (last 24 hours)
          </CardTitle>
          <CardDescription>Ingested Vercel log drains</CardDescription>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="text-sm text-slate-600">No data loaded.</div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-600">Errors</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                    {data.logs.last24h.errors.toLocaleString()}
                  </p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-600">Warnings</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                    {data.logs.last24h.warnings.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-3">
                  Top Errors
                </p>
                {data.logs.last24h.top_errors.length === 0 ? (
                  <div className="text-sm text-slate-600">No errors found.</div>
                ) : (
                  <div className="space-y-2">
                    {data.logs.last24h.top_errors.map((row, idx) => (
                      <div
                        key={`${row.message}-${idx}`}
                        className="flex items-start justify-between gap-4 rounded bg-slate-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700 truncate">
                            {row.message}
                          </p>
                        </div>
                        <span className="font-mono text-sm text-slate-600">
                          {row.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
