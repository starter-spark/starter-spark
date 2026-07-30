import type { Metadata } from 'next'
import { getEntryMeta } from '@/cms/content'
import { formatDate } from '@/lib/utils'
import { LegalPage } from '@/components/legal/LegalPage'

export async function generateMetadata(): Promise<Metadata> {
  const entry = await getEntryMeta('page', 'privacy')
  return {
    title: entry?.data.seoTitle || entry?.data.title || 'Privacy Policy',
    description:
      entry?.data.seoDescription ||
      'StarterSpark Robotics privacy policy - how we collect, use, and protect your data.',
  }
}

export default async function PrivacyPage() {
  const entry = await getEntryMeta('page', 'privacy')
  const lastUpdated =
    entry && entry.data.showLastUpdated && entry.publishedAt
      ? formatDate(entry.publishedAt)
      : null

  return (
    <LegalPage
      title={entry?.data.title || 'Privacy Policy'}
      content={entry?.data.body || null}
      lastUpdated={lastUpdated}
      emptyMessage="Privacy policy content is being updated. Please check back later."
    />
  )
}
