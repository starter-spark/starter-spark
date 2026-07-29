import { getImpactStats } from '@/cms/impact-stats'
import { AboutGallery, type AboutStat } from './AboutGallery'

/**
 * Server component that renders the About gallery with CMS-driven stats.
 * Renders exactly what admins publish in the impact_stat collection — every
 * visible entry, with its own label — no hardcoded key remapping.
 */
export async function AboutGalleryWrapper() {
  let stats: AboutStat[] = []
  try {
    const impactStats = await getImpactStats()
    stats = impactStats.map((stat) => ({
      value: stat.suffix ? `${stat.value}${stat.suffix}` : stat.value,
      label: stat.label,
    }))
  } catch (error) {
    console.error('Failed to fetch impact stats for About page:', error)
  }

  return <AboutGallery stats={stats} />
}
