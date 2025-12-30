'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Circle,
  MessageSquare,
  Plus,
  Eye,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface Post {
  id: string
  slug: string | null
  title: string
  status: string | null
  tags: string[] | null
  upvotes: number | null
  view_count: number | null
  created_at: string
  author: {
    id: string
    full_name: string | null
    email: string
    role: string | null
    avatar_url: string | null
    avatar_seed: string | null
  } | null
  product: { id: string; name: string; slug: string } | null
  comments: { id: string }[]
}

interface PostsListProps {
  initialPosts: Post[]
  totalCount: number
  itemsPerPage: number
  emptyMessage: string
  statusFilter?: string
  tagFilter?: string
  productFilter?: string
  searchQuery?: string
}

export function PostsList({
  initialPosts,
  totalCount: initialTotalCount,
  itemsPerPage,
  emptyMessage,
  statusFilter,
  tagFilter,
  productFilter,
  searchQuery,
}: PostsListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const fetchPage = (page: number) => {
    startTransition(async () => {
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(itemsPerPage))
        if (statusFilter) params.set('status', statusFilter)
        if (tagFilter) params.set('tag', tagFilter)
        if (productFilter) params.set('product', productFilter)
        if (searchQuery) params.set('q', searchQuery)

        const res = await fetch(`/api/community/posts?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch')

        const data = (await res.json()) as { posts: Post[]; totalCount: number }
        setPosts(data.posts)
        setTotalCount(data.totalCount)
        setCurrentPage(page)

        // Scroll to top of list smoothly
        document.getElementById('posts-list')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      } catch {
        // Error fetching posts - silently fail, user can retry
      }
    })
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      void fetchPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      void fetchPage(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    if (page !== currentPage) {
      void fetchPage(page)
    }
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showEllipsisThreshold = 7

    if (totalPages <= showEllipsisThreshold) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }

    return pages
  }

  if (posts.length === 0 && !isPending) {
    return (
      <div className="bg-white border border-slate-200 rounded p-12 text-center">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="font-mono text-lg font-semibold text-slate-900 mb-2">
          No questions yet
        </p>
        <p className="text-slate-600 mb-6">{emptyMessage}</p>
        <Button
          asChild
          className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
        >
          <Link href="/community/new">
            <Plus className="w-4 h-4 mr-2" />
            Ask a Question
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div id="posts-list">
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500 font-mono">
          {totalCount} question{totalCount !== 1 ? 's' : ''}
          {isPending && (
            <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin" />
          )}
        </p>
      </div>

      {/* Questions */}
      <div
        className={cn(
          'space-y-4 transition-opacity duration-200',
          isPending && 'opacity-60',
        )}
      >
        {posts.map((post) => {
          const author = post.author
          const commentCount = post.comments?.length || 0

          return (
            <Link key={post.id} href={`/community/${post.id}`} className="block">
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
                      <span className="font-mono text-sm">{commentCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Eye className="w-3 h-3" />
                      <span className="font-mono text-xs">{post.view_count}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      {/* Status Badge */}
                      {post.status === 'solved' ? (
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
                      <UserAvatar
                        user={{
                          id: author?.id || post.id,
                          full_name: author?.full_name,
                          email: author?.email,
                          avatar_url: author?.avatar_url,
                          avatar_seed: author?.avatar_seed,
                        }}
                        size="sm"
                      />
                      <span>
                        {author?.full_name ||
                          author?.email?.split('@')[0] ||
                          'Anonymous'}
                      </span>
                      {author?.role &&
                        ['admin', 'staff'].includes(author.role) && (
                          <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-mono rounded">
                            Staff
                          </span>
                        )}
                      <span className="text-slate-300">·</span>
                      <span>
                        {post.created_at && formatRelativeTime(post.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1 || isPending}
            className="h-9 w-9 p-0"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>

          {getPageNumbers().map((page, idx) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-slate-400 select-none"
              >
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageClick(page)}
                disabled={isPending}
                className={cn(
                  'h-9 w-9 p-0 font-mono',
                  currentPage === page && 'bg-cyan-700 hover:bg-cyan-600',
                )}
              >
                {page}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || isPending}
            className="h-9 w-9 p-0"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>

          <span className="ml-4 text-sm text-slate-500">
            {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
          </span>
        </div>
      )}
    </div>
  )
}
