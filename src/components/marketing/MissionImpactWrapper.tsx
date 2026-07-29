import { getContents } from '@/lib/content'
import { getImpactStats } from '@/cms/impact-stats'
import { MissionImpactSection, type Stat } from './MissionImpact'

const DEFAULT_CONTENT = {
  'home.mission.title': 'More Than a Kit',
  'home.mission.subtitle':
    'We built this because we wanted it to exist. Everything we make is designed for students who are just starting out.',
  'home.mission.story1':
    'StarterSpark started as a little project to help our old local elementary school FLL team. We realized there was nothing good for beginners, so we started making it ourselves. A lot of testing, a lot of broken parts, and eventually something that actually works.',
  'home.mission.story2':
    'Every kit we ship has been tested by real students. Not just us. We bring the kits to schools and run workshops to figure out what breaks and what works. The stuff that makes it into the kit is what actually survived that process.',
  'home.mission.commitment.title': 'Open Source',
  'home.mission.commitment.text':
    'Hardware schematics, 3D print files, and curriculum are all open source. Everything is on GitHub. You do not need to buy the kit to use what we built.',
  'home.mission.commitment.subtext':
    'If you want to build it yourself, go for it.',
}

/**
 * Server component that renders the mission section with CMS-driven impact
 * stats (impact_stat collection; auto-sourced values resolved server-side).
 */
export async function MissionImpact() {
  const content = await getContents(
    Object.keys(DEFAULT_CONTENT),
    DEFAULT_CONTENT,
  )
  const commitmentText = content['home.mission.commitment.text']

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
      title={content['home.mission.title']}
      subtitle={content['home.mission.subtitle']}
      story1={content['home.mission.story1']}
      story2={content['home.mission.story2']}
      commitmentTitle={content['home.mission.commitment.title']}
      commitmentText={commitmentText}
      commitmentSubtext={content['home.mission.commitment.subtext']}
    />
  )
}
