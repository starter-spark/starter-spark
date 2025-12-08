import {
  AboutHeroWrapper,
  AboutStoryWrapper,
  AboutTeamWrapper,
  AboutGalleryWrapper,
} from "@/components/about"
import { Suspense } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about StarterSpark's mission to make robotics education accessible to every student in Hawaii. 70% of every purchase supports local STEM programs.",
}

// Loading skeleton for hero section
function HeroSkeleton() {
  return (
    <section className="pt-32 pb-20 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-4xl mx-auto text-center">
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mx-auto mb-4" />
        <div className="h-12 w-3/4 bg-slate-200 rounded animate-pulse mx-auto mb-4" />
        <div className="h-12 w-1/2 bg-slate-100 rounded animate-pulse mx-auto mb-8" />
        <div className="h-6 w-2/3 bg-slate-100 rounded animate-pulse mx-auto" />
      </div>
    </section>
  )
}

// Loading skeleton for story section
function StorySkeleton() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-2" />
        <div className="w-16 h-1 bg-slate-200 mb-12" />
        <div className="space-y-6">
          <div className="h-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-24 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </section>
  )
}

// Loading skeleton for team section
function TeamSkeleton() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="h-10 w-64 bg-slate-200 rounded animate-pulse mx-auto mb-4" />
          <div className="h-6 w-96 bg-slate-100 rounded animate-pulse mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded p-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mx-auto mb-2" />
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mx-auto mb-3" />
              <div className="h-16 bg-slate-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<HeroSkeleton />}>
        <AboutHeroWrapper />
      </Suspense>
      <Suspense fallback={<StorySkeleton />}>
        <AboutStoryWrapper />
      </Suspense>
      <Suspense fallback={<TeamSkeleton />}>
        <AboutTeamWrapper />
      </Suspense>
      <Suspense fallback={<div className="py-24 px-6 lg:px-20 bg-white"><div className="max-w-7xl mx-auto animate-pulse bg-slate-100 rounded h-96" /></div>}>
        <AboutGalleryWrapper />
      </Suspense>
    </div>
  )
}
