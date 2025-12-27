import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { CheckCircle2, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AnswerForm } from './AnswerForm'
import { MarkdownContent } from './MarkdownContent'
import { VoteButtons } from './VoteButtons'
import { PostActions } from './PostActions'
import { siteConfig } from '@/config/site'
import { isUuid } from '@/lib/uuid'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

type PageParams = MaybePromise<{ id: string }>

export async function generateMetadata({
  params,
}: {
  params: PageParams
}): Promise<Metadata> {
  const { id } = await resolveParams(params)
  const supabase = await createClient()

  // Check if id looks like a UUID, otherwise treat as slug
  const isUUID = isUuid(id)

  const { data: post, error } = await supabase
    .from('posts')
    .select('title, content')
    .eq(isUUID ? 'id' : 'slug', id)
    .maybeSingle()

  if (error || !post) {
    return { title: 'Question Not Found' }
  }

  const title = post.title
  const description = post.content?.slice(0, 160) || post.title

  // Build OG image URL with post info
  const ogParams = new URLSearchParams({
    title,
    subtitle: 'Community Question in The Lab',
    type: 'post',
  })
  const ogImageUrl = `/api/og?${ogParams.toString()}`

  return {
    title: `${title} - The Lab`,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/community/${id}`,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function QuestionDetailPage({
  params,
}: {
  params: PageParams
}) {
  const { id } = await resolveParams(params)
  const supabase = await createClient()

  // Fetch the post with author and comments
  // Check if id looks like a UUID, otherwise treat as slug
  const isUUID = isUuid(id)

  const { data: post, error } = await supabase
    .from('posts')
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
        avatar_seed,
        role
      ),
      product:products (
        id,
        name,
        slug
      )
    `,
    )
    .eq(isUUID ? 'id' : 'slug', id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching community post:', error)
    throw new Error('Failed to load post')
  }

  if (!post) {
    notFound()
  }

  // Fetch comments separately (answers)
  const commentsAuthorIdFkey = `comments_author_id_fkey` as const
  const commentsAuthorJoin = `author:profiles!${commentsAuthorIdFkey}` as const
  const commentsSelect = `
      id,
      content,
      is_staff_reply,
      is_verified_answer,
      upvotes,
      created_at,
      ${commentsAuthorJoin} (
        id,
        full_name,
        email,
        avatar_url,
        avatar_seed,
        role
      )
    ` as const

  const { data: comments } = await supabase
    .from('comments')
    .select(commentsSelect)
    .eq('post_id', post.id)
    .is('parent_id', null) // Only top-level comments
    .order('is_verified_answer', { ascending: false })
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: true })

  // Transform comments to properly type the author field
  type CommentAuthor = {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    avatar_seed: string | null
    role: string | null
  } | null

  const typedComments = comments?.map((c) => ({
    ...c,
    author: c.author as unknown as CommentAuthor,
  }))

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user's votes on post and comments
  let userPostVote: 1 | -1 | null = null
  const userCommentVotes: Record<string, 1 | -1> = {}

  if (user) {
    // Fetch post vote
    const { data: postVoteData, error: postVoteError } = await supabase
      .from('post_votes')
      .select('vote_type')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (postVoteError) {
      console.error('Error fetching post vote:', postVoteError)
    }

    if (postVoteData) {
      userPostVote = postVoteData.vote_type as 1 | -1
    }

    // Fetch comment votes
    if (comments && comments.length > 0) {
      const commentIds = comments.map((c) => c.id)
      const { data: commentVotesData } = await supabase
        .from('comment_votes')
        .select('comment_id, vote_type')
        .eq('user_id', user.id)
        .in('comment_id', commentIds)

      if (commentVotesData) {
        for (const vote of commentVotesData) {
          userCommentVotes[vote.comment_id] = vote.vote_type as 1 | -1
        }
      }
    }
  }

  // Increment view count (safe + RLS-compatible)
  const { error: viewCountError } = await supabase.rpc('increment_post_view', {
    p_post_id: post.id,
  })
  if (viewCountError) {
    console.error('Error incrementing post view count:', viewCountError)
  }

  const author = post.author as unknown as {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    avatar_seed: string | null
    role: string | null
  } | null

  const product = post.product as unknown as {
    id: string
    name: string
    slug: string
  } | null

  const verifiedAnswer = typedComments?.find((c) => c.is_verified_answer)

  return (
    <div className="bg-slate-50">
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
              <div className="min-w-[40px]">
                <VoteButtons
                  type="post"
                  id={post.id}
                  initialVotes={post.upvotes || 0}
                  userVote={userPostVote}
                  isAuthenticated={!!user}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Status Badge */}
                <div className="flex items-center gap-3 mb-3">
                  {post.status === 'solved' ? (
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
                  <UserAvatar
                    user={{
                      id: author?.id || post.id,
                      full_name: author?.full_name,
                      email: author?.email,
                      avatar_url: author?.avatar_url,
                      avatar_seed: author?.avatar_seed,
                    }}
                    size="md"
                  />
                  <div>
                    <span className="text-slate-700">
                      {author?.full_name ||
                        author?.email?.split('@')[0] ||
                        'Anonymous'}
                    </span>
                    {author?.role &&
                      ['admin', 'staff'].includes(author.role) && (
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
            <div className="mt-6 pl-14 pt-4 border-t border-slate-100">
              <PostActions postId={post.id} isAuthenticated={!!user} />
            </div>
          </article>
        </div>
      </section>

      {/* Answers */}
      <section className="pb-8 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-mono text-xl text-slate-900 mb-4">
            {typedComments?.length || 0} Answer
            {(typedComments?.length || 0) !== 1 && 's'}
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
                <AnswerCard
                  answer={verifiedAnswer}
                  formatRelativeTime={formatRelativeTime}
                  isAuthenticated={!!user}
                  userVote={userCommentVotes[verifiedAnswer.id] ?? null}
                />
              </div>
            </div>
          )}

          {/* Other Answers */}
          <div className="space-y-4">
            {typedComments
              ?.filter((c) => !c.is_verified_answer)
              .map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white border border-slate-200 rounded p-6"
                >
                  <AnswerCard
                    answer={comment}
                    formatRelativeTime={formatRelativeTime}
                    isAuthenticated={!!user}
                    userVote={userCommentVotes[comment.id] ?? null}
                  />
                </div>
              ))}
          </div>

          {/* No Answers State */}
          {(!typedComments || typedComments.length === 0) && (
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
              <p className="text-slate-600 mb-4">Sign in to post an answer</p>
              <Button
                asChild
                className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// Answer Card Component
function AnswerCard({
  answer,
  formatRelativeTime,
  isAuthenticated,
  userVote,
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
      avatar_seed: string | null
      role: string | null
    } | null
  }
  formatRelativeTime: (date: string) => string
  isAuthenticated: boolean
  userVote: 1 | -1 | null
}) {
  const author = answer.author

  return (
    <div className="flex gap-4">
      {/* Vote Column */}
      <div className="min-w-[40px]">
        <VoteButtons
          type="comment"
          id={answer.id}
          initialVotes={answer.upvotes || 0}
          userVote={userVote}
          isAuthenticated={isAuthenticated}
          size="small"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <MarkdownContent content={answer.content} />

        {/* Author Info */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
          <UserAvatar
            user={{
              id: author?.id || answer.id,
              full_name: author?.full_name,
              email: author?.email,
              avatar_url: author?.avatar_url,
              avatar_seed: author?.avatar_seed,
            }}
            size="sm"
          />
          <span className="text-slate-700">
            {author?.full_name || author?.email?.split('@')[0] || 'Anonymous'}
          </span>
          {(answer.is_staff_reply ||
            (author?.role && ['admin', 'staff'].includes(author.role))) && (
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
