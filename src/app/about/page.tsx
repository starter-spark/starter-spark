import {
  AboutHero,
  AboutStory,
  AboutTeam,
  AboutGallery,
} from "@/components/about"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about StarterSpark's mission to make robotics education accessible to every student in Hawaii. 70% of every purchase supports local STEM programs.",
}

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <AboutHero />
      <AboutStory />
      <AboutTeam />
      <AboutGallery />
    </main>
  )
}
