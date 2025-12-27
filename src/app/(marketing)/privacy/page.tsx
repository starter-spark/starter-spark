import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { formatDate } from '@/lib/utils'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'StarterSpark Robotics privacy policy - how we collect, use, and protect your data.',
}

export default async function PrivacyPage() {
  let page: {
    title: string | null
    content: string | null
    updated_at: string | null
  } | null = null
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('page_content')
      .select('title, content, updated_at')
      .eq('page_key', 'privacy')
      .not('published_at', 'is', null)
      .maybeSingle()
    page = data
  } catch (error) {
    console.error('Failed to fetch privacy policy content:', error)
  }

  const lastUpdated = page?.updated_at ? formatDate(page.updated_at) : null

  return (
    <LegalPage
      title={page?.title || 'Privacy Policy'}
      content={page?.content || null}
      lastUpdated={lastUpdated}
      emptyMessage="Privacy policy content is being updated. Please check back later."
    />
  )
}
