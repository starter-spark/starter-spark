import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import type { Metadata } from "next"
import { isExternalHref, sanitizeMarkdownUrl, safeMarkdownUrlTransform } from "@/lib/safe-url"

interface PageProps {
  params: Promise<{ slug: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: page } = await supabase
    .from("page_content")
    .select("title, seo_title, seo_description")
    .eq("slug", slug)
    .eq("is_custom_page", true)
    .not("published_at", "is", null)
    .maybeSingle()

  if (!page) {
    return {
      title: "Page Not Found",
    }
  }

  return {
    title: page.seo_title || page.title,
    description: page.seo_description || undefined,
  }
}

export default async function CustomPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch the custom page by slug
  const { data: page, error } = await supabase
    .from("page_content")
    .select("*")
    .eq("slug", slug)
    .eq("is_custom_page", true)
    .not("published_at", "is", null)
    .maybeSingle()

  if (error || !page) {
    notFound()
  }

  return (
    <div className="bg-slate-50">
      {/* Hero */}
      <section className="pt-32 pb-12 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-mono text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            {page.title}
          </h1>
          {page.updated_at && (
            <p className="text-sm text-slate-500">
              Last updated: {new Date(page.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded border border-slate-200 p-8 lg:p-12">
            <div className="prose prose-slate max-w-none prose-headings:font-mono prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-cyan-700 prose-a:no-underline hover:prose-a:underline prose-li:text-slate-600 prose-blockquote:border-l-cyan-700 prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r prose-blockquote:not-italic">
              <ReactMarkdown
                urlTransform={safeMarkdownUrlTransform}
                components={{
                  a: ({ href, children }) => {
                    const safeHref = sanitizeMarkdownUrl(href, "href")
                    if (!safeHref) return <span>{children}</span>
                    const external = isExternalHref(safeHref)
                    return (
                      <a
                        href={safeHref}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                      >
                        {children}
                      </a>
                    )
                  },
                }}
              >
                {page.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
