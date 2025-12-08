import { createClient } from "@/lib/supabase/server"
import { AboutStory } from "./AboutStory"

/**
 * Server component that fetches About Story content from page_content table
 * Falls back to placeholder content if database fetch fails
 */
export async function AboutStoryWrapper() {
  const supabase = await createClient()

  // Default content shown when no content is available
  const defaultContent = `Our founding story will be shared here. This section will describe how StarterSpark began and our journey to making robotics education accessible.

This section will discuss the challenges we identified in robotics education and what motivated us to create a solution.

This section will explain our approach to building an accessible, educational robotics kit with comprehensive learning materials.

This section will highlight our commitment to giving back and supporting Hawaii STEM education through our 70/30 model.`

  // Try to fetch content from database
  const { data: pageContent, error } = await supabase
    .from("page_content")
    .select("content")
    .eq("page_key", "about_story")
    .maybeSingle()

  if (error) {
    console.error("Failed to fetch About Story content:", error.message)
    return <AboutStory content={defaultContent} isPlaceholder />
  }

  if (!pageContent?.content) {
    return <AboutStory content={defaultContent} isPlaceholder />
  }

  return <AboutStory content={pageContent.content} />
}
