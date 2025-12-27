import { createClient } from '@/lib/supabase/server'
import { getContents, getContent } from '@/lib/content'
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

interface MissionImpactProps {
  /** Page key to filter stats visibility (e.g., 'home', 'about', 'workshop') */
  page?: string
}

/**
 * Server component that fetches site stats and content, then renders MissionImpact
 * Uses the get_site_stats() function for auto-calculated values
 */
export async function MissionImpact({ page = 'home' }: MissionImpactProps) {
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

  let transformedStats: Stat[] = []
  try {
    const supabase = await createClient()
    const { data: stats, error } = await supabase.rpc('get_site_stats', {
      page_filter: page,
    })
    if (!error && stats && stats.length > 0) {
      transformedStats = stats.map((stat) => ({
        key: stat.key,
        value: stat.value,
        label: stat.label,
        suffix: stat.suffix || '',
      }))
    } else if (error) {
      console.error('Failed to fetch site stats:', error.message)
    }
  } catch (error) {
    console.error('Failed to fetch site stats:', error)
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
