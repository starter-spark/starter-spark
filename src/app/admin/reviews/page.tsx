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
import { MessageSquareText } from 'lucide-react'
import { resolveParams, type MaybePromise } from '@/lib/next-params'
import { ReviewActions } from './ReviewActions'
import { StarRating } from '@/features/reviews/components/StarRating'
import type { Database } from '@/lib/supabase/database.types'

export const metadata = {
  title: 'Reviews | Admin',
}

const ITEMS_PER_PAGE = 50

interface SearchParams {
  status?: string
  page?: string
}

type ReviewStatus = Database['public']['Enums']['product_review_status']
const REVIEW_STATUS_FILTERS: readonly ReviewStatus[] = [
  'published',
  'pending',
  'flagged',
  'hidden',
]

function parseReviewStatus(value?: string): ReviewStatus | undefined {
  if (!value || value === 'all') return undefined
  if (REVIEW_STATUS_FILTERS.includes(value as ReviewStatus))
    return value as ReviewStatus
  return undefined
}

async function getReviews(status?: ReviewStatus, page: number = 1) {
  const supabase = await createClient()

  let countQuery = supabase
    .from('product_reviews')
    .select('id', { count: 'exact', head: true })

  if (status) {
    countQuery = countQuery.eq('status', status)
  }

  const { count } = await countQuery
  const totalCount = count || 0

  let query = supabase
    .from('product_reviews')
    .select(
      `
      id,
      product_id,
      author_id,
      rating,
      title,
      body,
      status,
      created_at,
      edited_at,
      author:profiles!product_reviews_author_id_fkey(id, email, full_name, avatar_url, avatar_seed),
      products(name, slug)
    `,
    )
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const offset = (page - 1) * ITEMS_PER_PAGE
  const { data, error } = await query.range(offset, offset + ITEMS_PER_PAGE - 1)

  if (error) {
    console.error('Error fetching reviews:', error)
    return { data: [], totalCount: 0 }
  }

  return { data: data || [], totalCount }
}

async function getReviewStats() {
  const supabase = await createClient()

  const [total, flagged, pending] = await Promise.all([
    supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'flagged'),
    supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  return {
    total: total.count || 0,
    flagged: flagged.count || 0,
    pending: pending.count || 0,
  }
}

export default async function ReviewsAdminPage({
  searchParams,
}: {
  searchParams: MaybePromise<SearchParams>
}) {
  const params = await resolveParams(searchParams)
  const statusFilter = parseReviewStatus(params.status)
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const [{ data: reviews, totalCount }, stats] = await Promise.all([
    getReviews(statusFilter, currentPage),
    getReviewStats(),
  ])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Pending', value: 'pending' },
    { label: 'Reported', value: 'flagged' },
    { label: 'Hidden', value: 'hidden' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">Reviews</h1>
        <p className="text-slate-600">Moderate product reviews and reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Total Reviews</p>
          <p className="font-mono text-2xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Reported</p>
          <p className="font-mono text-2xl font-bold text-amber-600">
            {stats.flagged}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Pending</p>
          <p className="font-mono text-2xl font-bold text-cyan-700">
            {stats.pending}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((filter) => {
          const href =
            filter.value === 'all'
              ? '/admin/reviews'
              : `/admin/reviews?status=${filter.value}`
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
                  <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-xs text-white">
                    {stats.flagged}
                  </span>
                )}
              </Link>
            </Button>
          )
        })}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <MessageSquareText className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-600">No reviews found.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="hidden lg:table-cell">Review</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => {
                const author = (review as unknown as { author?: unknown })
                  .author as {
                  id: string
                  email: string | null
                  full_name: string | null
                  avatar_url: string | null
                  avatar_seed: string | null
                } | null
                const product = review.products as unknown as {
                  name: string
                  slug: string
                } | null

                const status = String(review.status || 'unknown')

                return (
                  <TableRow key={review.id}>
                    <TableCell className="max-w-[240px] lg:max-w-[180px]">
                      {product?.slug ? (
                        <Link
                          href={`/shop/${product.slug}`}
                          className="block truncate font-medium text-slate-900 transition-colors hover:text-cyan-700"
                        >
                          {product.name || product.slug}
                        </Link>
                      ) : (
                        <span className="text-slate-600">Unknown</span>
                      )}
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2 whitespace-normal lg:hidden">
                        {review.title ? `${review.title} — ` : ''}
                        {review.body}
                      </p>
                    </TableCell>
                    <TableCell>
                      {author ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar user={author} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm text-slate-900">
                              {author.full_name || author.email || 'User'}
                            </p>
                            {author.email && (
                              <p className="truncate text-xs text-slate-500">
                                {author.email}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StarRating value={review.rating} size="sm" />
                        <span className="font-mono text-xs text-slate-600">
                          {review.rating}/5
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[340px]">
                      <p className="truncate text-sm text-slate-700">
                        {review.title ? `${review.title} — ` : ''}
                        {review.body}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          status === 'published'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : status === 'pending'
                              ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                              : status === 'flagged'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : status === 'hidden'
                                  ? 'border-slate-200 bg-slate-50 text-slate-600'
                                  : 'border-slate-200 bg-white text-slate-600'
                        }
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500 whitespace-nowrap">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <ReviewActions reviewId={review.id} status={status} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200">
              <UrlPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                baseUrl="/admin/reviews"
                showItemCount
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
