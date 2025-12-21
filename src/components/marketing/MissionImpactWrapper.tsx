import { createClient } from "@/lib/supabase/server"
import { getContents } from "@/lib/content"
import { MissionImpactSection, type Stat } from "./MissionImpact"

const DEFAULT_CONTENT = {
  "home.mission.title": "More Than a Kit",
  "home.mission.subtitle": "We're building the next generation of Hawaii's engineers.",
  "home.mission.story1": "StarterSpark started as a classroom project: students teaching students how to build robots with whatever parts we could find. We saw how hands-on learning sparked curiosity in ways textbooks never could.",
  "home.mission.story2": "Now we're taking that experience and packaging it for anyone to access. Each kit represents hundreds of hours of curriculum development, testing with real students, and refinement based on their feedback.",
  "home.mission.commitment.title": "Our Commitment",
  "home.mission.commitment.text": "70% of every dollar goes directly to local STEM charities and school robotics programs. 30% funds new kit development and operations.",
  "home.mission.commitment.subtext": "Your purchase directly impacts Hawaii's next generation of engineers.",
}

const FALLBACK_STATS: Stat[] = [
  { key: "kits_deployed", value: 0, label: "Kits Deployed", suffix: "" },
  { key: "schools_supported", value: 1, label: "Schools Supported", suffix: "" },
  { key: "workshops_hosted", value: 0, label: "Workshops Hosted", suffix: "" },
]

/**
 * Server component that fetches site stats and content, then renders MissionImpact
 * Uses the get_site_stats() function for auto-calculated values
 */
export async function MissionImpact() {
  const supabase = await createClient()

  // Fetch content and stats in parallel
  const [content, statsResult] = await Promise.all([
    getContents(Object.keys(DEFAULT_CONTENT), DEFAULT_CONTENT),
    supabase.rpc("get_site_stats"),
  ])

  const { data: stats, error } = statsResult

  let transformedStats: Stat[] = FALLBACK_STATS

  if (!error && stats && stats.length > 0) {
    transformedStats = stats.map((stat) => ({
      key: stat.key,
      value: stat.value,
      label: stat.label,
      suffix: stat.suffix || "",
    }))
  } else if (error) {
    console.error("Failed to fetch site stats:", error.message)
  }

  return (
    <MissionImpactSection
      stats={transformedStats}
      title={content["home.mission.title"]}
      subtitle={content["home.mission.subtitle"]}
      story1={content["home.mission.story1"]}
      story2={content["home.mission.story2"]}
      commitmentTitle={content["home.mission.commitment.title"]}
      commitmentText={content["home.mission.commitment.text"]}
      commitmentSubtext={content["home.mission.commitment.subtext"]}
    />
  )
}
