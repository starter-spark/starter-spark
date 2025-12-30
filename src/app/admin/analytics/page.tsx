import { createClient } from '@/lib/supabase/server'
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
  Database,
  CreditCard,
  Mail,
  Shield,
  ExternalLink,
  Activity,
  Server,
  BarChart3,
  AlertTriangle,
  Zap,
  Users,
  Package,
  KeyRound,
  Calendar,
  MessageSquare,
} from 'lucide-react'

export const metadata = {
  title: 'Analytics | Admin',
}

async function getSystemStats() {
  const supabase = await createClient()

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

// Get app URL from environment or Vercel system env
function getAppUrl(): string {
  // Check for explicitly set app URL first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  // Vercel provides VERCEL_PROJECT_PRODUCTION_URL for production deployments
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  // Vercel provides VERCEL_URL for preview deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // Fallback for local development
  return 'http://localhost:3000'
}

export default async function AnalyticsPage() {
  const systemStats = await getSystemStats()

  const integrations: Array<{
    name: string
    description: string
    icon: typeof Database
    status: 'connected' | 'not configured'
    url: string | undefined
  }> = [
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
      status: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'connected' : 'not configured',
      url: 'https://sentry.io',
    },
    {
      name: 'PostHog',
      description: 'Product analytics',
      icon: BarChart3,
      status: process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'connected' : 'not configured',
      url: 'https://app.posthog.com',
    },
    {
      name: 'Upstash',
      description: 'Redis rate limiting',
      icon: Zap,
      status: process.env.UPSTASH_REDIS_REST_URL ? 'connected' : 'not configured',
      url: 'https://console.upstash.com',
    },
  ]

  const analyticsSubpages = [
    {
      href: '/admin/analytics/database',
      title: 'Database',
      description: 'Supabase metrics and query performance',
      icon: Database,
      badge: 'Supabase',
    },
    {
      href: '/admin/analytics/errors',
      title: 'Errors',
      description: 'Error tracking and issue monitoring',
      icon: AlertTriangle,
      badge: 'Sentry',
    },
    {
      href: '/admin/analytics/usage',
      title: 'Usage',
      description: 'Product analytics and user behavior',
      icon: Activity,
      badge: 'PostHog',
    },
    {
      href: '/admin/analytics/performance',
      title: 'Performance',
      description: 'Web Vitals and speed metrics',
      icon: Zap,
      badge: 'Vercel',
    },
  ]

  const statCards = [
    { label: 'Products', value: systemStats.products, icon: Package },
    { label: 'Licenses', value: systemStats.licenses, icon: KeyRound },
    { label: 'Users', value: systemStats.users, icon: Users },
    { label: 'Events', value: systemStats.events, icon: Calendar },
    { label: 'Posts', value: systemStats.posts, icon: MessageSquare },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          Analytics
        </h1>
        <p className="text-slate-600">
          Unified view of system metrics and service integrations
        </p>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Overview
          </CardTitle>
          <CardDescription>Current database statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-mono text-2xl font-bold text-slate-900">
                        {stat.value}
                      </p>
                      <p className="text-xs text-slate-600">{stat.label}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Subpages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detailed Analytics
          </CardTitle>
          <CardDescription>
            Explore metrics from connected services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {analyticsSubpages.map((page) => {
              const Icon = page.icon
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className="group flex items-start gap-4 rounded-lg border border-slate-200 p-4 transition-colors hover:border-cyan-200 hover:bg-cyan-50/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-cyan-100">
                    <Icon className="h-5 w-5 text-slate-600 group-hover:text-cyan-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 group-hover:text-cyan-700">
                        {page.title}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {page.badge}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {page.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connected services and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => {
              const Icon = integration.icon
              return (
                <div
                  key={integration.name}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {integration.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        integration.status === 'connected'
                          ? 'border-green-300 text-green-700'
                          : 'border-amber-300 text-amber-700'
                      }
                    >
                      {integration.status === 'connected' ? 'Active' : 'Inactive'}
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
                {getAppUrl()}
              </code>
            </div>
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Vercel Region</span>
              <code className="text-sm text-slate-900">
                {process.env.VERCEL_REGION || 'N/A'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
