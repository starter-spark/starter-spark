import { getSingleton } from '@/cms/content'
import { LearningPreviewSection } from './LearningPreview'

export async function LearningPreviewWrapper() {
  const copy = await getSingleton('home_learning')

  return (
    <LearningPreviewSection
      title={copy.title}
      description={copy.description}
      block1Title={copy.block1Title}
      block1Description1={copy.block1Description1}
      block1Description2={copy.block1Description2}
      block1Cta={copy.block1Cta}
      block2Title={copy.block2Title}
      block2Description1={copy.block2Description1}
      block2Description2={copy.block2Description2}
      block2Cta={copy.block2Cta}
    />
  )
}
