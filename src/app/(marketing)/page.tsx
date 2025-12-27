import { Suspense } from 'react'
import {
  HeroWrapper,
  DifferentiatorsWrapper,
  FeaturedProduct,
  LearningPreviewWrapper,
  MissionImpact,
  EventsPreview,
} from '@/components/marketing'
import {
  getOrganizationSchema,
  getWebsiteSchema,
  jsonLdScript,
} from '@/lib/structured-data'
import { headers } from 'next/headers'
import {
  HeroSkeleton,
  DifferentiatorsSkeleton,
  FeaturedProductSkeleton,
  LearningPreviewSkeleton,
  MissionImpactSkeleton,
  EventsPreviewSkeleton,
} from './loading'

export default async function Home() {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const organizationSchema = getOrganizationSchema()
  const websiteSchema = getWebsiteSchema()

  return (
    <div>
      {/* JSON-LD Structured Data for SEO */}
      <script nonce={nonce} type="application/ld+json">
        {jsonLdScript(organizationSchema)}
      </script>
      <script nonce={nonce} type="application/ld+json">
        {jsonLdScript(websiteSchema)}
      </script>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroWrapper />
      </Suspense>
      <Suspense fallback={<DifferentiatorsSkeleton />}>
        <DifferentiatorsWrapper />
      </Suspense>
      <Suspense fallback={<FeaturedProductSkeleton />}>
        <FeaturedProduct />
      </Suspense>
      <Suspense fallback={<LearningPreviewSkeleton />}>
        <LearningPreviewWrapper />
      </Suspense>
      <Suspense fallback={<MissionImpactSkeleton />}>
        <MissionImpact />
      </Suspense>
      <Suspense fallback={<EventsPreviewSkeleton />}>
        <EventsPreview />
      </Suspense>
    </div>
  )
}
