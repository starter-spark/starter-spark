import { getContents, getContent } from '@/lib/content'
import { getImpactStats } from '@/cms/impact-stats'
import { MissionImpactSection, type Stat } from './MissionImpact'

const DEFAULT_CONTENT = {
  'home.mission.title': 'More Than a Kit',
  'home.mission.subtitle':
    "We're building the next generation of Hawaii's engineers.",
  'home.mission.story1':
    'StarterSpark started as a classroom project: students teaching students how to build robots with whatever parts we could find. We saw how hands-on learning sparked curiosity in ways textbooks never could.',
  'home.mission.story2':
    "Now we're taking that experience and packaging it for anyone to access. Each kit represents hundreds of hours of curriculum development, testing with real students, and refinement based on their feedback.",
  'home.mission.commitment.title': 'Our Commitment',
  'home.mission.commitment.text':
    '{charityPercentage} of every dollar goes directly to local STEM charities and school robotics programs. The rest funds new kit development and operations.',
  'home.mission.commitment.subtext':
    "Your purchase directly impacts Hawaii's next generation of engineers.",
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
  const charityPercentage = await getContent('global.charity.percentage', '67%')

  // Interpolate charity percentage into commitment text
  const commitmentText = content['home.mission.commitment.text'].replace(
    '{charityPercentage}',
    charityPercentage,
  )

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
