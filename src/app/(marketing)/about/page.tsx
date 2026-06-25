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
    "StarterSpark makes robotics education kits designed for students who are just starting out. Built by students in Hawaii.",
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
