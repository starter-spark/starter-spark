import {
  AboutHero,
  AboutStory,
  AboutTeam,
  AboutGalleryWrapper,
} from "@/components/about"
import { Suspense } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about StarterSpark's mission to make robotics education accessible to every student in Hawaii. 70% of every purchase supports local STEM programs.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <AboutHero />
      <AboutStory />
      <AboutTeam />
      <Suspense fallback={<div className="py-24 px-6 lg:px-20 bg-white"><div className="max-w-7xl mx-auto animate-pulse bg-slate-100 rounded h-96" /></div>}>
        <AboutGalleryWrapper />
      </Suspense>
    </div>
  )
}
