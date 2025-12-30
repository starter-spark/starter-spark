import { createClient } from '@/lib/supabase/server'
import { cacheWrapJson } from '@/lib/cache'
import { NextResponse } from 'next/server'

interface PostHogStats {
  uniqueUsers24h: number
  uniqueUsers7d: number
  pageviews24h: number
  pageviews7d: number
  sessions24h: number
  sessions7d: number
  topPages: Array<{ path: string; count: number }>
}

interface HogQLResult {
  results: unknown[][]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function safePath(value: unknown): string {
  if (typeof value === 'string' && value.length > 0) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return '/'
}

export async function GET() {
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

  // Check for PostHog configuration
  const posthogPersonalApiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const posthogProjectId = process.env.POSTHOG_PROJECT_ID
  // API host is different from ingest host - strip the .i. subdomain if present
  const ingestHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
  const posthogHost = process.env.POSTHOG_API_HOST || ingestHost.replace('.i.posthog.com', '.posthog.com')

  if (!posthogPersonalApiKey || !posthogProjectId) {
    return NextResponse.json({
      error: 'PostHog API not configured. Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID.',
      stats: null,
    })
  }

  try {
    const cacheKey = `admin:posthog:overview:${posthogProjectId}`

    const stats = await cacheWrapJson(cacheKey, 300, async () => {
      // Helper to run HogQL queries
      async function runQuery(query: string): Promise<HogQLResult> {
        const response = await fetch(
          `${posthogHost}/api/projects/${posthogProjectId}/query/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${posthogPersonalApiKey}`,
            },
            body: JSON.stringify({
              query: {
                kind: 'HogQLQuery',
                query,
              },
            }),
            cache: 'no-store',
          },
        )

        if (!response.ok) {
          throw new Error(`PostHog API error: ${response.status}`)
        }

        const raw: unknown = await response.json()
        if (
          !isRecord(raw) ||
          !Array.isArray(raw.results) ||
          !raw.results.every(Array.isArray)
        ) {
          throw new Error('Unexpected PostHog response')
        }
        return { results: raw.results as unknown[][] }
      }

      // Run queries in parallel
      const [
        users24hResult,
        users7dResult,
        pageviews24hResult,
        pageviews7dResult,
        sessions24hResult,
        sessions7dResult,
        topPagesResult,
      ] = await Promise.all([
        runQuery(
          `SELECT count(DISTINCT person_id) FROM events WHERE timestamp > now() - interval 1 day`,
        ),
        runQuery(
          `SELECT count(DISTINCT person_id) FROM events WHERE timestamp > now() - interval 7 day`,
        ),
        runQuery(
          `SELECT count() FROM events WHERE event = '$pageview' AND timestamp > now() - interval 1 day`,
        ),
        runQuery(
          `SELECT count() FROM events WHERE event = '$pageview' AND timestamp > now() - interval 7 day`,
        ),
        runQuery(
          `SELECT count(DISTINCT \"$session_id\") FROM events WHERE timestamp > now() - interval 1 day AND \"$session_id\" IS NOT NULL`,
        ),
        runQuery(
          `SELECT count(DISTINCT \"$session_id\") FROM events WHERE timestamp > now() - interval 7 day AND \"$session_id\" IS NOT NULL`,
        ),
        runQuery(
          `SELECT properties.$pathname as path, count() as c FROM events WHERE event = '$pageview' AND timestamp > now() - interval 7 day GROUP BY path ORDER BY c DESC LIMIT 10`,
        ),
      ])

      const getScalar = (result: HogQLResult): number =>
        Number(result.results?.[0]?.[0] ?? 0)

      // Extract values from results
      const computed: PostHogStats = {
        uniqueUsers24h: getScalar(users24hResult),
        uniqueUsers7d: getScalar(users7dResult),
        pageviews24h: getScalar(pageviews24hResult),
        pageviews7d: getScalar(pageviews7dResult),
        sessions24h: getScalar(sessions24hResult),
        sessions7d: getScalar(sessions7dResult),
        topPages: (topPagesResult.results ?? []).map((row) => ({
          path: safePath(row[0]),
          count: Number(row[1] ?? 0),
        })),
      }

      return computed
    })

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Failed to fetch PostHog insights:', error)
    return NextResponse.json({
      error: 'Failed to fetch PostHog insights',
      stats: null,
    })
  }
}
