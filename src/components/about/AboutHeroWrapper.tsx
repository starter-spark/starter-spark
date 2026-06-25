import { createPublicClient } from '@/lib/supabase/public'
import { AboutHero } from './AboutHero'

interface AboutHeroContent {
  headline?: string
  description?: string
}

/**
 * Server component that fetches About Hero content from page_content table
 * Falls back to default content if database fetch fails
 */
export async function AboutHeroWrapper() {
  // Default content to use if fetch fails
  const defaultContent = {
    headline: 'Making Robotics Education Accessible to Everyone',
    description: "We make robotics kits for students who are just starting out. Everything is designed to work even if you've never built anything before.",
  }

  // Try to fetch content from database
  let pageContent: { content: string } | null = null
  let error: { message?: string } | null = null
  try {
    const supabase = createPublicClient()
    const { data, error: fetchError } = await supabase
      .from('page_content')
      .select('content')
      .eq('page_key', 'about_hero')
      .maybeSingle()
    pageContent = data
    if (fetchError) error = fetchError
  } catch (err) {
    error =
      err instanceof Error
        ? { message: err.message }
        : { message: 'Unknown error' }
  }

  if (error) {
    console.error('Failed to fetch About Hero content:', error.message)
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
    console.error('Failed to parse About Hero content as JSON')
    return <AboutHero {...defaultContent} />
  }

  return (
    <AboutHero
      headline={parsedContent.headline || defaultContent.headline}
      description={parsedContent.description || defaultContent.description}
    />
  )
}
