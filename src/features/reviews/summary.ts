import type { ReviewListItem, ReviewSummary } from './types'

export function computeReviewSummary(
  reviews: readonly ReviewListItem[],
): ReviewSummary {
  const byStar: ReviewSummary['byStar'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0
  let verifiedCount = 0

  for (const r of reviews) {
    const rating = Math.max(1, Math.min(5, Math.round(r.rating)))
    byStar[rating as 1 | 2 | 3 | 4 | 5] += 1
    sum += rating
    if (r.is_verified_purchase) verifiedCount += 1
  }

  const total = reviews.length
  const average = total > 0 ? sum / total : 0

  return { total, average, byStar, verifiedCount }
}
