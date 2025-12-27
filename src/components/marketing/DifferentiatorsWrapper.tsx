import { getContents } from '@/lib/content'
import { DifferentiatorsSection } from './Differentiators'

const DEFAULT_CONTENT = {
  'home.differentiators.title': 'Why StarterSpark?',
  'home.differentiators.description':
    'We built the kit we wished existed when we started learning robotics.',
  'home.differentiators.card1.title': 'Complete Package',
  'home.differentiators.card1.description':
    'Everything you need in one box: pre-cut parts, electronics, fasteners, and our step-by-step digital curriculum. No hunting for components or compatibility issues.',
  'home.differentiators.card2.title': 'Interactive Curriculum',
  'home.differentiators.card2.description':
    'Learn by doing with our web-based platform featuring interactive wiring diagrams, code editors with real-time feedback, and progress tracking across lessons.',
  'home.differentiators.card3.title': 'Support for Schools and Clubs',
  'home.differentiators.card3.description':
    "We offer bulk discounts and classroom-ready kits to help educators bring hands-on STEM learning to their students. Whether you're running a robotics club, teaching a STEM unit, or hosting a workshop, StarterSpark provides guidance, resources, and affordable tools to make it happen.",
  'home.differentiators.card4.title': 'Hawaii Roots',
  'home.differentiators.card4.description':
    'Founded by students from Hawaii who wanted to give back. Every kit sold directly supports local STEM education programs and school robotics teams across the islands.',
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
