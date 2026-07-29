'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'
import { rateLimitAction } from '@/lib/rate-limit'
import { requireAdmin, requireAdminOrStaff } from '@/lib/auth'
import { isUuid } from '@/lib/uuid'

const validStatuses = ['published', 'flagged', 'hidden', 'pending'] as const
type ReviewStatus = (typeof validStatuses)[number]

async function revalidateProductPageById(productId: string) {
  const { data: product, error } = await supabaseAdmin
    .from('products')
    .select('slug')
    .eq('id', productId)
    .maybeSingle()
  if (error) {
    console.error('Failed to load product slug for revalidation:', error)
    return
  }
  if (product?.slug) {
    revalidatePath(`/shop/${product.slug}`)
  }
}

export async function updateReviewStatus(
  reviewId: string,
  status: string,
  reason?: string | null,
): Promise<{ error: string | null }> {
  const id = reviewId.trim()
  if (!isUuid(id)) return { error: 'Invalid review' }

  if (!validStatuses.includes(status as ReviewStatus)) {
    return { error: 'Invalid status' }
  }

  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const rateLimitResult = await rateLimitAction(user.id, 'adminMutation')
  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error || 'Rate limited' }
  }

  const { data: review, error: reviewError } = await supabaseAdmin
    .from('product_reviews')
    .select('status, product_id, author_id')
    .eq('id', id)
    .maybeSingle()

  if (reviewError) {
    console.error('Error fetching review:', reviewError)
    return { error: reviewError.message }
  }

  if (!review) {
    return { error: 'Review not found' }
  }

  const oldStatus = review.status || 'unknown'
  const nextStatus = status as ReviewStatus
  const nowIso = new Date().toISOString()

  const updates: Record<string, unknown> = { status: nextStatus }

  if (nextStatus === 'hidden') {
    updates.moderated_at = nowIso
    updates.moderated_by = user.id
    updates.moderation_reason = (reason || '').trim() || 'Hidden by moderator'
  }

  if (nextStatus === 'published') {
    updates.moderated_at = nowIso
    updates.moderated_by = user.id
    updates.moderation_reason = null
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('product_reviews')
    .update(updates)
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (updateError) {
    console.error('Error updating review status:', updateError)
    return { error: updateError.message }
  }

  if (!updated) {
    return { error: 'Review not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'review.status_changed',
    resourceType: 'review',
    resourceId: id,
    details: {
      oldStatus,
      newStatus: nextStatus,
      productId: review.product_id,
      authorId: review.author_id,
      reason: nextStatus === 'hidden' ? reason || null : null,
    },
  })

  revalidatePath('/admin/reviews')
  await revalidateProductPageById(review.product_id)

  return { error: null }
}

export async function deleteReview(
  reviewId: string,
): Promise<{ error: string | null }> {
  const id = reviewId.trim()
  if (!isUuid(id)) return { error: 'Invalid review' }

  const supabase = await createClient()
  const guard = await requireAdmin(supabase)
  if (!guard.ok) {
    return {
      error: guard.user ? 'Only admins can delete reviews' : guard.error,
    }
  }
  const user = guard.user

  const rateLimitResult = await rateLimitAction(user.id, 'adminMutation')
  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error || 'Rate limited' }
  }

  const { data: review, error: reviewError } = await supabaseAdmin
    .from('product_reviews')
    .select('product_id, author_id, rating')
    .eq('id', id)
    .maybeSingle()

  if (reviewError) {
    console.error('Error fetching review:', reviewError)
    return { error: reviewError.message }
  }

  if (!review) {
    return { error: 'Review not found' }
  }

  const { data: deleted, error: deleteError } = await supabaseAdmin
    .from('product_reviews')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (deleteError) {
    console.error('Error deleting review:', deleteError)
    return { error: deleteError.message }
  }

  if (!deleted) {
    return { error: 'Review not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'review.deleted',
    resourceType: 'review',
    resourceId: id,
    details: {
      productId: review.product_id,
      authorId: review.author_id,
      rating: review.rating,
    },
  })

  revalidatePath('/admin/reviews')
  await revalidateProductPageById(review.product_id)

  return { error: null }
}
