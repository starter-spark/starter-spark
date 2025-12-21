import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight, ArrowLeft, FileDown, Calendar, Clock } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Props {
  params: Promise<{ category: string; slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { category: categorySlug, slug } = await params
  const supabase = await createClient()

  const { data: page } = await supabase
    .from("doc_pages")
    .select(`
      title,
      excerpt,
      category:doc_categories!inner (
        slug
      )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!page || (page.category as { slug: string }).slug !== categorySlug) {
    return { title: "Article Not Found" }
  }

  return {
    title: `${page.title} - Documentation - StarterSpark`,
    description: page.excerpt || `Documentation: ${page.title}`,
  }
}

export default async function DocArticlePage({ params }: Props) {
  const { category: categorySlug, slug } = await params
  const supabase = await createClient()

  // Fetch the page with its category
  const { data: page, error } = await supabase
    .from("doc_pages")
    .select(`
      id,
      title,
      slug,
      content,
      excerpt,
      created_at,
      updated_at,
      category:doc_categories!inner (
        id,
        name,
        slug
      )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (error || !page) {
    notFound()
  }

  const category = page.category as { id: string; name: string; slug: string }

  // Verify the category slug matches
  if (category.slug !== categorySlug) {
    notFound()
  }

  // Fetch attachments for this page
  const { data: attachments } = await supabase
    .from("doc_attachments")
    .select("id, filename, storage_path, file_size, mime_type")
    .eq("page_id", page.id)

  // Get sibling pages for navigation
  const { data: siblingPages } = await supabase
    .from("doc_pages")
    .select("id, title, slug, sort_order")
    .eq("category_id", category.id)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })

  const currentIndex = siblingPages?.findIndex((p) => p.id === page.id) ?? -1
  const prevPage = currentIndex > 0 ? siblingPages?.[currentIndex - 1] : null
  const nextPage =
    currentIndex >= 0 && currentIndex < (siblingPages?.length ?? 0) - 1
      ? siblingPages?.[currentIndex + 1]
      : null

  // Calculate reading time (rough estimate: 200 words per minute)
  const wordCount = (page.content || "").split(/\s+/).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Breadcrumb */}
      <section className="pt-28 pb-4 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
            <Link href="/docs" className="hover:text-cyan-700 transition-colors">
              Documentation
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
              href={`/docs/${category.slug}`}
              className="hover:text-cyan-700 transition-colors"
            >
              {category.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 truncate">{page.title}</span>
          </nav>
        </div>
      </section>

      {/* Article */}
      <article className="pb-16 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/docs/${category.slug}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {category.name}
          </Link>

          <header className="mb-8">
            <h1 className="font-mono text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              {page.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  Updated{" "}
                  {page.updated_at || page.created_at
                    ? new Date(page.updated_at || page.created_at!).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Recently"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{readingTime} min read</span>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="bg-white rounded border border-slate-200 p-6 lg:p-10">
            <div className="prose prose-slate max-w-none prose-headings:font-mono prose-headings:text-slate-900 prose-a:text-cyan-700 prose-code:text-cyan-700 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900 prose-pre:text-slate-100">
              {page.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {page.content}
                </ReactMarkdown>
              ) : (
                <p className="text-slate-500 italic">
                  This article is being written. Check back soon!
                </p>
              )}
            </div>

            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h2 className="font-mono text-lg text-slate-900 mb-4">
                  Attachments
                </h2>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.storage_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-3 p-3 rounded border border-slate-200 hover:border-cyan-300 hover:bg-slate-50 transition-all"
                    >
                      <FileDown className="w-5 h-5 text-cyan-700" />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-slate-900 truncate">
                          {attachment.filename}
                        </p>
                        {attachment.file_size && (
                          <p className="text-xs text-slate-500">
                            {formatFileSize(attachment.file_size)}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Navigation */}
      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            {prevPage ? (
              <Link
                href={`/docs/${category.slug}/${prevPage.slug}`}
                className="flex-1 p-4 bg-white rounded border border-slate-200 hover:border-cyan-300 transition-colors group"
              >
                <p className="text-xs text-slate-500 mb-1">Previous</p>
                <p className="font-mono text-slate-900 group-hover:text-cyan-700 transition-colors">
                  {prevPage.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {nextPage ? (
              <Link
                href={`/docs/${category.slug}/${nextPage.slug}`}
                className="flex-1 p-4 bg-white rounded border border-slate-200 hover:border-cyan-300 transition-colors group text-right"
              >
                <p className="text-xs text-slate-500 mb-1">Next</p>
                <p className="font-mono text-slate-900 group-hover:text-cyan-700 transition-colors">
                  {nextPage.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
