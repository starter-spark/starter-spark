import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SiteStatsManager } from './SiteStatsManager'

export const metadata = {
  title: 'Homepage Stats | Admin',
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

export default async function StatsPage() {
  const siteStats = await getSiteStats()

  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div>
        <Link
          href="/admin/content"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-cyan-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Content
        </Link>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          Homepage Stats
        </h1>
        <p className="text-slate-600">
          Manage the impact statistics shown on your homepage and other pages
        </p>
      </div>

      {/* Stats Manager */}
      <SiteStatsManager stats={siteStats} />
    </div>
  )
}
