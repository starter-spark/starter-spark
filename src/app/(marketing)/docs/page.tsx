import { createClient } from '@/lib/supabase/server'
import type { ComponentType } from 'react'
import {
  BookOpen,
  Cpu,
  Zap,
  Wrench,
  Book,
  Rocket,
  ChevronRight,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { DocSearch } from './DocSearch'
import {
  fetchDocCategories,
  type DocCategoryListItem,
} from '@/lib/docs'

export const metadata = {
  title: 'Documentation - StarterSpark Robotics',
  description:
    'Comprehensive documentation, guides, and references for StarterSpark robotics kits.',
}

// Map category icons to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Cpu,
  Zap,
  Wrench,
  Book,
  BookOpen,
}

export default async function DocsPage() {
  const supabase = await createClient()

  // Fetch published categories with their published pages
  const categories = await fetchDocCategories(supabase)

  // Filter to only show categories that have published pages OR use all if no pages yet
  const typedCategories = categories

  // Count total pages
  const totalPages = typedCategories.reduce(
    (acc, cat) => acc + (cat.pages?.length || 0),
    0,
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="px-6 lg:px-8 pt-8 pb-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-slate-500">
              <li>
                <Link href="/" className="hover:text-cyan-700 transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-900 font-medium">Documentation</li>
            </ol>
          </nav>

          {/* Title block with left accent */}
          <div className="border-l-4 border-cyan-600 pl-4 mb-8">
            <h1 className="font-mono text-2xl sm:text-3xl font-bold text-slate-900">
              Build With Confidence
            </h1>
            <p className="mt-2 text-slate-600 max-w-2xl">
              Comprehensive guides for assembly, wiring, and programming your
              robotics kit. Everything you need to go from unboxing to autonomous
              operation.
            </p>
          </div>

          {/* Search */}
          <DocSearch />

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mt-6">
            <DocStatCard
              icon={BookOpen}
              label={`${typedCategories.length} Categories`}
            />
            <DocStatCard icon={Search} label={`${totalPages} Articles`} />
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 lg:px-8 pb-16">
          {/* Categories Grid */}
          <section aria-labelledby="categories-heading" className="mb-12">
            <h2 id="categories-heading" className="sr-only">Documentation Categories</h2>
            {typedCategories.length === 0 ? (
              <div className="text-center py-16 bg-white rounded border border-slate-200">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="font-mono text-xl text-slate-900 mb-2">
                  Documentation Coming Soon
                </h3>
                <p className="text-slate-600">
                  We&apos;re working on comprehensive documentation. Check back
                  soon!
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {typedCategories.map((category) => (
                  <DocCategoryCard key={category.id} category={category} />
                ))}
              </div>
            )}
          </section>

          {/* CTA Section */}
          <section aria-labelledby="cta-heading" className="bg-white rounded border border-slate-200 p-8 text-center">
            <h2 id="cta-heading" className="font-mono text-xl text-slate-900 mb-3">
              Looking for Hands-On Learning?
            </h2>
            <p className="text-slate-600 mb-6 max-w-xl mx-auto">
              Our interactive courses provide step-by-step instruction with
              progress tracking. Perfect for building your first robotics
              project.
            </p>
            <Link
              href="/workshop?tab=courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-mono rounded transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              Browse Courses
            </Link>
          </section>
        </main>
      </div>
    </div>
  )
}

function DocStatCard({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded border border-slate-200">
      <Icon className="w-5 h-5 text-cyan-700" />
      <span className="font-mono text-sm text-slate-900">{label}</span>
    </div>
  )
}

function DocCategoryCard({ category }: { category: DocCategoryListItem }) {
  const Icon = iconMap[category.icon || 'BookOpen'] || BookOpen
  const pageCount = category.pages?.length || 0

  return (
    <Link
      href={`/docs/${category.slug}`}
      className="group block bg-white rounded border border-slate-200 hover:border-cyan-300 transition-all overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded bg-cyan-50 flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
            <Icon className="w-6 h-6 text-cyan-700" />
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
        </div>
        <h3 className="font-mono text-lg text-slate-900 mb-2 group-hover:text-cyan-700 transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {category.description || 'Explore articles in this category'}
        </p>
        <p className="text-xs font-mono text-slate-500">
          {pageCount} {pageCount === 1 ? 'article' : 'articles'}
        </p>
      </div>
    </Link>
  )
}
