import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, CreditCard, Mail, Shield, ExternalLink } from 'lucide-react'
import { SiteStatsManager } from './SiteStatsManager'
import { AuditLogViewer } from './AuditLogViewer'

export const metadata = {
  title: 'Settings | Admin',
}

async function getSystemInfo() {
  const supabase = await createClient()

  // Get counts for system overview
  const [
    productsResult,
    licensesResult,
    usersResult,
    eventsResult,
    postsResult,
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('licenses').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }),
  ])

  return {
    products: productsResult.count || 0,
    licenses: licensesResult.count || 0,
    users: usersResult.count || 0,
    events: eventsResult.count || 0,
    posts: postsResult.count || 0,
  }
}

async function getSiteStats() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('site_stats')
    .select(
      'id, key, value, label, suffix, is_auto_calculated, auto_source, visible_on',
    )
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching site stats:', error)
    return []
  }

  return data
}

async function getAuditLogs() {
  // Defense-in-depth: verify admin/staff before using service role.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return []
  }

  // Use admin client to fetch audit logs (RLS requires admin role)
  const { data: logs, error } = await supabaseAdmin
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching audit logs:', error)
    return []
  }

  // Fetch user emails for display
  if (logs && logs.length > 0) {
    const userIds = [
      ...new Set(
        logs
          .map((log) => log.user_id)
          .filter(
            (id): id is string => typeof id === 'string' && id.length > 0,
          ),
      ),
    ]

    if (userIds.length === 0) {
      return logs.map((log) => ({ ...log, user_email: undefined }))
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching audit log user emails:', profilesError)
      return logs.map((log) => ({ ...log, user_email: undefined }))
    }

    const emailMap = new Map(profiles?.map((p) => [p.id, p.email]) || [])

    return logs.map((log) => ({
      ...log,
      user_email: log.user_id ? emailMap.get(log.user_id) : undefined,
    }))
  }

  return logs || []
}

export default async function SettingsPage() {
  const [systemInfo, siteStats, auditLogs] = await Promise.all([
    getSystemInfo(),
    getSiteStats(),
    getAuditLogs(),
  ])

  const integrations = [
    {
      name: 'Supabase',
      description: 'Database and authentication',
      icon: Database,
      status: 'connected',
      url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    {
      name: 'Stripe',
      description: 'Payment processing',
      icon: CreditCard,
      status: process.env.STRIPE_SECRET_KEY ? 'connected' : 'not configured',
      url: 'https://dashboard.stripe.com',
    },
    {
      name: 'Resend',
      description: 'Email delivery',
      icon: Mail,
      status: process.env.RESEND_API_KEY ? 'connected' : 'not configured',
      url: 'https://resend.com/dashboard',
    },
    {
      name: 'Sentry',
      description: 'Error tracking',
      icon: Shield,
      status: process.env.NEXT_PUBLIC_SENTRY_DSN
        ? 'connected'
        : 'not configured',
      url: 'https://sentry.io',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          Settings
        </h1>
        <p className="text-slate-600">System configuration and integrations</p>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Current database statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-lg border border-slate-200 p-3 text-center">
              <p className="font-mono text-2xl font-bold text-slate-900">
                {systemInfo.products}
              </p>
              <p className="text-xs text-slate-600">Products</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-center">
              <p className="font-mono text-2xl font-bold text-slate-900">
                {systemInfo.licenses}
              </p>
              <p className="text-xs text-slate-600">Licenses</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-center">
              <p className="font-mono text-2xl font-bold text-slate-900">
                {systemInfo.users}
              </p>
              <p className="text-xs text-slate-600">Users</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-center">
              <p className="font-mono text-2xl font-bold text-slate-900">
                {systemInfo.events}
              </p>
              <p className="text-xs text-slate-600">Events</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-center">
              <p className="font-mono text-2xl font-bold text-slate-900">
                {systemInfo.posts}
              </p>
              <p className="text-xs text-slate-600">Posts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Stats Management */}
      <SiteStatsManager stats={siteStats} />

      {/* Audit Log */}
      <AuditLogViewer logs={auditLogs} />

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connected services and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration) => {
              const Icon = integration.icon
              return (
                <div
                  key={integration.name}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {integration.name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        integration.status === 'connected'
                          ? 'border-green-300 text-green-700'
                          : 'border-amber-300 text-amber-700'
                      }
                    >
                      {integration.status}
                    </Badge>
                    {integration.url && (
                      <a
                        href={integration.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>Current deployment environment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Node Environment</span>
              <code className="text-sm text-slate-900">
                {process.env.NODE_ENV || 'development'}
              </code>
            </div>
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Supabase URL</span>
              <code className="max-w-[300px] truncate text-sm text-slate-900">
                {process.env.SUPABASE_URL ||
                  process.env.NEXT_PUBLIC_SUPABASE_URL ||
                  'Not set'}
              </code>
            </div>
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">App URL</span>
              <code className="text-sm text-slate-900">
                {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
