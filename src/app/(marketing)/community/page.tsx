import { createClient } from "@/lib/supabase/server"
import { formatRelativeTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  Circle,
  MessageSquare,
  Plus,
  Eye,
  ChevronUp,
} from "lucide-react"
import Link from "next/link"
import { ForumFilters } from "./ForumFilters"
import { Suspense } from "react"
import { getContents } from "@/lib/content"
import type { Metadata } from "next"
import { siteConfig } from "@/config/site"

const pageTitle = "The Lab - Community Q&A"
const pageDescription = "Get help from the StarterSpark community. Ask questions, share solutions, and connect with other builders."

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: `${siteConfig.url}/community`,
    siteName: siteConfig.name,
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("The Lab")}&subtitle=${encodeURIComponent(pageDescription)}&type=post`,
        width: 1200,
        height: 630,
        alt: pageTitle,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [`/api/og?title=${encodeURIComponent("The Lab")}&subtitle=${encodeURIComponent(pageDescription)}&type=post`],
  },
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tag?: string; product?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch dynamic content
  const content = await getContents(
    ["community.header.title", "community.header.description", "community.empty"],
    {
      "community.header.title": "The Lab",
      "community.header.description": "Get help from the community. Ask questions, share solutions, and connect with other builders. Every question gets answered.",
      "community.empty": "No discussions yet. Be the first to ask a question!",
    }
  )

  // Fetch posts with author info and comment count
  let query = supabase
    .from("posts")
    .select(
      `
      id,
      slug,
      title,
      status,
      tags,
      upvotes,
      view_count,
      created_at,
      author:profiles!posts_author_id_fkey (
        id,
        full_name,
        email,
        role
      ),
      product:products (
        id,
        name,
        slug
      ),
      comments (id)
    `
    )
    .order("created_at", { ascending: false })

  // Apply filters
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  if (params.tag) {
    query = query.contains("tags", [params.tag])
  }

  // Apply text search
  if (params.q && params.q.trim()) {
    query = query.ilike("title", `%${params.q.trim()}%`)
  }

  const { data: posts, error } = await query.limit(50)

  if (error) {
    console.error("Error fetching posts:", error)
  }

  // Fetch products for filter dropdown
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug")
    .order("name")

  // Get unique tags from posts
  const allTags = new Set<string>()
  posts?.forEach((post) => {
    post.tags?.forEach((tag) => allTags.add(tag))
  })
  const availableTags = Array.from(allTags).sort()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-mono text-cyan-700 mb-2">Community</p>
          <h1 className="font-mono text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            {content["community.header.title"]}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            {content["community.header.description"]}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full lg:w-64 flex-shrink-0">
              {/* Ask Question CTA */}
              <Link href="/community/new">
                <Button className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono mb-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Ask a Question
                </Button>
              </Link>

              {/* Filters */}
              <Suspense fallback={<div className="animate-pulse bg-slate-100 rounded h-48" />}>
                <ForumFilters
                  products={products || []}
                  availableTags={availableTags}
                  currentStatus={params.status}
                  currentTag={params.tag}
                  currentProduct={params.product}
                  currentSearch={params.q}
                />
              </Suspense>
            </div>

            {/* Question List */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-500 font-mono">
                  {posts?.length || 0} questions
                </p>
              </div>

              {/* Questions */}
              {posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => {
                    const author = post.author as {
                      id: string
                      full_name: string | null
                      email: string
                      role: string | null
                    } | null
                    const commentCount = (post.comments as { id: string }[])
                      ?.length || 0

                    return (
                      <Link
                        key={post.id}
                        href={`/community/${post.id}`}
                        className="block"
                      >
                        <article className="bg-white border border-slate-200 rounded p-6 hover:border-cyan-300 transition-colors">
                          <div className="flex gap-4">
                            {/* Vote/Status Column */}
                            <div className="flex flex-col items-center gap-2 text-center min-w-[60px]">
                              <div className="flex items-center gap-1 text-slate-500">
                                <ChevronUp className="w-4 h-4" />
                                <span className="font-mono text-sm">
                                  {post.upvotes || 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-500">
                                <MessageSquare className="w-4 h-4" />
                                <span className="font-mono text-sm">
                                  {commentCount}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-500">
                                <Eye className="w-3 h-3" />
                                <span className="font-mono text-xs">
                                  {post.view_count}
                                </span>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-2">
                                {/* Status Badge */}
                                {post.status === "solved" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-mono rounded">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Solved
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono rounded">
                                    <Circle className="w-3 h-3" />
                                    Open
                                  </span>
                                )}

                                {/* Title */}
                                <h2 className="font-mono text-lg text-slate-900 hover:text-cyan-700 truncate">
                                  {post.title}
                                </h2>
                              </div>

                              {/* Tags */}
                              {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {post.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono rounded"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Meta */}
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>
                                  {author?.full_name ||
                                    author?.email?.split("@")[0] ||
                                    "Anonymous"}
                                </span>
                                {author?.role &&
                                  ["admin", "staff"].includes(author.role) && (
                                    <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-mono rounded">
                                      Staff
                                    </span>
                                  )}
                                <span className="text-slate-300">·</span>
                                <span>
                                  {post.created_at &&
                                    formatRelativeTime(post.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="font-mono text-lg font-semibold text-slate-900 mb-2">
                    No questions yet
                  </p>
                  <p className="text-slate-600 mb-6">
                    {content["community.empty"]}
                  </p>
                  <Link href="/community/new">
                    <Button className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono">
                      <Plus className="w-4 h-4 mr-2" />
                      Ask a Question
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
