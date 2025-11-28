import { createClient } from "@/lib/supabase/server"
import { formatRelativeTime, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  ArrowLeft,
  Share2,
  Bookmark,
  Flag,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { AnswerForm } from "./AnswerForm"
import { MarkdownContent } from "./MarkdownContent"

type PageParams = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: PageParams
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from("posts")
    .select("title")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (!post) {
    return { title: "Question Not Found" }
  }

  return {
    title: `${post.title} - The Lab`,
    description: post.title,
  }
}

export default async function QuestionDetailPage({
  params,
}: {
  params: PageParams
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch the post with author and comments
  const { data: post, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      slug,
      title,
      content,
      status,
      tags,
      upvotes,
      view_count,
      created_at,
      updated_at,
      author:profiles!posts_author_id_fkey (
        id,
        full_name,
        email,
        avatar_url,
        role
      ),
      product:products (
        id,
        name,
        slug
      )
    `
    )
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (error || !post) {
    notFound()
  }

  // Fetch comments separately (answers)
  const { data: comments } = await supabase
    .from("comments")
    .select(
      `
      id,
      content,
      is_staff_reply,
      is_verified_answer,
      upvotes,
      created_at,
      author:profiles!comments_author_id_fkey (
        id,
        full_name,
        email,
        avatar_url,
        role
      )
    `
    )
    .eq("post_id", post.id)
    .is("parent_id", null) // Only top-level comments
    .order("is_verified_answer", { ascending: false })
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: true })

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Increment view count (fire and forget)
  supabase
    .from("posts")
    .update({ view_count: (post.view_count || 0) + 1 })
    .eq("id", post.id)
    .then(() => {})

  const author = post.author as {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    role: string | null
  } | null

  const product = post.product as {
    id: string
    name: string
    slug: string
  } | null

  const verifiedAnswer = comments?.find((c) => c.is_verified_answer)

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <section className="pt-24 pb-4 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to The Lab
          </Link>
        </div>
      </section>

      {/* Question */}
      <section className="pb-8 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <article className="bg-white border border-slate-200 rounded p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              {/* Vote Column */}
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <button className="p-1 text-slate-500 hover:text-cyan-700 transition-colors">
                  <ChevronUp className="w-6 h-6" />
                </button>
                <span className="font-mono text-lg text-slate-700">
                  {post.upvotes || 0}
                </span>
                <button className="p-1 text-slate-500 hover:text-slate-600 transition-colors">
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Status Badge */}
                <div className="flex items-center gap-3 mb-3">
                  {post.status === "solved" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm font-mono rounded">
                      <CheckCircle2 className="w-4 h-4" />
                      Solved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-sm font-mono rounded">
                      Open
                    </span>
                  )}
                  {product && (
                    <Link
                      href={`/shop/${product.slug}`}
                      className="text-sm text-slate-500 hover:text-cyan-700"
                    >
                      {product.name}
                    </Link>
                  )}
                </div>

                {/* Title */}
                <h1 className="font-mono text-2xl lg:text-3xl text-slate-900 mb-4">
                  {post.title}
                </h1>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/community?tag=${tag}`}
                        className="px-2 py-1 bg-slate-100 text-slate-600 text-sm font-mono rounded hover:bg-cyan-100 hover:text-cyan-700 transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Author Info */}
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="font-mono text-slate-600">
                      {(author?.full_name || author?.email || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-700">
                      {author?.full_name || author?.email?.split("@")[0] || "Anonymous"}
                    </span>
                    {author?.role && ["admin", "staff"].includes(author.role) && (
                      <span className="ml-2 px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-mono rounded">
                        Staff
                      </span>
                    )}
                    <span className="mx-2 text-slate-300">·</span>
                    <span>
                      {post.created_at && formatRelativeTime(post.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="pl-14">
              <MarkdownContent content={post.content} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-6 pl-14 pt-4 border-t border-slate-100">
              <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-700 transition-colors">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-700 transition-colors">
                <Bookmark className="w-4 h-4" />
                Save
              </button>
              <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-600 transition-colors">
                <Flag className="w-4 h-4" />
                Report
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Answers */}
      <section className="pb-8 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-mono text-xl text-slate-900 mb-4">
            {comments?.length || 0} Answer{(comments?.length || 0) !== 1 && "s"}
          </h2>

          {/* Verified Answer (pinned) */}
          {verifiedAnswer && (
            <div className="mb-6">
              <div className="bg-green-50 border-2 border-green-200 rounded p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-mono text-sm text-green-700">
                    Verified Solution
                  </span>
                </div>
                <AnswerCard answer={verifiedAnswer} formatRelativeTime={formatRelativeTime} />
              </div>
            </div>
          )}

          {/* Other Answers */}
          <div className="space-y-4">
            {comments
              ?.filter((c) => !c.is_verified_answer)
              .map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white border border-slate-200 rounded p-6"
                >
                  <AnswerCard answer={comment} formatRelativeTime={formatRelativeTime} />
                </div>
              ))}
          </div>

          {/* No Answers State */}
          {(!comments || comments.length === 0) && (
            <div className="bg-white border border-slate-200 rounded p-8 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-2">No answers yet</p>
              <p className="text-sm text-slate-500">
                Be the first to help out!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Answer Form */}
      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-mono text-xl text-slate-900 mb-4">Your Answer</h2>
          {user ? (
            <AnswerForm postId={post.id} />
          ) : (
            <div className="bg-white border border-slate-200 rounded p-8 text-center">
              <p className="text-slate-600 mb-4">
                Sign in to post an answer
              </p>
              <Link href="/login">
                <Button className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

// Answer Card Component
function AnswerCard({
  answer,
  formatRelativeTime,
}: {
  answer: {
    id: string
    content: string
    is_staff_reply: boolean | null
    upvotes: number
    created_at: string | null
    author: {
      id: string
      full_name: string | null
      email: string
      avatar_url: string | null
      role: string | null
    } | null
  }
  formatRelativeTime: (date: string) => string
}) {
  const author = answer.author

  return (
    <div className="flex gap-4">
      {/* Vote Column */}
      <div className="flex flex-col items-center gap-1 min-w-[40px]">
        <button className="p-1 text-slate-500 hover:text-cyan-700 transition-colors">
          <ChevronUp className="w-5 h-5" />
        </button>
        <span className="font-mono text-sm text-slate-600">
          {answer.upvotes || 0}
        </span>
        <button className="p-1 text-slate-500 hover:text-slate-600 transition-colors">
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <MarkdownContent content={answer.content} />

        {/* Author Info */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
          <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
            <span className="font-mono text-xs text-slate-600">
              {(author?.full_name || author?.email || "?")[0].toUpperCase()}
            </span>
          </div>
          <span className="text-slate-700">
            {author?.full_name || author?.email?.split("@")[0] || "Anonymous"}
          </span>
          {(answer.is_staff_reply ||
            (author?.role && ["admin", "staff"].includes(author.role))) && (
            <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-mono rounded">
              Staff
            </span>
          )}
          <span className="text-slate-300">·</span>
          <span>
            {answer.created_at && formatRelativeTime(answer.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}
