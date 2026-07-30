import { getSingleton } from '@/cms/content'
import { DifferentiatorsSection } from './Differentiators'

export async function DifferentiatorsWrapper() {
  const copy = await getSingleton('home_differentiators')

  return (
    <DifferentiatorsSection
      title={copy.title}
      description={copy.description}
      card1Title={copy.card1Title}
      card1Description={copy.card1Description}
      card2Title={copy.card2Title}
      card2Description={copy.card2Description}
      card3Title={copy.card3Title}
      card3Description={copy.card3Description}
      card4Title={copy.card4Title}
      card4Description={copy.card4Description}
    />
  )
}
