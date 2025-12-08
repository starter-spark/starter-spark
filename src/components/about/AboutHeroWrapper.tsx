import { createClient } from "@/lib/supabase/server"
import { AboutHero } from "./AboutHero"

interface AboutHeroContent {
  headline?: string
  description?: string
}

/**
 * Server component that fetches About Hero content from page_content table
 * Falls back to default content if database fetch fails
 */
export async function AboutHeroWrapper() {
  const supabase = await createClient()

  // Default content to use if fetch fails
  const defaultContent = {
    headline: "Making Robotics Education Accessible to Everyone",
    description:
      "We believe every student deserves the chance to build, code, and create—regardless of their background or resources. That's why we donate 70% of every dollar to local STEM programs.",
  }

  // Try to fetch content from database
  const { data: pageContent, error } = await supabase
    .from("page_content")
    .select("content")
    .eq("page_key", "about_hero")
    .maybeSingle()

  if (error) {
    console.error("Failed to fetch About Hero content:", error.message)
    return <AboutHero {...defaultContent} />
  }

  if (!pageContent?.content) {
    return <AboutHero {...defaultContent} />
  }

  // Parse JSON content
  let parsedContent: AboutHeroContent = {}
  try {
    parsedContent = JSON.parse(pageContent.content) as AboutHeroContent
  } catch {
    console.error("Failed to parse About Hero content as JSON")
    return <AboutHero {...defaultContent} />
  }

  return (
    <AboutHero
      headline={parsedContent.headline || defaultContent.headline}
      description={parsedContent.description || defaultContent.description}
    />
  )
}
