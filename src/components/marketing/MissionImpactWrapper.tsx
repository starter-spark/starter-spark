import { createClient } from '@/lib/supabase/server'
import { getContents } from '@/lib/content'
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
  'home.mission.commitment.subtext': 'If you want to build it yourself, go for it.',
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
  const commitmentText = content['home.mission.commitment.text']

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
