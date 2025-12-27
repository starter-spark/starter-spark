import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, FileText, ArrowLeft, BookOpen } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import {
  fetchDocCategoryMeta,
  fetchDocCategoryWithPages,
  type DocCategoryPage,
} from '@/lib/docs'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

interface Props {
  params: MaybePromise<{ category: string }>
}

export async function generateMetadata({ params }: Props) {
  const { category: categorySlug } = await resolveParams(params)
  const supabase = await createClient()

  const category = await fetchDocCategoryMeta(supabase, categorySlug)

  if (!category) {
    return { title: 'Category Not Found' }
  }

  return {
    title: `${category.name} - Documentation - StarterSpark`,
    description: category.description || `Documentation for ${category.name}`,
  }
}

export default async function DocCategoryPage({ params }: Props) {
  const { category: categorySlug } = await resolveParams(params)
  const supabase = await createClient()

  // Fetch category with its pages
  const category = await fetchDocCategoryWithPages(supabase, categorySlug)

  if (!category) {
    notFound()
  }

  const typedCategory = category

  // Sort pages by sort_order
  const sortedPages = sortCategoryPages(typedCategory.pages || [])

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
            <span className="text-slate-900">{typedCategory.name}</span>
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
            {typedCategory.name}
          </h1>
          {typedCategory.description && (
            <p className="text-lg text-slate-600">
              {typedCategory.description}
            </p>
          )}
        </div>
      </section>

      {/* Articles List */}
      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          {sortedPages.length === 0 ? (
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
              {sortedPages.map((page) => (
                <DocCategoryPageCard
                  key={page.id}
                  page={page}
                  categorySlug={typedCategory.slug}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function sortCategoryPages(pages: DocCategoryPage[]) {
  return [...pages].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
  )
}

function DocCategoryPageCard({
  page,
  categorySlug,
}: {
  page: DocCategoryPage
  categorySlug: string
}) {
  const updatedLabel = page.updated_at
    ? `Updated ${formatShortDate(page.updated_at)}`
    : 'Recently updated'

  return (
    <Link
      href={`/docs/${categorySlug}/${page.slug}`}
      className="group flex items-start gap-4 p-5 bg-white rounded border border-slate-200 hover:border-cyan-300 hover:shadow-sm transition-all"
    >
      <div className="w-10 h-10 rounded bg-cyan-50 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-100 transition-colors">
        <FileText className="w-5 h-5 text-cyan-700" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-mono text-lg text-slate-900 mb-1 group-hover:text-cyan-700 transition-colors">
          {page.title}
        </h2>
        {page.excerpt && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-2">
            {page.excerpt}
          </p>
        )}
        <p className="text-xs text-slate-400">{updatedLabel}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 flex-shrink-0 mt-2 transition-colors" />
    </Link>
  )
}
