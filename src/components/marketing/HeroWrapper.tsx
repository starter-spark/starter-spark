import { getSingleton } from '@/cms/content'
import { HeroSection } from './Hero'

export async function HeroWrapper() {
  const copy = await getSingleton('home_hero')

  return (
    <HeroSection
      taglineTop={copy.taglineTop}
      headline={copy.headline}
      subheadline={copy.subheadline}
      taglineBottom={copy.taglineBottom}
      ctaPrimary={copy.ctaPrimary}
      ctaSecondary={copy.ctaSecondary}
    />
  )
}
