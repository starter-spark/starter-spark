import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { UrlPagination } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MessageSquare, Eye, ThumbsUp, AlertTriangle } from 'lucide-react'
import { CommunityActions } from './CommunityActions'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

export const metadata = {
  title: 'Community | Admin',
}

const ITEMS_PER_PAGE = 50

interface SearchParams {
  status?: string
  page?: string
}

async function getPosts(status?: string, page: number = 1) {
  const supabase = await createClient()

  // Build count query
  let countQuery = supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
  if (status && status !== 'all') {
    countQuery = countQuery.eq('status', status)
  }
  const { count } = await countQuery
  const totalCount = count || 0

  // Build data query
  let query = supabase
    .from('posts')
    .select(
      `
      *,
      profiles(id, email, full_name, avatar_url, avatar_seed),
      products(name)
    `,
    )
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const offset = (page - 1) * ITEMS_PER_PAGE
  const { data, error } = await query.range(offset, offset + ITEMS_PER_PAGE - 1)

  if (error) {
    console.error('Error fetching posts:', error)
    return { data: [], totalCount: 0 }
  }

  return { data: data || [], totalCount }
}

async function getPostStats() {
  const supabase = await createClient()

  const [totalResult, unansweredResult, flaggedResult] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unanswered'),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'flagged'),
  ])

  return {
    total: totalResult.count || 0,
    unanswered: unansweredResult.count || 0,
    flagged: flaggedResult.count || 0,
  }
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: MaybePromise<SearchParams>
}) {
  const params = await resolveParams(searchParams)
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const [{ data: posts, totalCount }, stats] = await Promise.all([
    getPosts(params.status, currentPage),
    getPostStats(),
  ])
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'Unanswered', value: 'unanswered' },
    { label: 'Solved', value: 'solved' },
    { label: 'Flagged', value: 'flagged' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          Community
        </h1>
        <p className="text-slate-600">
          Moderate posts and community discussions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Total Posts</p>
          <p className="font-mono text-2xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Unanswered</p>
          <p className="font-mono text-2xl font-bold text-amber-600">
            {stats.unanswered}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Flagged</p>
          <p className="font-mono text-2xl font-bold text-red-600">
            {stats.flagged}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((filter) => {
          const href =
            filter.value === 'all'
              ? '/admin/community'
              : `/admin/community?status=${filter.value}`
          const selected =
            params.status === filter.value ||
            (!params.status && filter.value === 'all')
          return (
            <Button
              key={filter.value}
              asChild
              variant={selected ? 'default' : 'outline'}
              size="sm"
              className={selected ? 'bg-cyan-700 hover:bg-cyan-600' : ''}
            >
              <Link href={href}>
                {filter.label}
                {filter.value === 'flagged' && stats.flagged > 0 && (
                  <span className="ml-1 rounded-full bg-red-500 px-1.5 text-xs text-white">
                    {stats.flagged}
                  </span>
                )}
              </Link>
            </Button>
          )
        })}
      </div>

      {/* Posts Table */}
      {posts.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-600">No posts found.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => {
                const author = post.profiles as unknown as {
                  id: string
                  email: string
                  full_name: string | null
                  avatar_url: string | null
                  avatar_seed: string | null
                } | null
                const product = post.products as unknown as {
                  name: string
                } | null

                return (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="truncate font-medium text-slate-900">
                          {post.title}
                        </p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {post.tags.slice(0, 2).map((tag: string) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                        <span className="text-sm text-slate-600">
                          {author?.full_name || author?.email || 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {product?.name || 'General'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {post.upvotes}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          post.status === 'published'
                            ? 'border-green-300 text-green-700'
                            : post.status === 'flagged'
                              ? 'border-red-300 text-red-700'
                              : 'border-amber-300 text-amber-700'
                        }
                      >
                        {post.status === 'flagged' && (
                          <AlertTriangle className="mr-1 h-3 w-3" />
                        )}
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <CommunityActions postId={post.id} status={post.status} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200">
              <UrlPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                baseUrl={`/admin/community${params.status && params.status !== 'all' ? `?status=${params.status}` : ''}`}
                showItemCount
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
