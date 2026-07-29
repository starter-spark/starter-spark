import type { Database } from '@/lib/supabase/database.types'

export type ProductReviewStatus =
  Database['public']['Enums']['product_review_status']
export type ProductReviewRow =
  Database['public']['Tables']['product_reviews']['Row']
export type ProductReviewReportRow =
  Database['public']['Tables']['product_review_reports']['Row']

export type ReviewAuthor = {
  full_name: string | null
  avatar_url: string | null
  avatar_seed: string | null
} | null

export type ReviewListItem = Pick<
  ProductReviewRow,
  | 'id'
  | 'author_id'
  | 'rating'
  | 'title'
  | 'body'
  | 'created_at'
  | 'edited_at'
  | 'incentive_disclosure'
  | 'is_verified_purchase'
  | 'status'
> & {
  author: ReviewAuthor
}

export type UserReview = Pick<
  ProductReviewRow,
  | 'id'
  | 'rating'
  | 'title'
  | 'body'
  | 'status'
  | 'created_at'
  | 'edited_at'
  | 'incentive_disclosure'
  | 'is_verified_purchase'
>

export type ReviewSummary = {
  total: number
  average: number
  byStar: Record<1 | 2 | 3 | 4 | 5, number>
  verifiedCount: number
}
