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
  AlertTriangle,
  ExternalLink,
  Shield,
  Info,
  Settings,
} from 'lucide-react'
import { SentryIssuesList } from './SentryIssuesList'

export const metadata = {
  title: 'Error Analytics | Admin',
}

export default function ErrorAnalyticsPage() {
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  const sentryOrg = process.env.SENTRY_ORG
  const sentryProject = process.env.SENTRY_PROJECT
  const sentryReadToken = process.env.SENTRY_READ_TOKEN || process.env.SENTRY_AUTH_TOKEN

  const isConfigured = !!sentryDsn
  const hasApiAccess = !!(sentryOrg && sentryProject && sentryReadToken)

  // Extract project info from DSN if available
  let projectId: string | null = null
  if (sentryDsn) {
    const match = sentryDsn.match(/\/(\d+)$/)
    if (match) {
      projectId = match[1]
    }
  }

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
              Error Analytics
            </h1>
            <p className="text-slate-600">
              Error tracking and issue monitoring via Sentry
            </p>
          </div>
          <a
            href="https://sentry.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Shield className="h-4 w-4" />
            Open Sentry Dashboard
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sentry Status
          </CardTitle>
          <CardDescription>Error tracking configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <AlertTriangle className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Error Capture</p>
                  <p className="text-sm text-slate-500">
                    Client and server-side error tracking
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
                  <Settings className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">API Access</p>
                  <p className="text-sm text-slate-500">
                    Read-only access to Sentry issues
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

      {/* Issues List or Setup Instructions */}
      {hasApiAccess ? (
        <SentryIssuesList />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Setup API Access
            </CardTitle>
            <CardDescription>
              Configure Sentry API access to view issues here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600 mb-4">
                To display Sentry issues in this dashboard, add the following environment variables:
              </p>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-start gap-2">
                  <code className="rounded bg-slate-200 px-2 py-1">SENTRY_ORG</code>
                  <span className="text-slate-500">- Your Sentry organization slug</span>
                </div>
                <div className="flex items-start gap-2">
                  <code className="rounded bg-slate-200 px-2 py-1">SENTRY_PROJECT</code>
                  <span className="text-slate-500">- Your Sentry project slug</span>
                </div>
                <div className="flex items-start gap-2">
                  <code className="rounded bg-slate-200 px-2 py-1">SENTRY_READ_TOKEN</code>
                  <span className="text-slate-500">- API token with <code>event:read</code>, <code>project:read</code>, <code>org:read</code> scopes</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Note: <code>SENTRY_READ_TOKEN</code> is separate from <code>SENTRY_AUTH_TOKEN</code> (used for source map uploads).
                Create a new token in Sentry under Settings → Auth Tokens with read-only permissions.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <a
                  href="https://docs.sentry.io/api/auth/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-cyan-700 hover:underline"
                >
                  Learn more about Sentry API authentication
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
          <CardDescription>Current Sentry settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">DSN Configured</span>
              <Badge variant="outline" className={isConfigured ? 'border-green-300 text-green-700' : 'border-slate-300 text-slate-600'}>
                {isConfigured ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Read Token</span>
              <Badge variant="outline" className={sentryReadToken ? 'border-green-300 text-green-700' : 'border-slate-300 text-slate-600'}>
                {sentryReadToken ? 'Configured' : 'Not set'}
              </Badge>
            </div>
            {projectId && (
              <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">Project ID (from DSN)</span>
                <code className="text-sm text-slate-900">{projectId}</code>
              </div>
            )}
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Organization</span>
              <code className="text-sm text-slate-900">{sentryOrg || 'Not set'}</code>
            </div>
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Project</span>
              <code className="text-sm text-slate-900">{sentryProject || 'Not set'}</code>
            </div>
            {sentryOrg && sentryProject && (
              <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">Dashboard Link</span>
                <a
                  href={`https://sentry.io/organizations/${sentryOrg}/issues/?project=${projectId || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-cyan-700 hover:underline"
                >
                  Open in Sentry
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
