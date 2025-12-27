import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  Package,
  KeyRound,
  Users,
  MessageSquare,
  Calendar,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

async function getStats() {
  const supabase = await createClient()

  // Fetch counts in parallel
  const [
    productsResult,
    licensesResult,
    claimedLicensesResult,
    usersResult,
    openQuestionsResult,
    upcomingEventsResult,
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('licenses').select('*', { count: 'exact', head: true }),
    supabase
      .from('licenses')
      .select('*', { count: 'exact', head: true })
      .not('owner_id', 'is', null),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open'),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', new Date().toISOString()),
  ])

  return {
    products: productsResult.count ?? 0,
    totalLicenses: licensesResult.count ?? 0,
    claimedLicenses: claimedLicensesResult.count ?? 0,
    users: usersResult.count ?? 0,
    openQuestions: openQuestionsResult.count ?? 0,
    upcomingEvents: upcomingEventsResult.count ?? 0,
  }
}

async function getRecentActivity() {
  const supabase = await createClient()

  // Get recent unclaimed licenses
  const { data: unclaimedLicenses } = await supabase
    .from('licenses')
    .select('id, code, created_at, customer_email, products(name)')
    .is('owner_id', null)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent open questions
  const { data: recentQuestions } = await supabase
    .from('posts')
    .select(
      'id, title, slug, created_at, status, profiles(id, full_name, email, avatar_url, avatar_seed)',
    )
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    unclaimedLicenses: unclaimedLicenses ?? [],
    recentQuestions: recentQuestions ?? [],
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()
  const activity = await getRecentActivity()

  const statCards = [
    {
      title: 'Products',
      value: stats.products,
      icon: Package,
      href: '/admin/products',
      color: 'text-cyan-700',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Licenses',
      value: `${stats.claimedLicenses}/${stats.totalLicenses}`,
      description: 'claimed',
      icon: KeyRound,
      href: '/admin/licenses',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Users',
      value: stats.users,
      icon: Users,
      href: '/admin/users',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Open Questions',
      value: stats.openQuestions,
      icon: MessageSquare,
      href: '/admin/community',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      href: '/admin/events',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="text-slate-600">
          Welcome to the StarterSpark admin panel.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold text-slate-900">
                  {stat.value}
                </div>
                {stat.description && (
                  <p className="text-xs text-slate-500">{stat.description}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Activity Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Unclaimed Licenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Unclaimed Licenses</CardTitle>
                <CardDescription>
                  Licenses waiting to be claimed
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/licenses?filter=unclaimed">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activity.unclaimedLicenses.length === 0 ? (
              <p className="text-sm text-slate-500">No unclaimed licenses</p>
            ) : (
              <div className="space-y-3">
                {activity.unclaimedLicenses.map((license) => (
                  <div
                    key={license.id}
                    className="flex items-center justify-between rounded border border-slate-200 p-3"
                  >
                    <div>
                      <p className="font-mono text-sm text-slate-900">
                        {license.code.slice(0, 4)}****
                      </p>
                      <p className="text-xs text-slate-500">
                        {(
                          license.products as unknown as { name: string } | null
                        )?.name || 'Unknown product'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {license.customer_email || 'No email'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {license.created_at
                          ? new Date(license.created_at).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Open Questions</CardTitle>
                <CardDescription>
                  Community questions needing attention
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/community?filter=open">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activity.recentQuestions.length === 0 ? (
              <p className="text-sm text-slate-500">No open questions</p>
            ) : (
              <div className="space-y-3">
                {activity.recentQuestions.map((question) => (
                  <Link
                    key={question.id}
                    href={`/community/${question.id}`}
                    className="block rounded border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {question.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          {(() => {
                            const author = question.profiles as unknown as {
                              id: string
                              full_name: string | null
                              email: string | null
                              avatar_url: string | null
                              avatar_seed: string | null
                            } | null
                            return (
                              <>
                                <UserAvatar
                                  user={{
                                    id: author?.id || question.id,
                                    full_name: author?.full_name,
                                    email: author?.email,
                                    avatar_url: author?.avatar_url,
                                    avatar_seed: author?.avatar_seed,
                                  }}
                                  size="sm"
                                />
                                <span>{author?.full_name || 'Unknown'}</span>
                              </>
                            )
                          })()}
                          <span>•</span>
                          <span>
                            {question.created_at
                              ? new Date(
                                  question.created_at,
                                ).toLocaleDateString()
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/admin/products/new">
                <Package className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/licenses/generate">
                <KeyRound className="mr-2 h-4 w-4" />
                Generate Licenses
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/events/new">
                <Calendar className="mr-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/community?filter=open">
                <MessageSquare className="mr-2 h-4 w-4" />
                Review Questions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
