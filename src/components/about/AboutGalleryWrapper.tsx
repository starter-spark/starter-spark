import { createPublicClient } from '@/lib/supabase/public'
import { getContent } from '@/lib/content'
import { AboutGallery, type AboutStat } from './AboutGallery'

/**
 * Server component that fetches site stats and renders AboutGallery
 * Falls back to default stats if database fetch fails
 */
export async function AboutGalleryWrapper() {
  // Fetch charity percentage and stats in parallel
  const charityPercentage = await getContent('global.charity.percentage', '67%')

  // Default stats to use if fetch fails or returns empty
  const defaultStats: AboutStat[] = [
    { value: '0', label: 'Workshops Hosted' },
    { value: '0', label: 'Students Reached' },
    { value: '1', label: 'Partner Schools' },
    { value: charityPercentage, label: 'Donated to STEM' },
  ]

  let dbStats:
    | { key: string; value: number; label: string; suffix: string | null }[]
    | null = null
  let error: { message?: string } | null = null
  try {
    const supabase = createPublicClient()
    const { data, error: rpcError } = await supabase.rpc('get_site_stats')
    dbStats = data
    if (rpcError) error = rpcError
  } catch (err) {
    error =
      err instanceof Error
        ? { message: err.message }
        : { message: 'Unknown error' }
  }

  if (error || !dbStats || dbStats.length === 0) {
    // Log error but don't break the page
    if (error) {
      console.error('Failed to fetch site stats for About page:', error.message)
    }
    return <AboutGallery stats={defaultStats} />
  }

  // Map database stats to AboutStat format
  // The RPC returns: key, value, label, suffix
  const statsMap: Record<string, AboutStat> = {}

  for (const stat of dbStats) {
    const displayValue = stat.suffix
      ? `${stat.value}${stat.suffix}`
      : String(stat.value)

    // Map database keys to expected labels
    switch (stat.key) {
      case 'workshops_hosted': {
        statsMap['Workshops Hosted'] = {
          value: displayValue,
          label: 'Workshops Hosted',
        }

        break
      }
      case 'students_reached': {
        statsMap['Students Reached'] = {
          value: displayValue,
          label: 'Students Reached',
        }

        break
      }
      case 'schools_supported':
      case 'partner_schools': {
        statsMap['Partner Schools'] = {
          value: displayValue,
          label: 'Partner Schools',
        }

        break
      }
      case 'kits_deployed': {
        // Add kits deployed as an extra stat if needed
        statsMap['Kits Deployed'] = {
          value: displayValue,
          label: 'Kits Deployed',
        }

        break
      }
      // No default
    }
  }

  // Build final stats array in desired order
  const stats: AboutStat[] = [
    statsMap['Workshops Hosted'] || { value: '0', label: 'Workshops Hosted' },
    statsMap['Students Reached'] || { value: '0', label: 'Students Reached' },
    statsMap['Partner Schools'] || { value: '1', label: 'Partner Schools' },
    { value: charityPercentage, label: 'Donated to STEM' }, // From global.charity.percentage
  ]

  return <AboutGallery stats={stats} />
}
