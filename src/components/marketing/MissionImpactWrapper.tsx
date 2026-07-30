import { getSingleton } from '@/cms/content'
import { getImpactStats } from '@/cms/impact-stats'
import { MissionImpactSection, type Stat } from './MissionImpact'

/**
 * Server component that renders the mission section with CMS-driven copy and
 * impact stats (impact_stat collection; auto-sourced values resolved
 * server-side).
 */
export async function MissionImpact() {
  const copy = await getSingleton('home_mission')

  // Stats come from the CMS impact_stat collection: whatever entries an
  // admin has published render here, in their order — no hardcoded keys.
  let transformedStats: Stat[] = []
  try {
    const stats = await getImpactStats()
    transformedStats = stats.map((stat) => ({
      key: stat.key,
      value: Number(stat.value) || 0,
      label: stat.label,
      suffix: stat.suffix,
    }))
  } catch (error) {
    console.error('Failed to fetch impact stats:', error)
  }

  return (
    <MissionImpactSection
      stats={transformedStats}
      title={copy.title}
      subtitle={copy.subtitle}
      story1={copy.story1}
      story2={copy.story2}
      commitmentTitle={copy.commitmentTitle}
      commitmentText={copy.commitmentText}
      commitmentSubtext={copy.commitmentSubtext}
    />
  )
}
