import { supabaseAdmin } from '@/lib/supabase/admin'
import { createPublicClient } from '@/lib/supabase/public'
import { getCollection } from './content'

export interface ResolvedImpactStat {
  key: string
  label: string
  value: string
  suffix: string
}

/**
 * The impact_stat collection with auto-sourced values resolved. Auto counts
 * mirror the legacy get_site_stats() semantics: claimed licenses and public
 * events. Hidden entries are filtered here so renderers can trust the list.
 */
export async function getImpactStats(): Promise<ResolvedImpactStat[]> {
  const entries = await getCollection('impact_stat')
  const visible = entries.filter((e) => e.data.visible)
  if (visible.length === 0) return []

  const needsLicenses = visible.some(
    (e) => e.data.autoSource === 'licenses_count',
  )
  const needsEvents = visible.some((e) => e.data.autoSource === 'events_count')

  const [licensesCount, eventsCount] = await Promise.all([
    needsLicenses
      ? supabaseAdmin
          .from('licenses')
          .select('id', { count: 'exact', head: true })
          .not('owner_id', 'is', null)
          .then(({ count, error }) => {
            if (error) console.error('impact stats licenses count:', error)
            return count ?? 0
          })
      : Promise.resolve(0),
    needsEvents
      ? // Public events are anon-readable, so no service role needed here
        createPublicClient()
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('is_public', true)
          .then(({ count, error }) => {
            if (error) console.error('impact stats events count:', error)
            return count ?? 0
          })
      : Promise.resolve(0),
  ])

  return visible.map((e) => ({
    key: e.key,
    label: e.data.label,
    value:
      e.data.autoSource === 'licenses_count'
        ? String(licensesCount)
        : e.data.autoSource === 'events_count'
          ? String(eventsCount)
          : e.data.value,
    suffix: e.data.suffix,
  }))
}
