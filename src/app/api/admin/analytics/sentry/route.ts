import { createClient } from '@/lib/supabase/server'
import { cacheWrapJson } from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'

// Types for Sentry API responses
interface SentryIssue {
  id: string
  shortId: string
  title: string
  culprit: string
  count: string
  userCount: number
  firstSeen: string
  lastSeen: string
  level: string
  status: string
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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

function normalizeIssue(value: unknown): SentryIssue | null {
  if (!isRecord(value)) return null
  const id = getString(value.id)
  if (!id) return null

  let projectData: SentryIssue['project'] = null
  if (isRecord(value.project)) {
    projectData = {
      id: getString(value.project.id) ?? '',
      slug: getString(value.project.slug) ?? '',
      name: getString(value.project.name) ?? '',
    }
  }

  let metadataData: SentryIssue['metadata'] = null
  if (isRecord(value.metadata)) {
    metadataData = {
      type: getString(value.metadata.type) ?? undefined,
      value: getString(value.metadata.value) ?? undefined,
    }
  }

  let stats: SentryIssue['stats'] = null
  if (isRecord(value.stats) && Array.isArray(value.stats['24h'])) {
    stats = {
      '24h': value.stats['24h'].map((item: unknown) => {
        if (Array.isArray(item) && item.length >= 2) {
          return [getNumber(item[0]), getNumber(item[1])] as [number, number]
        }
        return [0, 0] as [number, number]
      }),
    }
  }

  return {
    id,
    shortId: getString(value.shortId) ?? '',
    title: getString(value.title) ?? '',
    culprit: getString(value.culprit) ?? '',
    count: getString(value.count) ?? '0',
    userCount: getNumber(value.userCount),
    firstSeen: getString(value.firstSeen) ?? '',
    lastSeen: getString(value.lastSeen) ?? '',
    level: getString(value.level) ?? 'error',
    status: getString(value.status) ?? 'unresolved',
    permalink: getString(value.permalink) ?? '',
    project: projectData,
    metadata: metadataData,
    stats,
    isUnhandled: value.isUnhandled === true,
    platform: getString(value.platform) ?? 'unknown',
  }
}

// Parse Link header for pagination
// Sentry format: <URL>; rel="next"; results="true"; cursor="..."
function parseLinkHeader(header: string | null): { next: string | null; cursor: string | null; hasMore: boolean } {
  if (!header) return { next: null, cursor: null, hasMore: false }

  const parts = header.split(',')

  for (const part of parts) {
    // Check if this is the "next" link
    if (part.includes('rel="next"')) {
      // Check if results="true" (meaning there are actually more results)
      const hasResults = part.includes('results="true"')
      if (!hasResults) {
        return { next: null, cursor: null, hasMore: false }
      }

      // Extract URL
      const urlMatch = part.match(/<([^>]+)>/)
      if (urlMatch) {
        const url = new URL(urlMatch[1])
        const cursor = url.searchParams.get('cursor')
        return { next: urlMatch[1], cursor, hasMore: true }
      }
    }
  }

  return { next: null, cursor: null, hasMore: false }
}

export async function GET(request: NextRequest) {
  // Verify admin access
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  // Check for Sentry configuration - use SENTRY_READ_TOKEN for dashboard access
  const sentryOrg = process.env.SENTRY_ORG
  const sentryProject = process.env.SENTRY_PROJECT
  const sentryAuthToken = process.env.SENTRY_READ_TOKEN || process.env.SENTRY_AUTH_TOKEN

  if (!sentryOrg || !sentryProject || !sentryAuthToken) {
    return NextResponse.json({
      error: 'Sentry API not configured. Set SENTRY_ORG, SENTRY_PROJECT, and SENTRY_READ_TOKEN.',
      dashboard: null,
    })
  }

  // Parse query params
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') || 'unresolved'
  const cursor = searchParams.get('cursor')
  const limit = Math.min(getNumber(searchParams.get('limit')) || 25, 100)

  try {
    // Build cache key based on params
    const cacheKey = `admin:sentry:dashboard:${sentryOrg}:${sentryProject}:${status}:${cursor || 'initial'}:${limit}`

    const dashboard = await cacheWrapJson<SentryDashboard>(cacheKey, 60, async () => {
      // Step 1: Get project ID
      const projectUrl = `https://sentry.io/api/0/projects/${sentryOrg}/${sentryProject}/`
      const projectResponse = await fetch(projectUrl, {
        headers: { Authorization: `Bearer ${sentryAuthToken}` },
        cache: 'no-store',
      })

      let projectId: string | null = null
      if (projectResponse.ok) {
        const projectData: unknown = await projectResponse.json()
        if (isRecord(projectData)) {
          projectId = getString(projectData.id)
        }
      } else if (projectResponse.status === 404) {
        throw new Error(
          `Sentry project "${sentryProject}" not found in org "${sentryOrg}".`,
        )
      } else if (projectResponse.status === 403) {
        throw new Error(
          `Sentry access denied. Ensure SENTRY_READ_TOKEN has "project:read", "event:read", and "org:read" scopes.`,
        )
      }

      // Step 2: Fetch issues with stats
      const issuesUrl = new URL(
        `https://sentry.io/api/0/organizations/${sentryOrg}/issues/`,
      )
      if (projectId && /^\d+$/.test(projectId)) {
        issuesUrl.searchParams.set('project', projectId)
      }

      // Build query based on status filter
      let query = ''
      if (status === 'unresolved') {
        query = 'is:unresolved'
      } else if (status === 'resolved') {
        query = 'is:resolved'
      } else if (status === 'ignored') {
        query = 'is:ignored'
      } else if (status === 'all') {
        query = '' // No filter
      } else {
        query = 'is:unresolved'
      }

      if (query) {
        issuesUrl.searchParams.set('query', query)
      }
      // Use groupStatsPeriod to get stats without filtering issues by time period
      // statsPeriod would filter to only issues with events in that period
      issuesUrl.searchParams.set('groupStatsPeriod', '24h')
      issuesUrl.searchParams.set('limit', String(limit))
      issuesUrl.searchParams.set('sort', 'date') // Sort by last seen

      if (cursor) {
        issuesUrl.searchParams.set('cursor', cursor)
      }

      const issuesResponse = await fetch(issuesUrl.toString(), {
        headers: { Authorization: `Bearer ${sentryAuthToken}` },
        cache: 'no-store',
      })

      if (!issuesResponse.ok) {
        const errorText = await issuesResponse.text()
        console.error('Sentry API error:', issuesResponse.status, errorText)

        if (issuesResponse.status === 403) {
          throw new Error(
            `Sentry access denied. Ensure SENTRY_READ_TOKEN has "event:read" scope.`,
          )
        }
        throw new Error(`Sentry API error: ${issuesResponse.status}`)
      }

      const linkHeader = issuesResponse.headers.get('Link')
      const paginationInfo = parseLinkHeader(linkHeader)

      const issuesRaw: unknown = await issuesResponse.json()

      const issues: SentryIssue[] = Array.isArray(issuesRaw)
        ? issuesRaw.map(normalizeIssue).filter((i): i is SentryIssue => i !== null)
        : []

      // Step 3: Fetch counts for all statuses (for stats)
      // We fetch with limit=100 to get actual counts (Sentry doesn't have a count-only endpoint)
      const fetchStatusCount = async (query: string): Promise<{ count: number; hasMore: boolean }> => {
        const url = new URL(`https://sentry.io/api/0/organizations/${sentryOrg}/issues/`)
        if (projectId && /^\d+$/.test(projectId)) {
          url.searchParams.set('project', projectId)
        }
        url.searchParams.set('query', query)
        // Don't filter by statsPeriod - we want total counts
        url.searchParams.set('limit', '100')

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${sentryAuthToken}` },
          cache: 'no-store',
        })

        if (!res.ok) {
          return { count: 0, hasMore: false }
        }

        const data: unknown = await res.json()
        const count = Array.isArray(data) ? data.length : 0
        const link = res.headers.get('Link')
        // Sentry uses results="true" or results="false" to indicate if there are more pages
        // The rel="next" is ALWAYS present, so we need to check results="true" specifically
        const hasMore = !!link && link.includes('rel="next"') && link.includes('results="true"')

        return { count, hasMore }
      }

      const [unresolvedData, resolvedData, ignoredData] = await Promise.all([
        fetchStatusCount('is:unresolved'),
        fetchStatusCount('is:resolved'),
        fetchStatusCount('is:ignored'),
      ])

      const unresolvedCount = unresolvedData.count + (unresolvedData.hasMore ? 100 : 0) // Add 100+ indicator if paginated
      const resolvedCount = resolvedData.count + (resolvedData.hasMore ? 100 : 0)
      const ignoredCount = ignoredData.count + (ignoredData.hasMore ? 100 : 0)

      // Calculate stats from issues
      const levelBreakdown = { fatal: 0, error: 0, warning: 0, info: 0 }
      let totalEvents24h = 0
      let totalUsersAffected = 0
      const hourlyBuckets = new Map<number, number>()

      for (const issue of issues) {
        // Count by level with explicit checks
        if (issue.level === 'fatal') levelBreakdown.fatal++
        else if (issue.level === 'warning') levelBreakdown.warning++
        else if (issue.level === 'info') levelBreakdown.info++
        else levelBreakdown.error++

        totalEvents24h += getNumber(issue.count)
        totalUsersAffected += issue.userCount

        // Aggregate hourly stats
        if (issue.stats?.['24h']) {
          for (const [timestamp, count] of issue.stats['24h']) {
            const hour = new Date(timestamp * 1000).getHours()
            hourlyBuckets.set(hour, (hourlyBuckets.get(hour) ?? 0) + count)
          }
        }
      }

      // Build hourly trend (last 24 hours)
      const hourlyTrend: Array<{ hour: number; count: number }> = []
      const now = new Date()
      for (let i = 23; i >= 0; i--) {
        const hour = (now.getHours() - i + 24) % 24
        hourlyTrend.push({ hour, count: hourlyBuckets.get(hour) ?? 0 })
      }

      const stats: SentryStats = {
        totalIssues: issues.length,
        unresolvedCount: unresolvedCount || issues.filter((i) => i.status === 'unresolved').length,
        resolvedCount: resolvedCount || issues.filter((i) => i.status === 'resolved').length,
        ignoredCount: ignoredCount || issues.filter((i) => i.status === 'ignored').length,
        totalEvents24h,
        totalUsersAffected,
        levelBreakdown,
        hourlyTrend,
      }

      return {
        issues,
        stats,
        pagination: {
          cursor: paginationInfo.cursor,
          hasMore: paginationInfo.hasMore,
          total: issues.length,
        },
      }
    })

    return NextResponse.json({ dashboard })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch Sentry data'
    console.error('Failed to fetch Sentry data:', error)
    return NextResponse.json({
      error: message,
      dashboard: null,
    })
  }
}
