'use client'

import { useState, useEffect, useCallback } from 'react'
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
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Clock,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  EyeOff,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react'

interface SentryIssue {
  id: string
  shortId: string
  title: string
  culprit: string
  count: string
  userCount: number
  firstSeen: string
  lastSeen: string
  level: 'fatal' | 'error' | 'warning' | 'info'
  status: 'resolved' | 'unresolved' | 'ignored'
  permalink: string
  project: { id: string; slug: string; name: string } | null
  metadata: { type?: string; value?: string } | null
  stats: { '24h': Array<[number, number]> } | null
  isUnhandled: boolean
  platform: string
}

interface SentryStats {
  totalIssues: number
  unresolvedCount: number
  resolvedCount: number
  ignoredCount: number
  totalEvents24h: number
  totalUsersAffected: number
  levelBreakdown: { fatal: number; error: number; warning: number; info: number }
  hourlyTrend: Array<{ hour: number; count: number }>
}

interface SentryDashboard {
  issues: SentryIssue[]
  stats: SentryStats
  pagination: {
    cursor: string | null
    hasMore: boolean
    total: number
  }
}

interface SentryResponse {
  dashboard: SentryDashboard | null
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

function parseIssue(row: unknown): SentryIssue | null {
  if (!isRecord(row)) return null
  const id = getString(row.id)
  if (!id) return null

  const level = getString(row.level)
  const status = getString(row.status)
  const permalink = getString(row.permalink)

  let projectData: SentryIssue['project'] = null
  if (isRecord(row.project)) {
    projectData = {
      id: getString(row.project.id) ?? '',
      slug: getString(row.project.slug) ?? '',
      name: getString(row.project.name) ?? '',
    }
  }

  let metadataData: SentryIssue['metadata'] = null
  if (isRecord(row.metadata)) {
    metadataData = {
      type: getString(row.metadata.type) ?? undefined,
      value: getString(row.metadata.value) ?? undefined,
    }
  }

  let stats: SentryIssue['stats'] = null
  if (isRecord(row.stats) && Array.isArray(row.stats['24h'])) {
    stats = {
      '24h': (row.stats['24h'] as unknown[]).map((item) => {
        if (Array.isArray(item) && item.length >= 2) {
          return [getNumber(item[0]), getNumber(item[1])] as [number, number]
        }
        return [0, 0] as [number, number]
      }),
    }
  }

  return {
    id,
    shortId: getString(row.shortId) ?? '',
    title: getString(row.title) ?? '',
    culprit: getString(row.culprit) ?? '',
    count: getString(row.count) ?? '0',
    userCount: getNumber(row.userCount),
    firstSeen: getString(row.firstSeen) ?? '',
    lastSeen: getString(row.lastSeen) ?? '',
    level:
      level === 'fatal' || level === 'error' || level === 'warning' || level === 'info'
        ? level
        : 'error',
    status:
      status === 'resolved' || status === 'unresolved' || status === 'ignored'
        ? status
        : 'unresolved',
    permalink: permalink ?? '',
    project: projectData,
    metadata: metadataData,
    stats,
    isUnhandled: row.isUnhandled === true,
    platform: getString(row.platform) ?? 'unknown',
  }
}

function parseSentryResponse(value: unknown): SentryResponse | null {
  if (!isRecord(value)) return null
  const error = getString(value.error)

  if (!isRecord(value.dashboard)) {
    return { dashboard: null, error: error ?? undefined }
  }

  const dashboardRaw = value.dashboard
  const issuesRaw = dashboardRaw.issues
  const issues = Array.isArray(issuesRaw)
    ? issuesRaw.map(parseIssue).filter((i): i is SentryIssue => i !== null)
    : []

  let stats: SentryStats = {
    totalIssues: 0,
    unresolvedCount: 0,
    resolvedCount: 0,
    ignoredCount: 0,
    totalEvents24h: 0,
    totalUsersAffected: 0,
    levelBreakdown: { fatal: 0, error: 0, warning: 0, info: 0 },
    hourlyTrend: [],
  }

  if (isRecord(dashboardRaw.stats)) {
    const s = dashboardRaw.stats
    stats = {
      totalIssues: getNumber(s.totalIssues),
      unresolvedCount: getNumber(s.unresolvedCount),
      resolvedCount: getNumber(s.resolvedCount),
      ignoredCount: getNumber(s.ignoredCount),
      totalEvents24h: getNumber(s.totalEvents24h),
      totalUsersAffected: getNumber(s.totalUsersAffected),
      levelBreakdown: isRecord(s.levelBreakdown)
        ? {
            fatal: getNumber(s.levelBreakdown.fatal),
            error: getNumber(s.levelBreakdown.error),
            warning: getNumber(s.levelBreakdown.warning),
            info: getNumber(s.levelBreakdown.info),
          }
        : { fatal: 0, error: 0, warning: 0, info: 0 },
      hourlyTrend: Array.isArray(s.hourlyTrend)
        ? (s.hourlyTrend as unknown[])
            .map((item) => {
              if (isRecord(item)) {
                return { hour: getNumber(item.hour), count: getNumber(item.count) }
              }
              return null
            })
            .filter((item): item is { hour: number; count: number } => item !== null)
        : [],
    }
  }

  let pagination = { cursor: null as string | null, hasMore: false, total: 0 }
  if (isRecord(dashboardRaw.pagination)) {
    pagination = {
      cursor: getString(dashboardRaw.pagination.cursor),
      hasMore: dashboardRaw.pagination.hasMore === true,
      total: getNumber(dashboardRaw.pagination.total),
    }
  }

  return {
    dashboard: { issues, stats, pagination },
    error: error ?? undefined,
  }
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

const levelColors: Record<string, string> = {
  fatal: 'bg-red-100 text-red-700 border-red-200',
  error: 'bg-orange-100 text-orange-700 border-orange-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
}

const statusIcons = {
  unresolved: AlertCircle,
  resolved: CheckCircle2,
  ignored: EyeOff,
}

// Mini sparkline chart for hourly trend
function TrendChart({ data }: { data: Array<{ hour: number; count: number }> }) {
  if (data.length === 0) return null

  const max = Math.max(...data.map((d) => d.count), 1)
  const height = 40
  const width = 200

  return (
    <svg width={width} height={height} className="text-cyan-600">
      <defs>
        <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d={`M 0 ${height} ${data
          .map((d, i) => {
            const x = (i / (data.length - 1)) * width
            const y = height - (d.count / max) * (height - 4)
            return `L ${x} ${y}`
          })
          .join(' ')} L ${width} ${height} Z`}
        fill="url(#trendGradient)"
      />
      {/* Line */}
      <path
        d={data
          .map((d, i) => {
            const x = (i / (data.length - 1)) * width
            const y = height - (d.count / max) * (height - 4)
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
          })
          .join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type StatusFilter = 'unresolved' | 'resolved' | 'ignored' | 'all'

export function SentryIssuesList() {
  const [dashboard, setDashboard] = useState<SentryDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unresolved')
  const [cursorHistory, setCursorHistory] = useState<string[]>([])
  const [currentCursor, setCurrentCursor] = useState<string | null>(null)

  const fetchIssues = useCallback(
    async (cursor: string | null = null) => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('status', statusFilter)
        if (cursor) params.set('cursor', cursor)

        const res = await fetch(`/api/admin/analytics/sentry?${params.toString()}`)
        const raw: unknown = await res.json()
        const data = parseSentryResponse(raw)

        if (!data) {
          setError('Unexpected Sentry response')
          return
        }

        if (data.error) {
          setError(data.error)
        } else {
          setDashboard(data.dashboard)
        }
      } catch {
        setError('Failed to fetch Sentry issues')
      } finally {
        setLoading(false)
      }
    },
    [statusFilter],
  )

  useEffect(() => {
    setCursorHistory([])
    setCurrentCursor(null)
    void fetchIssues(null)
  }, [fetchIssues])

  const handleNextPage = () => {
    if (dashboard?.pagination.cursor) {
      setCursorHistory((prev) => [...prev, currentCursor || ''])
      setCurrentCursor(dashboard.pagination.cursor)
      void fetchIssues(dashboard.pagination.cursor)
    }
  }

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory]
      const prevCursor = newHistory.pop() || null
      setCursorHistory(newHistory)
      setCurrentCursor(prevCursor)
      void fetchIssues(prevCursor || null)
    }
  }

  const stats = dashboard?.stats
  const issues = dashboard?.issues || []

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <AlertTriangle className="h-5 w-5 text-orange-700" />
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-slate-900">
                    {stats.unresolvedCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600">Unresolved Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <Zap className="h-5 w-5 text-red-700" />
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-slate-900">
                    {stats.totalEvents24h.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600">Events (24h)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Users className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-slate-900">
                    {stats.totalUsersAffected.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600">Users Affected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-slate-900">
                    {stats.resolvedCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend and Level Breakdown */}
      {stats && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Hourly Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Event Trend (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.hourlyTrend.length > 0 ? (
                <div className="flex items-end justify-between">
                  <TrendChart data={stats.hourlyTrend} />
                  <div className="text-right text-xs text-slate-500">
                    <div>
                      Peak:{' '}
                      {Math.max(...stats.hourlyTrend.map((d) => d.count)).toLocaleString()}
                    </div>
                    <div>
                      Avg:{' '}
                      {Math.round(
                        stats.hourlyTrend.reduce((a, b) => a + b.count, 0) /
                          stats.hourlyTrend.length,
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">No trend data available</div>
              )}
            </CardContent>
          </Card>

          {/* Level Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Level Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg bg-red-50 p-3 text-center">
                  <p className="font-mono text-lg font-bold text-red-700">
                    {stats.levelBreakdown.fatal}
                  </p>
                  <p className="text-xs text-red-600">Fatal</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-3 text-center">
                  <p className="font-mono text-lg font-bold text-orange-700">
                    {stats.levelBreakdown.error}
                  </p>
                  <p className="text-xs text-orange-600">Error</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <p className="font-mono text-lg font-bold text-amber-700">
                    {stats.levelBreakdown.warning}
                  </p>
                  <p className="text-xs text-amber-600">Warning</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <p className="font-mono text-lg font-bold text-blue-700">
                    {stats.levelBreakdown.info}
                  </p>
                  <p className="text-xs text-blue-600">Info</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Issues
              </CardTitle>
              <CardDescription>
                {statusFilter === 'all' ? 'All issues' : `${statusFilter} issues`} sorted by last
                seen
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchIssues(currentCursor)}
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

          {/* Status Filter Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                { key: 'unresolved', label: 'Unresolved', Icon: AlertCircle },
                { key: 'resolved', label: 'Resolved', Icon: CheckCircle2 },
                { key: 'ignored', label: 'Ignored', Icon: EyeOff },
                { key: 'all', label: 'All', Icon: Activity },
              ] as const
            ).map(({ key, label, Icon }) => (
              <Button
                key={key}
                variant={statusFilter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(key)}
                className="gap-1"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {stats && key !== 'all' && (
                  <Badge variant="secondary" className="ml-1 font-mono text-xs">
                    {key === 'unresolved'
                      ? stats.unresolvedCount
                      : key === 'resolved'
                        ? stats.resolvedCount
                        : stats.ignoredCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading && issues.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                {statusFilter === 'unresolved' ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <p className="font-medium text-slate-900">
                {statusFilter === 'unresolved' ? 'No unresolved issues!' : 'No issues found'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {statusFilter === 'unresolved'
                  ? 'Great job! Everything is resolved.'
                  : `No ${statusFilter} issues found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => {
                const StatusIcon = statusIcons[issue.status] || AlertCircle
                return (
                  <div
                    key={issue.id}
                    className="rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={levelColors[issue.level] || levelColors.error}
                          >
                            {issue.level}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {issue.status}
                          </Badge>
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                            {issue.shortId}
                          </code>
                          {issue.isUnhandled && (
                            <Badge
                              variant="outline"
                              className="border-red-200 bg-red-50 text-red-600"
                            >
                              Unhandled
                            </Badge>
                          )}
                          <span className="text-xs text-slate-400">{issue.platform}</span>
                        </div>
                        <p className="truncate font-medium text-slate-900">{issue.title}</p>
                        {issue.metadata?.type && (
                          <p className="mt-0.5 truncate text-sm text-slate-600">
                            {issue.metadata.type}
                            {issue.metadata.value && `: ${issue.metadata.value}`}
                          </p>
                        )}
                        <p className="mt-1 truncate text-sm text-slate-500">{issue.culprit}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(issue.lastSeen)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {issue.userCount} user{issue.userCount !== 1 ? 's' : ''}
                          </span>
                          <span>
                            {issue.count} event{Number(issue.count) !== 1 ? 's' : ''}
                          </span>
                          <span className="text-slate-400">
                            First seen: {formatTimeAgo(issue.firstSeen)}
                          </span>
                        </div>
                      </div>
                      <a
                        href={issue.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-slate-400 hover:text-cyan-700"
                        title="View in Sentry"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )
              })}

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={cursorHistory.length === 0 || loading}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-slate-500">
                  Showing {issues.length} issue{issues.length !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!dashboard?.pagination.hasMore || loading}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
