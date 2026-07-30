// (blocking) route group: no loading.tsx/Suspense above this page, so the
// lookups settle before the shell flushes and notFound() commits a real 404.
import { notFound } from 'next/navigation'
import { getCollection, getEntryMeta } from '@/cms/content'
import { getCmsAttachments } from '@/cms/attachments'
import { formatShortDate } from '@/lib/utils'
import {
  DocArticleHeader,
  DocAttachments,
  DocBreadcrumbs,
  DocContent,
  DocPrevNextNav,
  type DocNavPage,
} from '@/components/docs/DocArticle'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

interface Props {
  params: MaybePromise<{ category: string; slug: string }>
}

/**
 * An article is reachable only when both it and its category are published
 * and the URL's category matches the article's reference.
 */
async function loadArticle(categorySlug: string, slug: string) {
  const [entry, category] = await Promise.all([
    getEntryMeta('doc_page', slug),
    getEntryMeta('doc_category', categorySlug),
  ])
  if (!entry || !category || entry.data.category !== categorySlug) {
    return null
  }
  return { entry, category }
}

export async function generateMetadata({ params }: Props) {
  const { category: categorySlug, slug } = await resolveParams(params)

  const article = await loadArticle(categorySlug, slug)
  if (!article) {
    notFound()
  }

  return {
    title: `${article.entry.data.title} - Documentation - StarterSpark`,
    description:
      article.entry.data.excerpt ||
      `Documentation: ${article.entry.data.title}`,
  }
}

export default async function DocArticlePage({ params }: Props) {
  const { category: categorySlug, slug } = await resolveParams(params)

  const article = await loadArticle(categorySlug, slug)
  if (!article) {
    notFound()
  }
  const { entry, category } = article

  const [attachments, siblings] = await Promise.all([
    getCmsAttachments('doc_page', slug),
    getCollection('doc_page').then((pages) =>
      pages.filter((page) => page.data.category === categorySlug),
    ),
  ])

  const siblingPages: DocNavPage[] = siblings.map((page) => ({
    title: page.data.title,
    slug: page.key,
  }))
  const { prevPage, nextPage } = getSiblingNavigation(siblingPages, slug)

  // Calculate reading time (rough estimate: 200 words per minute)
  const readingTime = calculateReadingTime(entry.data.body)
  const updatedLabel = entry.publishedAt
    ? formatShortDate(entry.publishedAt)
    : 'Recently'

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Breadcrumb */}
      <DocBreadcrumbs
        category={{ name: category.data.name, slug: category.key }}
        title={entry.data.title}
      />

      {/* Article */}
      <article className="pb-16 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <DocArticleHeader
            title={entry.data.title}
            category={{ name: category.data.name, slug: category.key }}
            updatedLabel={updatedLabel}
            readingTime={readingTime}
          />

          {/* Content */}
          <div className="bg-white rounded border border-slate-200 p-6 lg:p-10">
            <DocContent content={entry.data.body || null} />

            {/* Attachments */}
            {attachments.length > 0 && (
              <DocAttachments attachments={attachments} />
            )}
          </div>
        </div>
      </article>

      {/* Navigation */}
      <DocPrevNextNav
        categorySlug={category.key}
        prevPage={prevPage}
        nextPage={nextPage}
      />
    </div>
  )
}

function calculateReadingTime(content: string) {
  const wordCount = content.split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

function getSiblingNavigation(pages: DocNavPage[], slug: string) {
  const currentIndex = pages.findIndex((page) => page.slug === slug)
  return {
    prevPage: currentIndex > 0 ? pages[currentIndex - 1] : null,
    nextPage:
      currentIndex >= 0 && currentIndex < pages.length - 1
        ? pages[currentIndex + 1]
        : null,
  }
}
