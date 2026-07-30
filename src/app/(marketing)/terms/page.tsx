import type { Metadata } from 'next'
import { getEntryMeta } from '@/cms/content'
import { formatDate } from '@/lib/utils'
import { LegalPage } from '@/components/legal/LegalPage'

export async function generateMetadata(): Promise<Metadata> {
  const entry = await getEntryMeta('page', 'terms')
  return {
    title: entry?.data.seoTitle || entry?.data.title || 'Terms of Service',
    description:
      entry?.data.seoDescription ||
      'StarterSpark Robotics terms of service - terms and conditions for using our products.',
  }
}

export default async function TermsPage() {
  const entry = await getEntryMeta('page', 'terms')
  const lastUpdated =
    entry && entry.data.showLastUpdated && entry.publishedAt
      ? formatDate(entry.publishedAt)
      : null

  return (
    <LegalPage
      title={entry?.data.title || 'Terms of Service'}
      content={entry?.data.body || null}
      lastUpdated={lastUpdated}
      emptyMessage="Terms of service content is being updated. Please check back later."
    />
  )
}
