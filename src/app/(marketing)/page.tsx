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
} from '@/lib/structured-data'
import {
  HeroSkeleton,
  DifferentiatorsSkeleton,
  FeaturedProductSkeleton,
  LearningPreviewSkeleton,
  MissionImpactSkeleton,
  EventsPreviewSkeleton,
} from './loading'

export default function Home() {
  const organizationSchema = getOrganizationSchema()
  const websiteSchema = getWebsiteSchema()

  return (
    <>
      {/* JSON-LD via Next.js script - rendered only on server, no hydration issues */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <div>
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
    </>
  )
}
