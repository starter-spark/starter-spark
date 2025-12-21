import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight, FileText, ArrowLeft, BookOpen } from "lucide-react"

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props) {
  const { category: categorySlug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from("doc_categories")
    .select("name, description")
    .eq("slug", categorySlug)
    .eq("is_published", true)
    .single()

  if (!category) {
    return { title: "Category Not Found" }
  }

  return {
    title: `${category.name} - Documentation - StarterSpark`,
    description: category.description || `Documentation for ${category.name}`,
  }
}

export default async function DocCategoryPage({ params }: Props) {
  const { category: categorySlug } = await params
  const supabase = await createClient()

  // Fetch category with its pages
  const { data: category, error } = await supabase
    .from("doc_categories")
    .select(`
      id,
      name,
      slug,
      description,
      pages:doc_pages (
        id,
        title,
        slug,
        excerpt,
        sort_order,
        updated_at
      )
    `)
    .eq("slug", categorySlug)
    .eq("is_published", true)
    .single()

  if (error || !category) {
    notFound()
  }

  // Sort pages by sort_order
  const sortedPages = (category.pages || []).sort(
    (a: { sort_order: number | null }, b: { sort_order: number | null }) =>
      (a.sort_order || 0) - (b.sort_order || 0)
  )

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Breadcrumb */}
      <section className="pt-28 pb-4 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/docs" className="hover:text-cyan-700 transition-colors">
              Documentation
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900">{category.name}</span>
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
            {category.name}
          </h1>
          {category.description && (
            <p className="text-lg text-slate-600">{category.description}</p>
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
              {sortedPages.map((page: {
                id: string
                title: string
                slug: string
                excerpt: string | null
                updated_at: string | null
              }) => (
                <Link
                  key={page.id}
                  href={`/docs/${category.slug}/${page.slug}`}
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
                    <p className="text-xs text-slate-400">
                      {page.updated_at
                        ? `Updated ${new Date(page.updated_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}`
                        : "Recently updated"}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 flex-shrink-0 mt-2 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
