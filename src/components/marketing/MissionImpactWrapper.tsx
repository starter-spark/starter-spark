import { createClient } from "@/lib/supabase/server"
import { MissionImpactSection, Stat } from "./MissionImpact"

/**
 * Server component that fetches site stats and renders MissionImpact
 * Uses the get_site_stats() function for auto-calculated values
 */
export async function MissionImpact() {
  const supabase = await createClient()

  // Call the database function that handles auto-calculation
  const { data: stats, error } = await supabase.rpc("get_site_stats")

  if (error) {
    console.error("Failed to fetch site stats:", error.message)
    // Fallback to default stats if fetch fails
    const fallbackStats: Stat[] = [
      { key: "kits_deployed", value: 0, label: "Kits Deployed", suffix: "" },
      { key: "schools_supported", value: 1, label: "Schools Supported", suffix: "" },
      { key: "workshops_hosted", value: 0, label: "Workshops Hosted", suffix: "" },
    ]
    return <MissionImpactSection stats={fallbackStats} />
  }

  // Transform to proper format (ensure suffix is never null)
  const transformedStats: Stat[] = (stats || []).map((stat) => ({
    key: stat.key,
    value: stat.value,
    label: stat.label,
    suffix: stat.suffix || "",
  }))

  // If no stats in DB, use fallback
  if (transformedStats.length === 0) {
    const fallbackStats: Stat[] = [
      { key: "kits_deployed", value: 0, label: "Kits Deployed", suffix: "" },
      { key: "schools_supported", value: 1, label: "Schools Supported", suffix: "" },
      { key: "workshops_hosted", value: 0, label: "Workshops Hosted", suffix: "" },
    ]
    return <MissionImpactSection stats={fallbackStats} />
  }

  return <MissionImpactSection stats={transformedStats} />
}
