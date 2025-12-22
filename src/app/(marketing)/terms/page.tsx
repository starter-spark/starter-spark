import type { Metadata } from "next"
import { createPublicClient } from "@/lib/supabase/public"
import ReactMarkdown from "react-markdown"
import { isExternalHref, sanitizeMarkdownUrl, safeMarkdownUrlTransform } from "@/lib/safe-url"
import { isE2E } from "@/lib/e2e"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "StarterSpark Robotics terms of service - terms and conditions for using our products.",
}

export default async function TermsPage() {
  let page: { title: string | null; content: string | null; updated_at: string | null } | null = null
  if (!isE2E) {
    try {
      const supabase = createPublicClient()
      const { data } = await supabase
        .from("page_content")
        .select("title, content, updated_at")
        .eq("page_key", "terms")
        .not("published_at", "is", null)
        .maybeSingle()
      page = data
    } catch (error) {
      console.error("Failed to fetch terms of service content:", error)
    }
  }

  const lastUpdated = page?.updated_at
    ? new Date(page.updated_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-24 px-6 lg:px-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-mono text-4xl font-bold text-slate-900 mb-8">
            {page?.title || "Terms of Service"}
          </h1>

          <div className="bg-white rounded border border-slate-200 p-8">
            {page?.content ? (
              <div className="prose prose-slate max-w-none">
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
                          className="text-cyan-700 hover:underline"
                        >
                          {children}
                        </a>
                      )
                    },
                    h1: ({ children }) => (
                      <h2 className="text-2xl font-mono text-slate-900 mt-6 mb-4">
                        {children}
                      </h2>
                    ),
                    h2: ({ children }) => (
                      <h3 className="text-xl font-mono text-slate-900 mt-5 mb-3">
                        {children}
                      </h3>
                    ),
                  }}
                >
                  {page.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-slate-600 font-mono text-sm">
                Terms of service content is being updated. Please check back later.
              </p>
            )}
          </div>

          {lastUpdated && (
            <p className="mt-6 text-sm text-slate-600 text-center">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
