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
  ChevronLeft,
  Database,
  Table2,
  Users,
  Package,
  KeyRound,
  Calendar,
  MessageSquare,
  FileText,
  BarChart3,
  Megaphone,
  ExternalLink,
  GraduationCap,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { SupabaseUsage } from './SupabaseUsage'

export const metadata = {
  title: 'Database Analytics | Admin',
}

interface TableStats {
  name: string
  icon: LucideIcon
  count: number
  description: string
}

async function getDatabaseStats() {
  const supabase = await createClient()

  // Get counts for all major tables (only tables that exist in the schema)
  const [
    products,
    licenses,
    profiles,
    events,
    posts,
    comments,
    siteStats,
    pageContent,
    docPages,
    lessonProgress,
    siteBanners,
    courses,
    lessons,
    achievements,
    contactSubmissions,
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('licenses').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
    supabase.from('site_stats').select('id', { count: 'exact', head: true }),
    supabase.from('page_content').select('id', { count: 'exact', head: true }),
    supabase.from('doc_pages').select('id', { count: 'exact', head: true }),
    supabase.from('lesson_progress').select('id', { count: 'exact', head: true }),
    supabase.from('site_banners').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('lessons').select('id', { count: 'exact', head: true }),
    supabase.from('achievements').select('id', { count: 'exact', head: true }),
    supabase.from('contact_submissions').select('id', { count: 'exact', head: true }),
  ])

  return {
    products: products.count || 0,
    licenses: licenses.count || 0,
    profiles: profiles.count || 0,
    events: events.count || 0,
    posts: posts.count || 0,
    comments: comments.count || 0,
    siteStats: siteStats.count || 0,
    pageContent: pageContent.count || 0,
    docPages: docPages.count || 0,
    lessonProgress: lessonProgress.count || 0,
    siteBanners: siteBanners.count || 0,
    courses: courses.count || 0,
    lessons: lessons.count || 0,
    achievements: achievements.count || 0,
    contactSubmissions: contactSubmissions.count || 0,
  }
}

async function getRecentActivity() {
  const supabase = await createClient()

  // Get recent user signups
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent licenses
  const { data: recentLicenses } = await supabase
    .from('licenses')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    recentUsers: recentUsers || [],
    recentLicenses: recentLicenses || [],
  }
}

export default async function DatabaseAnalyticsPage() {
  const [stats, activity] = await Promise.all([
    getDatabaseStats(),
    getRecentActivity(),
  ])

  const tableStats: TableStats[] = [
    { name: 'Users', icon: Users, count: stats.profiles, description: 'Registered user profiles' },
    { name: 'Products', icon: Package, count: stats.products, description: 'Shop products' },
    { name: 'Licenses', icon: KeyRound, count: stats.licenses, description: 'Product licenses' },
    { name: 'Events', icon: Calendar, count: stats.events, description: 'Scheduled events' },
    { name: 'Posts', icon: MessageSquare, count: stats.posts, description: 'Community posts' },
    { name: 'Comments', icon: MessageSquare, count: stats.comments, description: 'Post comments' },
    { name: 'Courses', icon: GraduationCap, count: stats.courses, description: 'Learning courses' },
    { name: 'Lessons', icon: GraduationCap, count: stats.lessons, description: 'Course lessons' },
    { name: 'Lesson Progress', icon: BarChart3, count: stats.lessonProgress, description: 'Learning progress records' },
    { name: 'Doc Pages', icon: FileText, count: stats.docPages, description: 'Documentation pages' },
    { name: 'Page Content', icon: FileText, count: stats.pageContent, description: 'CMS pages' },
    { name: 'Site Banners', icon: Megaphone, count: stats.siteBanners, description: 'Site announcements' },
    { name: 'Achievements', icon: Trophy, count: stats.achievements, description: 'User achievements' },
    { name: 'Contact Submissions', icon: MessageSquare, count: stats.contactSubmissions, description: 'Contact form entries' },
    { name: 'Site Stats', icon: BarChart3, count: stats.siteStats, description: 'Homepage statistics' },
  ]

  const totalRows = Object.values(stats).reduce((sum, count) => sum + count, 0)

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

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
              Database Analytics
            </h1>
            <p className="text-slate-600">
              Supabase database metrics and table statistics
            </p>
          </div>
          {projectRef && (
            <a
              href={`https://supabase.com/dashboard/project/${projectRef}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Database className="h-4 w-4" />
              Open Supabase Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <SupabaseUsage />

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
                <Database className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-slate-900">
                  {tableStats.length}
                </p>
                <p className="text-xs text-slate-600">Active Tables</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Table2 className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-slate-900">
                  {totalRows.toLocaleString()}
                </p>
                <p className="text-xs text-slate-600">Total Rows</p>
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
                  {activity.recentUsers.length}
                </p>
                <p className="text-xs text-slate-600">Recent Signups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <KeyRound className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-slate-900">
                  {activity.recentLicenses.length}
                </p>
                <p className="text-xs text-slate-600">Recent Licenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table2 className="h-5 w-5" />
            Table Statistics
          </CardTitle>
          <CardDescription>Row counts for each database table</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tableStats.map((table) => {
              const Icon = table.icon
              return (
                <div
                  key={table.name}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100">
                      <Icon className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{table.name}</p>
                      <p className="text-xs text-slate-500">{table.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {table.count.toLocaleString()}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Database Info */}
      <Card>
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
          <CardDescription>Current database configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Provider</span>
              <code className="text-sm text-slate-900">Supabase (PostgreSQL)</code>
            </div>
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Project Reference</span>
              <code className="text-sm text-slate-900">{projectRef || 'N/A'}</code>
            </div>
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">API URL</span>
              <code className="max-w-[300px] truncate text-sm text-slate-900">
                {supabaseUrl || 'Not configured'}
              </code>
            </div>
            <div className="flex justify-between rounded bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Row Level Security</span>
              <Badge variant="outline" className="border-green-300 text-green-700">
                Enabled
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
