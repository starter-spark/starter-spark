import { getSingleton } from '@/cms/content'
import { AboutStory } from './AboutStory'

export async function AboutStoryWrapper() {
  const copy = await getSingleton('about_page')

  return <AboutStory content={copy.story} />
}
