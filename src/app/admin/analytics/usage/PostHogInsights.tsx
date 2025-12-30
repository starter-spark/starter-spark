'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  RefreshCw,
  Loader2,
  Users,
  MousePointer,
  TrendingUp,
} from 'lucide-react'

interface PostHogStats {
  uniqueUsers24h: number
  uniqueUsers7d: number
  pageviews24h: number
  pageviews7d: number
  sessions24h: number
  sessions7d: number
  topPages: Array<{ path: string; count: number }>
}

interface PostHogResponse {
  stats: PostHogStats | null
  error?: string
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

function parsePostHogResponse(value: unknown): PostHogResponse | null {
  if (!isRecord(value)) return null

  const statsRaw = value.stats
  const error = getString(value.error)

  if (statsRaw === null) {
    return { stats: null, error: error ?? undefined }
  }

  if (!isRecord(statsRaw)) {
    return { stats: null, error: error ?? 'Invalid PostHog response.' }
  }

  const topPagesRaw = statsRaw.topPages
  const topPages = Array.isArray(topPagesRaw)
    ? topPagesRaw
        .map((row) => {
          if (!isRecord(row)) return null
          const path = getString(row.path) ?? '/'
          return { path, count: getNumber(row.count) }
        })
        .filter((row): row is { path: string; count: number } => row !== null)
    : []

  return {
    stats: {
      uniqueUsers24h: getNumber(statsRaw.uniqueUsers24h),
      uniqueUsers7d: getNumber(statsRaw.uniqueUsers7d),
      pageviews24h: getNumber(statsRaw.pageviews24h),
      pageviews7d: getNumber(statsRaw.pageviews7d),
      sessions24h: getNumber(statsRaw.sessions24h),
      sessions7d: getNumber(statsRaw.sessions7d),
      topPages,
    },
    error: error ?? undefined,
  }
}

export function PostHogInsights() {
  const [stats, setStats] = useState<PostHogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/analytics/posthog')
      const raw: unknown = await res.json()
      const data = parsePostHogResponse(raw)

      if (!data) {
        setError('Unexpected PostHog response')
        return
      }

      if (data.error) {
        setError(data.error)
      } else {
        setStats(data.stats)
      }
    } catch {
      setError('Failed to fetch PostHog insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStats()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Usage Insights
            </CardTitle>
            <CardDescription>
              Key metrics from PostHog analytics
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchStats()}
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
        {loading && !stats ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Users className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-slate-900">
                      {stats.uniqueUsers24h.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600">Unique Users (24h)</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  7-day: {stats.uniqueUsers7d.toLocaleString()}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <MousePointer className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-slate-900">
                      {stats.pageviews24h.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600">Page Views (24h)</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  7-day: {stats.pageviews7d.toLocaleString()}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <TrendingUp className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-slate-900">
                      {stats.sessions24h.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600">Sessions (24h)</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  7-day: {stats.sessions7d.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Top Pages */}
            {stats.topPages && stats.topPages.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3">
                  Top Pages (7 days)
                </h3>
                <div className="space-y-2">
                  {stats.topPages.map((page, index) => (
                    <div
                      key={page.path}
                      className="flex items-center justify-between rounded bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {index + 1}
                        </Badge>
                        <code className="text-sm text-slate-700">{page.path}</code>
                      </div>
                      <span className="font-mono text-sm text-slate-600">
                        {page.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
              <Activity className="h-6 w-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900">No data available</p>
            <p className="text-sm text-slate-500 mt-1">
              Check your PostHog configuration
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
