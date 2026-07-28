import { getContents } from '@/lib/content'
import { DifferentiatorsSection } from './Differentiators'

const DEFAULT_CONTENT = {
  'home.differentiators.title': 'Why StarterSpark?',
  'home.differentiators.description':
    'We built the kit we wished existed when we were kids.',
  'home.differentiators.card1.title': 'Complete Package',
  'home.differentiators.card1.description':
    'Everything you need in one box: pre-cut parts, electronics, fasteners, and our step-by-step digital curriculum. No hunting for components or compatibility issues.',
  'home.differentiators.card2.title': 'Interactive Curriculum',
  'home.differentiators.card2.description':
    'Learn by doing with our web-based platform featuring interactive wiring diagrams, code editors with real-time feedback, and progress tracking across lessons.',
  'home.differentiators.card3.title': 'Support for Schools and Clubs',
  'home.differentiators.card3.description':
    "We offer bulk discounts for schools and clubs, and the kits come classroom-ready so you don't have to figure out sourcing. If you're trying to set up a robotics program and don't know where to start, just email us.",
  'home.differentiators.card4.title': 'Hawaii Roots',
  'home.differentiators.card4.description':
    "We're students from Hawaii who couldn't find a good beginner robotics kit, so we built one. Everything was tested by real students before we shipped anything.",
}

export async function DifferentiatorsWrapper() {
  const content = await getContents(
    Object.keys(DEFAULT_CONTENT),
    DEFAULT_CONTENT,
  )

  return (
    <DifferentiatorsSection
      title={content['home.differentiators.title']}
      description={content['home.differentiators.description']}
      card1Title={content['home.differentiators.card1.title']}
      card1Description={content['home.differentiators.card1.description']}
      card2Title={content['home.differentiators.card2.title']}
      card2Description={content['home.differentiators.card2.description']}
      card3Title={content['home.differentiators.card3.title']}
      card3Description={content['home.differentiators.card3.description']}
      card4Title={content['home.differentiators.card4.title']}
      card4Description={content['home.differentiators.card4.description']}
    />
  )
}
