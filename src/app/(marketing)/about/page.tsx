import {
  AboutHeroWrapper,
  AboutStoryWrapper,
  AboutTeamWrapper,
  AboutGalleryWrapper,
} from '@/components/about'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import {
  AboutHeroSkeleton,
  AboutStorySkeleton,
  AboutTeamSkeleton,
  AboutGallerySkeleton,
} from './skeletons'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    "Learn about StarterSpark's mission to make robotics education accessible to every student in Hawaii. 67% of every purchase supports local STEM programs.",
}

export default function AboutPage() {
  return (
    <div>
      <Suspense fallback={<AboutHeroSkeleton />}>
        <AboutHeroWrapper />
      </Suspense>
      <Suspense fallback={<AboutStorySkeleton />}>
        <AboutStoryWrapper />
      </Suspense>
      <Suspense fallback={<AboutTeamSkeleton />}>
        <AboutTeamWrapper />
      </Suspense>
      <Suspense fallback={<AboutGallerySkeleton />}>
        <AboutGalleryWrapper />
      </Suspense>
    </div>
  )
}
