// No loading.tsx above this route on purpose: the CMS lookup settles before
// the shell flushes, so notFound() commits a real 404 status.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEntryMeta } from '@/cms/content'
import { formatDate } from '@/lib/utils'
import { LegalPage } from '@/components/legal/LegalPage'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

interface PageProps {
  params: MaybePromise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params)
  const entry = await getEntryMeta('page', slug)
  if (!entry) {
    notFound()
  }
  return {
    title: entry.data.seoTitle || entry.data.title,
    description: entry.data.seoDescription || undefined,
  }
}

export default async function CmsPage({ params }: PageProps) {
  const { slug } = await resolveParams(params)
  const entry = await getEntryMeta('page', slug)
  if (!entry) {
    notFound()
  }

  const lastUpdated =
    entry.data.showLastUpdated && entry.publishedAt
      ? formatDate(entry.publishedAt)
      : null

  return (
    <LegalPage
      title={entry.data.title}
      content={entry.data.body}
      lastUpdated={lastUpdated}
      emptyMessage="This page is being updated. Please check back later."
    />
  )
}
