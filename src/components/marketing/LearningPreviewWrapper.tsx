import { getContents } from '@/lib/content'
import { LearningPreviewSection } from './LearningPreview'

const DEFAULT_CONTENT = {
  'home.learning.title': 'Learn by Doing',
  'home.learning.description':
    'Our interactive platform guides you from unboxing to your first programmed movement.',
  'home.learning.block1.title': 'Step-by-Step Digital Guides',
  'home.learning.block1.description1':
    'Each lesson builds on the last, taking you from basic assembly through advanced programming. Our interactive diagrams show exactly where each wire connects, and you can hover over components to learn what they do.',
  'home.learning.block1.description2':
    'The built-in code editor lets you write, test, and upload your programs directly from the browser. Real-time syntax highlighting and error checking help you learn proper coding practices from day one.',
  'home.learning.block1.cta': 'Start Learning',
  'home.learning.block2.title': 'Expert Support When You Need It',
  'home.learning.block2.description1':
    'Stuck on a step? Our community forum, The Lab, connects you with fellow builders and our support team. Most questions get answered within hours, not days.',
  'home.learning.block2.description2':
    'Staff members actively monitor discussions and provide verified solutions. Every question helps build our knowledge base for future builders.',
  'home.learning.block2.cta': 'Visit The Lab',
}

export async function LearningPreviewWrapper() {
  const content = await getContents(
    Object.keys(DEFAULT_CONTENT),
    DEFAULT_CONTENT,
  )

  return (
    <LearningPreviewSection
      title={content['home.learning.title']}
      description={content['home.learning.description']}
      block1Title={content['home.learning.block1.title']}
      block1Description1={content['home.learning.block1.description1']}
      block1Description2={content['home.learning.block1.description2']}
      block1Cta={content['home.learning.block1.cta']}
      block2Title={content['home.learning.block2.title']}
      block2Description1={content['home.learning.block2.description1']}
      block2Description2={content['home.learning.block2.description2']}
      block2Cta={content['home.learning.block2.cta']}
    />
  )
}
