import { createPublicClient } from '@/lib/supabase/public'
import { getContent } from '@/lib/content'
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
  // Fetch charity percentage for dynamic content
  const charityPercentage = await getContent('global.charity.percentage', '67%')

  // Default content to use if fetch fails (with placeholder for charity percentage)
  const defaultContent = {
    headline: 'Making Robotics Education Accessible to Everyone',
    description: `We believe every student deserves the chance to build, code, and create—regardless of their background or resources. That's why we donate ${charityPercentage} of every dollar to local STEM programs.`,
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

  // If description contains {charityPercentage} placeholder, replace it
  const description = (
    parsedContent.description || defaultContent.description
  ).replace('{charityPercentage}', charityPercentage)

  return (
    <AboutHero
      headline={parsedContent.headline || defaultContent.headline}
      description={description}
    />
  )
}
