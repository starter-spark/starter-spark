import {
  HeroWrapper,
  DifferentiatorsWrapper,
  FeaturedProduct,
  LearningPreviewWrapper,
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
	      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
	      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
	      <HeroWrapper />
	      <DifferentiatorsWrapper />
	      <FeaturedProduct />
      <LearningPreviewWrapper />
      <MissionImpact />
      <EventsPreview />
    </div>
  )
}
