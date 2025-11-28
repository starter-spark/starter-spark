import {
  HeroSection,
  DifferentiatorsSection,
  FeaturedProduct,
  LearningPreviewSection,
  MissionImpact,
  EventsPreview,
} from "@/components/marketing"
import { getOrganizationSchema, getWebsiteSchema } from "@/lib/structured-data"

export default function Home() {
  const organizationSchema = getOrganizationSchema()
  const websiteSchema = getWebsiteSchema()

  return (
    <div className="min-h-screen">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <HeroSection />
      <DifferentiatorsSection />
      <FeaturedProduct />
      <LearningPreviewSection />
      <MissionImpact />
      <EventsPreview />
    </div>
  )
}