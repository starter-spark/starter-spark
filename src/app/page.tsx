import {
  HeroSection,
  DifferentiatorsSection,
  ProductSpotlightSection,
  LearningPreviewSection,
  MissionImpactSection,
  EventsPreviewSection,
} from "@/components/marketing"

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <DifferentiatorsSection />
      <ProductSpotlightSection />
      <LearningPreviewSection />
      <MissionImpactSection />
      <EventsPreviewSection />
    </main>
  )
}