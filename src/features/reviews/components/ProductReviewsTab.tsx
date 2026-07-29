'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, Flag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn, formatRelativeTime } from '@/lib/utils'
import { computeReviewSummary } from '@/features/reviews/summary'
import type { ReviewListItem, UserReview } from '@/features/reviews/types'
import {
  deleteProductReview,
  reportProductReview,
  upsertProductReview,
} from '../actions'
import { StarRating } from './StarRating'
import { StarRatingInput } from './StarRatingInput'

type SortMode = 'newest' | 'highest' | 'lowest'

export function ProductReviewsTab({
  productId,
  productSlug,
  reviews,
  isAuthenticated,
  viewerUserId,
  canReview,
  userReview,
}: {
  productId: string
  productSlug: string
  reviews: ReviewListItem[]
  isAuthenticated: boolean
  viewerUserId: string | null
  canReview: boolean
  userReview: UserReview | null
}) {
  const router = useRouter()
  const summary = useMemo(() => computeReviewSummary(reviews), [reviews])

  const [sort, setSort] = useState<SortMode>('newest')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(
    null,
  )
  const [isReporting, startReportTransition] = useTransition()

  const filteredSorted = useMemo(() => {
    const deduped = new Map<string, ReviewListItem>()
    for (const r of reviews) deduped.set(r.id, r)

    let list = Array.from(deduped.values())
    if (verifiedOnly) list = list.filter((r) => r.is_verified_purchase)

    list.sort((a, b) => {
      const aTs = new Date(a.created_at).getTime()
      const bTs = new Date(b.created_at).getTime()

      if (sort === 'newest') return bTs - aTs
      if (sort === 'highest')
        return b.rating !== a.rating ? b.rating - a.rating : bTs - aTs
      return a.rating !== b.rating ? a.rating - b.rating : bTs - aTs
    })

    return list
  }, [reviews, verifiedOnly, sort])

  const openReport = (reviewId: string) => {
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(`/shop/${productSlug}#reviews`)
      router.push(`/login?redirect=${redirect}`)
      return
    }
    setReportingReviewId(reviewId)
    setReportReason('')
    setReportDialogOpen(true)
  }

  const onReport = () => {
    if (!reportingReviewId) return
    setReportDialogOpen(false)

    startReportTransition(async () => {
      const result = await reportProductReview({
        reviewId: reportingReviewId,
        productSlug,
        reason: reportReason,
      })
      if (!result.success) {
        toast.error('Failed to report review', { description: result.error })
        return
      }
      toast.success('Reported', { description: result.message })
      router.refresh()
    })
  }

  return (
    <section id="reviews" className="space-y-8">
      {/* Summary */}
      <div className="bg-white border border-slate-200 rounded p-6">
        <div className="flex flex-col md:flex-row gap-8 md:items-center">
          <div className="min-w-[180px]">
            <p className="text-sm text-slate-600">Average rating</p>
            <div className="mt-1 flex items-center gap-3">
              <p className="font-mono text-3xl font-bold text-slate-900">
                {summary.average.toFixed(1)}
              </p>
              <StarRating value={summary.average} />
            </div>
            <p className="text-sm text-slate-600 mt-2">
              {summary.total} review{summary.total === 1 ? '' : 's'}
              {summary.verifiedCount > 0
                ? ` • ${summary.verifiedCount} verified`
                : ''}
            </p>
          </div>

          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.byStar[star as 1 | 2 | 3 | 4 | 5]
              const pct = summary.total > 0 ? (count / summary.total) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-12 text-sm text-slate-600">{star}★</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-slate-600">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="reviews-sort" className="text-sm text-slate-600">
              Sort
            </Label>
            <select
              id="reviews-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="h-9 rounded border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-700/20"
            >
              <option value="newest">Newest</option>
              <option value="highest">Highest</option>
              <option value="lowest">Lowest</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
            Verified purchases only
          </label>
        </div>
      </div>

      {/* Composer / Gate */}
      <ReviewComposer
        key={userReview?.id ?? 'new'}
        productId={productId}
        productSlug={productSlug}
        isAuthenticated={isAuthenticated}
        canReview={canReview}
        userReview={userReview}
      />

      {/* Reviews list */}
      <div className="space-y-4">
        <h3 className="font-mono text-lg font-semibold text-slate-900">
          Customer Reviews
        </h3>

        {filteredSorted.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded p-8 text-center">
            <AlertTriangle
              className="mx-auto h-10 w-10 text-slate-300"
              aria-hidden="true"
            />
            <p className="mt-3 text-slate-700">No reviews yet.</p>
            <p className="text-sm text-slate-600 mt-1">
              Be the first to share your experience.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredSorted.map((review) => {
              const authorName =
                review.author?.full_name?.trim() || 'StarterSpark User'
              const isOwn = viewerUserId && review.author_id === viewerUserId

              return (
                <li
                  key={review.id}
                  className="bg-white border border-slate-200 rounded p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <StarRating value={review.rating} />
                        {review.is_verified_purchase && (
                          <Badge
                            variant="outline"
                            className="font-mono text-xs border-green-200 text-green-700 bg-green-50"
                          >
                            Verified purchase
                          </Badge>
                        )}
                        {review.status === 'flagged' && (
                          <Badge
                            variant="outline"
                            className="font-mono text-xs border-amber-200 text-amber-700 bg-amber-50"
                          >
                            Reported
                          </Badge>
                        )}
                        {review.incentive_disclosure && (
                          <Badge
                            variant="outline"
                            className="font-mono text-xs border-slate-200 text-slate-600 bg-slate-50"
                          >
                            Incentivized
                          </Badge>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        <span className="text-slate-900 font-medium">
                          {authorName}
                        </span>
                        {' • '}
                        <span>
                          {review.created_at
                            ? formatRelativeTime(review.created_at)
                            : '—'}
                        </span>
                        {review.edited_at && (
                          <span className="text-slate-500"> • Edited</span>
                        )}
                      </p>

                      {review.title && (
                        <p className="mt-3 font-medium text-slate-900 break-words">
                          {review.title}
                        </p>
                      )}
                      <p className="mt-2 text-slate-700 whitespace-pre-wrap break-words">
                        {review.body}
                      </p>

                      {review.incentive_disclosure && (
                        <p className="mt-3 text-sm text-slate-600 break-words">
                          <span className="font-medium">Disclosure:</span>{' '}
                          {review.incentive_disclosure}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-slate-600 hover:text-slate-900"
                        onClick={() => openReport(review.id)}
                        disabled={isOwn || isReporting}
                        title={
                          isOwn
                            ? 'You cannot report your own review'
                            : undefined
                        }
                      >
                        <Flag className="h-4 w-4 mr-2" aria-hidden="true" />
                        Report
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Report dialog */}
      <AlertDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report this review?</AlertDialogTitle>
            <AlertDialogDescription>
              Reports are reviewed by moderators. Please only report content
              that violates our Terms (spam, harassment, personal info, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4">
            <Label
              htmlFor="review-report-reason"
              className="text-sm text-slate-700"
            >
              Optional details
            </Label>
            <Textarea
              id="review-report-reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-2 min-h-[90px] bg-white border-slate-200"
              placeholder="Tell us what’s wrong with this review…"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onReport}
              className="bg-red-600 hover:bg-red-700"
            >
              Report review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function ReviewComposer({
  productId,
  productSlug,
  isAuthenticated,
  canReview,
  userReview,
}: {
  productId: string
  productSlug: string
  isAuthenticated: boolean
  canReview: boolean
  userReview: UserReview | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [rating, setRating] = useState<number>(userReview?.rating ?? 0)
  const [title, setTitle] = useState<string>(userReview?.title ?? '')
  const [body, setBody] = useState<string>(userReview?.body ?? '')
  const [hasIncentive, setHasIncentive] = useState<boolean>(
    Boolean(userReview?.incentive_disclosure),
  )
  const [incentiveDisclosure, setIncentiveDisclosure] = useState<string>(
    userReview?.incentive_disclosure ?? '',
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`/shop/${productSlug}#reviews`)
    return (
      <div className="bg-slate-50 border border-slate-200 rounded p-6">
        <p className="text-slate-700">Sign in to write a review.</p>
        <Button asChild className="mt-4 bg-cyan-700 hover:bg-cyan-600">
          <Link href={`/login?redirect=${redirect}`}>Sign in</Link>
        </Button>
      </div>
    )
  }

  if (!canReview) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded p-6">
        <p className="text-slate-700">
          Only verified purchasers can leave a review for this product.
        </p>
        <p className="text-sm text-slate-600 mt-2">
          If you already purchased a kit, make sure you’ve claimed it in your
          Workshop.
        </p>
        <Button asChild variant="outline" className="mt-4 border-slate-200">
          <Link href="/workshop">Go to Workshop</Link>
        </Button>
      </div>
    )
  }

  const onSubmit = () => {
    setFormError(null)
    startTransition(async () => {
      const result = await upsertProductReview({
        productId,
        productSlug,
        rating,
        title,
        body,
        incentiveDisclosure: hasIncentive ? incentiveDisclosure : null,
      })

      if (!result.success) {
        setFormError(result.error)
        if (result.requiresAuth) {
          toast.error('Sign in required', { description: result.error })
        }
        return
      }

      toast.success('Review saved')
      router.refresh()
    })
  }

  const onDelete = () => {
    if (!userReview) return
    setFormError(null)
    setDeleteDialogOpen(false)
    startTransition(async () => {
      const result = await deleteProductReview({
        reviewId: userReview.id,
        productSlug,
      })
      if (!result.success) {
        setFormError(result.error)
        return
      }
      toast.success('Review deleted')
      router.refresh()
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-mono text-lg font-semibold text-slate-900">
            {userReview ? 'Your Review' : 'Write a Review'}
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Please don’t include personal contact info (email/phone).
          </p>
        </div>

        {userReview && (
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={cn(
                'font-mono text-xs',
                userReview.status === 'published'
                  ? 'border-green-200 text-green-700 bg-green-50'
                  : userReview.status === 'pending'
                    ? 'border-amber-200 text-amber-700 bg-amber-50'
                    : 'border-slate-200 text-slate-600 bg-slate-50',
              )}
            >
              {userReview.status === 'published'
                ? 'Published'
                : userReview.status === 'pending'
                  ? 'Pending review'
                  : userReview.status === 'flagged'
                    ? 'Reported'
                    : 'Hidden'}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-700 hover:text-red-700 hover:border-red-300"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <Label className="text-sm text-slate-700">Rating</Label>
          <div className="mt-2">
            <StarRatingInput
              value={rating}
              onValueChange={setRating}
              disabled={isPending}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="review-title" className="text-sm text-slate-700">
            Title <span className="text-slate-400">(optional)</span>
          </Label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            className="mt-2 bg-white border-slate-200"
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="review-body" className="text-sm text-slate-700">
            Review
          </Label>
          <Textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you like? What could be improved?"
            className="mt-2 min-h-[120px] bg-white border-slate-200"
            disabled={isPending}
          />
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="review-incentive"
            checked={hasIncentive}
            onCheckedChange={(v) => setHasIncentive(v === true)}
            disabled={isPending}
          />
          <div className="min-w-0">
            <Label
              htmlFor="review-incentive"
              className="text-sm text-slate-700"
            >
              I received this product for free or at a discount
            </Label>
            <p className="text-xs text-slate-500 mt-1">
              If applicable, include details to help readers evaluate your
              review.
            </p>
          </div>
        </div>

        {hasIncentive && (
          <div>
            <Label
              htmlFor="review-disclosure"
              className="text-sm text-slate-700"
            >
              Disclosure <span className="text-slate-400">(optional)</span>
            </Label>
            <Input
              id="review-disclosure"
              value={incentiveDisclosure}
              onChange={(e) => setIncentiveDisclosure(e.target.value)}
              placeholder="e.g. “StarterSpark sent me this kit for review.”"
              className="mt-2 bg-white border-slate-200"
              disabled={isPending}
            />
          </div>
        )}

        {formError && (
          <p className="text-sm text-red-700" role="alert" aria-live="polite">
            {formError}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Button
            onClick={onSubmit}
            className="bg-cyan-700 hover:bg-cyan-600"
            disabled={isPending}
          >
            {isPending
              ? 'Saving…'
              : userReview
                ? 'Save changes'
                : 'Submit review'}
          </Button>
          <p className="text-xs text-slate-500">
            By submitting, you agree your review is honest and follows our
            Terms.
          </p>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your review from this product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
