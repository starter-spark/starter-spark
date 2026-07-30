import { getCollection, getSingleton } from '@/cms/content'
import { DifferentiatorsSection } from './Differentiators'

export async function DifferentiatorsWrapper() {
  const [copy, cards] = await Promise.all([
    getSingleton('home_differentiators'),
    getCollection('differentiator_card'),
  ])

  return (
    <DifferentiatorsSection
      title={copy.title}
      description={copy.description}
      cards={cards
        .filter((c) => c.data.visible)
        .map((c) => ({
          key: c.key,
          title: c.data.title,
          description: c.data.description,
          icon: c.data.icon,
        }))}
    />
  )
}
