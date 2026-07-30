// (blocking) route group: no loading.tsx/Suspense above this page, so the
// lookups settle before the shell flushes and notFound() commits a real 404.
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, FileText, ArrowLeft, BookOpen } from 'lucide-react'
import { getCollection, getEntryMeta } from '@/cms/content'
import { formatShortDate } from '@/lib/utils'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

interface Props {
  params: MaybePromise<{ category: string }>
}

export async function generateMetadata({ params }: Props) {
  const { category: categorySlug } = await resolveParams(params)

  const category = await getEntryMeta('doc_category', categorySlug)
  if (!category) {
    notFound()
  }

  return {
    title: `${category.data.name} - Documentation - StarterSpark`,
    description:
      category.data.description || `Documentation for ${category.data.name}`,
  }
}

export default async function DocCategoryPage({ params }: Props) {
  const { category: categorySlug } = await resolveParams(params)

  const category = await getEntryMeta('doc_category', categorySlug)
  if (!category) {
    notFound()
  }

  // getCollection returns entries in admin-defined order
  const pages = (await getCollection('doc_page')).filter(
    (page) => page.data.category === categorySlug,
  )

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Breadcrumb */}
      <section className="pt-28 pb-4 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/docs"
              className="hover:text-cyan-700 transition-colors"
            >
              Documentation
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900">{category.data.name}</span>
          </nav>
        </div>
      </section>

      {/* Header */}
      <section className="pb-8 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documentation
          </Link>
          <h1 className="font-mono text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            {category.data.name}
          </h1>
          {category.data.description && (
            <p className="text-lg text-slate-600">
              {category.data.description}
            </p>
          )}
        </div>
      </section>

      {/* Articles List */}
      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          {pages.length === 0 ? (
            <div className="text-center py-16 bg-white rounded border border-slate-200">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h2 className="font-mono text-xl text-slate-900 mb-2">
                No Articles Yet
              </h2>
              <p className="text-slate-600">
                Articles for this category are coming soon.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <DocCategoryPageCard
                  key={page.key}
                  slug={page.key}
                  title={page.data.title}
                  excerpt={page.data.excerpt}
                  publishedAt={page.publishedAt}
                  categorySlug={categorySlug}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function DocCategoryPageCard({
  slug,
  title,
  excerpt,
  publishedAt,
  categorySlug,
}: {
  slug: string
  title: string
  excerpt: string
  publishedAt: string | null
  categorySlug: string
}) {
  const updatedLabel = publishedAt
    ? `Updated ${formatShortDate(publishedAt)}`
    : 'Recently updated'

  return (
    <Link
      href={`/docs/${categorySlug}/${slug}`}
      className="group flex items-start gap-4 p-5 bg-white rounded border border-slate-200 hover:border-cyan-300 hover:shadow-sm transition-all"
    >
      <div className="w-10 h-10 rounded bg-cyan-50 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-100 transition-colors">
        <FileText className="w-5 h-5 text-cyan-700" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-mono text-lg text-slate-900 mb-1 group-hover:text-cyan-700 transition-colors">
          {title}
        </h2>
        {excerpt && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-2">{excerpt}</p>
        )}
        <p className="text-xs text-slate-400">{updatedLabel}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 flex-shrink-0 mt-2 transition-colors" />
    </Link>
  )
}
