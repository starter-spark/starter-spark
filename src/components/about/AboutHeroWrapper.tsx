import { getSingleton } from '@/cms/content'
import { AboutHero } from './AboutHero'

export async function AboutHeroWrapper() {
  const copy = await getSingleton('about_page')

  return (
    <AboutHero
      headline={copy.heroHeadline}
      description={copy.heroDescription}
    />
  )
}
