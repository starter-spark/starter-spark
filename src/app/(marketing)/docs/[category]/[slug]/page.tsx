import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatShortDate } from '@/lib/utils'
import {
  fetchDocArticle,
  fetchDocAttachments,
  fetchDocMetadata,
  fetchDocSiblingPages,
  type DocNavPage,
} from '@/lib/docs'
import {
  DocArticleHeader,
  DocAttachments,
  DocBreadcrumbs,
  DocContent,
  DocPrevNextNav,
} from '@/components/docs/DocArticle'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

interface Props {
  params: MaybePromise<{ category: string; slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { category: categorySlug, slug } = await resolveParams(params)
  const supabase = await createClient()

  const page = await fetchDocMetadata(supabase, slug)

  if (!page || page.categorySlug !== categorySlug) {
    return { title: 'Article Not Found' }
  }

  return {
    title: `${page.title} - Documentation - StarterSpark`,
    description: page.excerpt || `Documentation: ${page.title}`,
  }
}

export default async function DocArticlePage({ params }: Props) {
  const { category: categorySlug, slug } = await resolveParams(params)
  const supabase = await createClient()

  // Fetch the page with its category
  const page = await fetchDocArticle(supabase, slug)

  if (!page) {
    notFound()
  }

  const category = page.category

  // Verify the category slug matches
  if (category.slug !== categorySlug) {
    notFound()
  }

  // Fetch attachments for this page
  const attachments = await fetchDocAttachments(supabase, page.id)

  // Get sibling pages for navigation
  const siblingPages = await fetchDocSiblingPages(supabase, category.id)
  const { prevPage, nextPage } = getSiblingNavigation(siblingPages, page.id)

  // Calculate reading time (rough estimate: 200 words per minute)
  const readingTime = calculateReadingTime(page.content)
  const updatedLabel = resolveUpdatedLabel(page.updated_at, page.created_at)

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Breadcrumb */}
      <DocBreadcrumbs category={category} title={page.title} />

      {/* Article */}
      <article className="pb-16 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <DocArticleHeader
            title={page.title}
            category={category}
            updatedLabel={updatedLabel}
            readingTime={readingTime}
          />

          {/* Content */}
          <div className="bg-white rounded border border-slate-200 p-6 lg:p-10">
            <DocContent content={page.content} />

            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <DocAttachments attachments={attachments} />
            )}
          </div>
        </div>
      </article>

      {/* Navigation */}
      <DocPrevNextNav
        categorySlug={category.slug}
        prevPage={prevPage}
        nextPage={nextPage}
      />
    </div>
  )
}

function resolveUpdatedLabel(
  updatedAt: string | null,
  createdAt: string | null,
) {
  const displayDate = updatedAt || createdAt
  return displayDate ? formatShortDate(displayDate) : 'Recently'
}

function calculateReadingTime(content: string | null) {
  const wordCount = (content || '').split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

function getSiblingNavigation(pages: DocNavPage[], pageId: string) {
  const currentIndex = pages.findIndex((page) => page.id === pageId)
  return {
    prevPage: currentIndex > 0 ? pages[currentIndex - 1] : null,
    nextPage:
      currentIndex >= 0 && currentIndex < pages.length - 1
        ? pages[currentIndex + 1]
        : null,
  }
}
