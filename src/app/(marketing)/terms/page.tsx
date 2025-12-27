import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { formatDate } from '@/lib/utils'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'StarterSpark Robotics terms of service - terms and conditions for using our products.',
}

export default async function TermsPage() {
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
      .eq('page_key', 'terms')
      .not('published_at', 'is', null)
      .maybeSingle()
    page = data
  } catch (error) {
    console.error('Failed to fetch terms of service content:', error)
  }

  const lastUpdated = page?.updated_at ? formatDate(page.updated_at) : null

  return (
    <LegalPage
      title={page?.title || 'Terms of Service'}
      content={page?.content || null}
      lastUpdated={lastUpdated}
      emptyMessage="Terms of service content is being updated. Please check back later."
    />
  )
}
