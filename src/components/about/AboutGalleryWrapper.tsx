import { createClient } from "@/lib/supabase/server"
import { AboutGallery, AboutStat } from "./AboutGallery"

/**
 * Server component that fetches site stats and renders AboutGallery
 * Falls back to default stats if database fetch fails
 */
export async function AboutGalleryWrapper() {
  const supabase = await createClient()

  // Try to fetch stats from database
  const { data: dbStats, error } = await supabase.rpc("get_site_stats")

  // Default stats to use if fetch fails or returns empty
  const defaultStats: AboutStat[] = [
    { value: "0", label: "Workshops Hosted" },
    { value: "0", label: "Students Reached" },
    { value: "1", label: "Partner Schools" },
    { value: "70%", label: "Donated to STEM" },
  ]

  if (error || !dbStats || dbStats.length === 0) {
    // Log error but don't break the page
    if (error) {
      console.error("Failed to fetch site stats for About page:", error.message)
    }
    return <AboutGallery stats={defaultStats} />
  }

  // Map database stats to AboutStat format
  // The RPC returns: key, value, label, suffix
  const statsMap: Record<string, AboutStat> = {}

  for (const stat of dbStats) {
    const displayValue = stat.suffix
      ? `${stat.value}${stat.suffix}`
      : String(stat.value)

    // Map database keys to expected labels
    if (stat.key === "workshops_hosted") {
      statsMap["Workshops Hosted"] = { value: displayValue, label: "Workshops Hosted" }
    } else if (stat.key === "students_reached") {
      statsMap["Students Reached"] = { value: displayValue, label: "Students Reached" }
    } else if (stat.key === "schools_supported" || stat.key === "partner_schools") {
      statsMap["Partner Schools"] = { value: displayValue, label: "Partner Schools" }
    } else if (stat.key === "kits_deployed") {
      // Add kits deployed as an extra stat if needed
      statsMap["Kits Deployed"] = { value: displayValue, label: "Kits Deployed" }
    }
  }

  // Build final stats array in desired order
  const stats: AboutStat[] = [
    statsMap["Workshops Hosted"] || { value: "0", label: "Workshops Hosted" },
    statsMap["Students Reached"] || { value: "0", label: "Students Reached" },
    statsMap["Partner Schools"] || { value: "1", label: "Partner Schools" },
    { value: "70%", label: "Donated to STEM" }, // Always hardcoded
  ]

  return <AboutGallery stats={stats} />
}
