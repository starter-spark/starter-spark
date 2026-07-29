'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimitAction } from '@/lib/rate-limit'
import { isUuid } from '@/lib/uuid'
import { REVIEW_REPORT_REASON_MAX } from './constants'
import { validateReviewInput } from './validation'

async function autoClaimPendingPurchaseLicense(options: {
  userId: string
  userEmail: string
  productId: string
}): Promise<boolean> {
  const emailRaw = options.userEmail.trim()
  if (!emailRaw) return false

  const emailCandidates = Array.from(
    new Set([emailRaw, emailRaw.toLowerCase()]),
  )

  for (const email of emailCandidates) {
    const { data: pendingLicense, error: pendingError } = await supabaseAdmin
      .from('licenses')
      .select('id')
      .eq('product_id', options.productId)
      .eq('source', 'online_purchase')
      .eq('status', 'pending')
      .is('owner_id', null)
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pendingError) {
      console.error('Failed to check pending purchase license:', pendingError)
      continue
    }

    if (!pendingLicense) continue

    const { data: claimed, error: claimError } = await supabaseAdmin
      .from('licenses')
      .update({
        status: 'claimed',
        owner_id: options.userId,
        claimed_at: new Date().toISOString(),
        claim_token: null,
      })
      .eq('id', pendingLicense.id)
      .eq('status', 'pending')
      .is('owner_id', null)
      .select('id')
      .maybeSingle()

    if (claimError) {
      console.error('Failed to auto-claim purchase license:', claimError)
      continue
    }

    if (claimed) return true
  }

  return false
}

export async function upsertProductReview(input: {
  productId: string
  productSlug: string
  rating: number
  title: string
  body: string
  incentiveDisclosure?: string | null
}): Promise<
  | { success: true; reviewId: string }
  | { success: false; error: string; requiresAuth?: boolean }
> {
  const productId = input.productId.trim()
  if (!isUuid(productId)) {
    return { success: false, error: 'Invalid product.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'You must be signed in to leave a review.',
      requiresAuth: true,
    }
  }

  const rateLimitResult = await rateLimitAction(user.id, 'productReview')
  if (!rateLimitResult.success) {
    return {
      success: false,
      error:
        rateLimitResult.error || 'Too many requests. Please try again later.',
    }
  }

  const validated = validateReviewInput({
    rating: input.rating,
    title: input.title,
    body: input.body,
    incentiveDisclosure: input.incentiveDisclosure,
  })
  if (!validated.ok) {
    return { success: false, error: validated.error }
  }

  const { data: ownsProduct, error: ownsError } = await supabase.rpc(
    'user_owns_product',
    { p_product_id: productId },
  )
  if (ownsError) {
    console.error('user_owns_product RPC failed:', ownsError)
    return { success: false, error: 'Unable to verify purchase.' }
  }

  let verifiedPurchase = ownsProduct === true

  if (!verifiedPurchase && user.email) {
    const claimed = await autoClaimPendingPurchaseLicense({
      userId: user.id,
      userEmail: user.email,
      productId,
    })

    if (claimed) {
      const { data: ownsAfter } = await supabase.rpc('user_owns_product', {
        p_product_id: productId,
      })
      verifiedPurchase = ownsAfter === true
    }
  }

  if (!verifiedPurchase) {
    return {
      success: false,
      error: 'Only verified purchasers can leave a review for this product.',
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from('product_reviews')
    .select('id, status')
    .eq('product_id', productId)
    .eq('author_id', user.id)
    .maybeSingle()

  if (existingError) {
    console.error('Failed to check existing review:', existingError)
    return { success: false, error: 'Failed to load your review.' }
  }

  const nowIso = new Date().toISOString()

  let nextStatus: 'published' | 'pending' = 'published'
  if (existing?.status === 'pending') nextStatus = 'pending'
  if (existing?.status === 'hidden' || existing?.status === 'flagged') {
    nextStatus = 'pending'
  }

  const upsertData = {
    product_id: productId,
    author_id: user.id,
    rating: validated.value.rating,
    title: validated.value.title,
    body: validated.value.body,
    incentive_disclosure: validated.value.incentiveDisclosure,
    is_verified_purchase: true,
    status: nextStatus,
    ...(existing ? { edited_at: nowIso } : {}),
  }

  const { data: saved, error: saveError } = await supabase
    .from('product_reviews')
    .upsert(upsertData, { onConflict: 'product_id,author_id' })
    .select('id')
    .maybeSingle()

  if (saveError) {
    console.error('Failed to save review:', saveError)
    return { success: false, error: 'Failed to save your review.' }
  }

  if (!saved) {
    return { success: false, error: 'Failed to save your review.' }
  }

  const slug = input.productSlug.trim()
  if (slug) {
    revalidatePath(`/shop/${slug}`)
  }

  return { success: true, reviewId: saved.id }
}

export async function deleteProductReview(input: {
  reviewId: string
  productSlug: string
}): Promise<
  { success: true } | { success: false; error: string; requiresAuth?: boolean }
> {
  const reviewId = input.reviewId.trim()
  if (!isUuid(reviewId)) {
    return { success: false, error: 'Invalid review.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'You must be signed in to delete your review.',
      requiresAuth: true,
    }
  }

  const rateLimitResult = await rateLimitAction(user.id, 'productReview')
  if (!rateLimitResult.success) {
    return {
      success: false,
      error:
        rateLimitResult.error || 'Too many requests. Please try again later.',
    }
  }

  const { data: deleted, error: deleteError } = await supabase
    .from('product_reviews')
    .delete()
    .eq('id', reviewId)
    .select('id')
    .maybeSingle()

  if (deleteError) {
    console.error('Failed to delete review:', deleteError)
    return { success: false, error: 'Failed to delete your review.' }
  }

  if (!deleted) {
    return { success: false, error: 'Review not found.' }
  }

  const slug = input.productSlug.trim()
  if (slug) {
    revalidatePath(`/shop/${slug}`)
  }

  return { success: true }
}

export async function reportProductReview(input: {
  reviewId: string
  productSlug: string
  reason?: string
}): Promise<
  | { success: true; message: string }
  | { success: false; error: string; requiresAuth?: boolean }
> {
  const reviewId = input.reviewId.trim()
  if (!isUuid(reviewId)) {
    return { success: false, error: 'Invalid review.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'You must be signed in to report reviews.',
      requiresAuth: true,
    }
  }

  const rateLimitResult = await rateLimitAction(user.id, 'productReviewReport')
  if (!rateLimitResult.success) {
    return {
      success: false,
      error:
        rateLimitResult.error || 'Too many requests. Please try again later.',
    }
  }

  const reasonRaw = (input.reason || '').trim()
  const reason = reasonRaw.length > 0 ? reasonRaw : null
  if (reason && reason.length > REVIEW_REPORT_REASON_MAX) {
    return {
      success: false,
      error: `Reason must be ${String(REVIEW_REPORT_REASON_MAX)} characters or fewer.`,
    }
  }

  const { error: reportError } = await supabase
    .from('product_review_reports')
    .insert({
      review_id: reviewId,
      reporter_id: user.id,
      reason,
    })

  if (reportError) {
    if (reportError.code === '23505') {
      return {
        success: true,
        message: "Thanks — you've already reported this review.",
      }
    }
    console.error('Failed to report review:', reportError)
    return { success: false, error: 'Failed to report review.' }
  }

  // Flag the review for moderation (does not hide it from the public).
  const { error: flagError } = await supabaseAdmin
    .from('product_reviews')
    .update({ status: 'flagged' })
    .eq('id', reviewId)
    .in('status', ['published'])

  if (flagError) {
    console.error('Failed to flag review:', flagError)
  }

  const slug = input.productSlug.trim()
  if (slug) {
    revalidatePath(`/shop/${slug}`)
  }

  return {
    success: true,
    message: 'Review reported for moderator review. Thanks.',
  }
}
