'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Database,
  KeyRound,
  Loader2,
  RefreshCw,
  Radio,
  Server,
} from 'lucide-react'

type UsageSeriesPoint = {
  timestamp: string
  total_auth_requests: number
  total_realtime_requests: number
  total_rest_requests: number
  total_storage_requests: number
}

type SupabaseUsageSuccess = {
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
}

type SupabaseUsageNotConfigured = {
  configured: false
  error: string
  projectRef: string | null
  series: []
  totals: null
  totalRequests: null
}

type SupabaseUsageResponse = SupabaseUsageSuccess | SupabaseUsageNotConfigured

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

function parseUsageResponse(value: unknown): SupabaseUsageResponse | null {
  if (!isRecord(value)) return null
  const configured = value.configured
  if (configured === true) {
    const projectRef = getString(value.projectRef)
    const totals = isRecord(value.totals) ? value.totals : null
    if (!projectRef || !totals) return null

    const seriesRaw = value.series
    const series: UsageSeriesPoint[] = Array.isArray(seriesRaw)
      ? seriesRaw
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
      : []

    return {
      configured: true,
      projectRef,
      interval: getString(value.interval),
      series,
      totals: {
        rest: getNumber(totals.rest),
        auth: getNumber(totals.auth),
        storage: getNumber(totals.storage),
        realtime: getNumber(totals.realtime),
      },
      totalRequests: getNumber(value.totalRequests),
      errors: isRecord(value.errors) ? (value.errors as SupabaseUsageSuccess['errors']) : null,
    }
  }

  if (configured === false) {
    const error = getString(value.error)
    if (!error) return null
    return {
      configured: false,
      error,
      projectRef: getString(value.projectRef),
      series: [],
      totals: null,
      totalRequests: null,
    }
  }

  return null
}

export function SupabaseUsage() {
  const [data, setData] = useState<SupabaseUsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)

  const fetchUsage = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/analytics/supabase', { cache: 'no-store' })
      const raw: unknown = await res.json()
      const parsed = parseUsageResponse(raw)

      if (!parsed) {
        setError('Unexpected response from Supabase analytics endpoint.')
        return
      }

      setData(parsed)
      setFetchedAt(new Date())

      if (!parsed.configured) {
        setError(parsed.error)
        return
      }

      if (parsed.errors?.usage) {
        setError(parsed.errors.usage)
      } else if (parsed.errors?.totalRequests) {
        setError(parsed.errors.totalRequests)
      }
    } catch {
      setError('Failed to load Supabase usage analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUsage()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Supabase Usage
            </CardTitle>
            <CardDescription>
              Request counts from the Supabase Management API
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {data?.configured && (
              <Badge variant="outline" className="text-xs">
                {data.projectRef}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchUsage()}
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
        </div>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : data?.configured ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-cyan-100">
                    <Database className="h-5 w-5 text-cyan-700" />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-slate-900">
                      {data.totals.rest.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600">REST (period)</p>
                  </div>
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-amber-100">
                    <KeyRound className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-slate-900">
                      {data.totals.auth.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600">Auth (period)</p>
                  </div>
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-green-100">
                    <Database className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-slate-900">
                      {data.totals.storage.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600">Storage (period)</p>
                  </div>
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100">
                    <Radio className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-slate-900">
                      {data.totals.realtime.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600">Realtime (period)</p>
                  </div>
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100">
                    <Server className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-slate-900">
                      {data.totalRequests.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600">Total (period)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span>
                Series points: <span className="font-mono">{data.series.length}</span>
              </span>
              <span>
                Updated:{' '}
                <span className="font-mono">
                  {fetchedAt ? fetchedAt.toLocaleTimeString() : '—'}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Supabase usage analytics is not configured.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

