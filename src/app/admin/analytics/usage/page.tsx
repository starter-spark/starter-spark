import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  Activity,
  ExternalLink,
  BarChart3,
  Info,
  Settings,
  MousePointer,
  Users,
} from 'lucide-react'
import { PostHogInsights } from './PostHogInsights'

export const metadata = {
  title: 'Usage Analytics | Admin',
}

export default function UsageAnalyticsPage() {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
  const posthogPersonalApiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const posthogProjectId = process.env.POSTHOG_PROJECT_ID

  const isConfigured = !!posthogKey
  const hasApiAccess = !!(posthogPersonalApiKey && posthogProjectId)

  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-cyan-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Analytics
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono text-2xl font-bold text-slate-900">
              Usage Analytics
            </h1>
            <p className="text-slate-600">
              Product analytics and user behavior via PostHog
            </p>
          </div>
          <a
            href={posthogHost}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <BarChart3 className="h-4 w-4" />
            Open PostHog Dashboard
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            PostHog Status
          </CardTitle>
          <CardDescription>Product analytics configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Activity className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Event Capture</p>
                  <p className="text-sm text-slate-500">
                    Page views and custom events
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  isConfigured
                    ? 'border-green-300 text-green-700'
                    : 'border-amber-300 text-amber-700'
                }
              >
                {isConfigured ? 'Active' : 'Not Configured'}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <MousePointer className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Session Recording</p>
                  <p className="text-sm text-slate-500">
                    User session replays
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  isConfigured
                    ? 'border-green-300 text-green-700'
                    : 'border-slate-300 text-slate-600'
                }
              >
                {isConfigured ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Users className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">User Identification</p>
                  <p className="text-sm text-slate-500">
                    Link events to user profiles
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  isConfigured
                    ? 'border-green-300 text-green-700'
                    : 'border-slate-300 text-slate-600'
                }
              >
                {isConfigured ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Settings className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">API Access</p>
                  <p className="text-sm text-slate-500">
                    Read-only access to insights
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  hasApiAccess
                    ? 'border-green-300 text-green-700'
                    : 'border-slate-300 text-slate-600'
                }
              >
                {hasApiAccess ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights or Setup Instructions */}
      {hasApiAccess ? (
        <PostHogInsights />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Setup API Access
            </CardTitle>
            <CardDescription>
              Configure PostHog API access to view insights here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600 mb-4">
                To display PostHog insights in this dashboard, add the following environment variables:
              </p>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-start gap-2">
                  <code className="rounded bg-slate-200 px-2 py-1">POSTHOG_PERSONAL_API_KEY</code>
                  <span className="text-slate-500">- Personal API key with <code>query:read</code> scope</span>
                </div>
                <div className="flex items-start gap-2">
                  <code className="rounded bg-slate-200 px-2 py-1">POSTHOG_PROJECT_ID</code>
                  <span className="text-slate-500">- Your PostHog project ID</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <a
                  href="https://posthog.com/docs/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-cyan-700 hover:underline"
                >
                  Learn more about PostHog API access
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Current PostHog settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Client Key Configured</span>
              <code className="text-sm text-slate-900">
                {isConfigured ? 'Yes' : 'No'}
              </code>
            </div>
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Host</span>
              <code className="text-sm text-slate-900 truncate max-w-[250px]">
                {posthogHost}
              </code>
            </div>
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Project ID</span>
              <code className="text-sm text-slate-900">
                {posthogProjectId || 'Not set'}
              </code>
            </div>
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">API Access</span>
              <code className="text-sm text-slate-900">
                {hasApiAccess ? 'Configured' : 'Not configured'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
