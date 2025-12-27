import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse, after } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { checkKitClaimAchievements } from '@/lib/achievements'
import {
  isValidLicenseCodeFormat,
  normalizeLicenseCodeForLookup,
} from '@/lib/validation'

export async function POST(request: Request) {
  // Rate limit: 5 requests per minute
  const rateLimitResponse = await rateLimit(request, 'claimLicense')
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Get the user from the session
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to claim a kit' },
        { status: 401 },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      )
    }

    const code =
      typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>).code
        : undefined

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Please enter a valid kit code' },
        { status: 400 },
      )
    }

    const normalizedCode = normalizeLicenseCodeForLookup(code)
    if (!isValidLicenseCodeFormat(normalizedCode)) {
      return NextResponse.json(
        { error: 'Invalid code format' },
        { status: 400 },
      )
    }

    // Use atomic update with RETURNING to prevent race conditions
    // Only claim if status is 'pending' (license flow uses status column)
    const { data: claimedLicense, error: claimError } = await supabaseAdmin
      .from('licenses')
      .update({
        owner_id: user.id,
        claimed_at: new Date().toISOString(),
        claim_token: null, // Clear the claim token
        status: 'claimed',
      })
      .eq('code', normalizedCode)
      .eq('status', 'pending')
      .is('owner_id', null)
      .select('id, code, product:products(name)')
      .maybeSingle()

    if (claimError) {
      console.error('Error claiming license:', claimError)
      return NextResponse.json(
        { error: 'An error occurred. Please try again.' },
        { status: 500 },
      )
    }

    // No rows were updated (code doesn't exist or already claimed)
    if (!claimedLicense) {
      // Check if the code exists at all
      const { data: existingLicense, error: existingError } =
        await supabaseAdmin
          .from('licenses')
          .select('owner_id, status')
          .eq('code', normalizedCode)
          .maybeSingle()

      if (existingError) {
        console.error('Error fetching existing license:', existingError)
        return NextResponse.json(
          { error: 'An error occurred. Please try again.' },
          { status: 500 },
        )
      }

      if (!existingLicense) {
        return NextResponse.json(
          { error: 'Invalid kit code. Please check and try again.' },
          { status: 404 },
        )
      }

      // Code exists but is already claimed or has different status
      if (existingLicense.owner_id === user.id) {
        return NextResponse.json(
          { error: 'You have already claimed this kit.' },
          { status: 400 },
        )
      }

      if (
        existingLicense.status === 'claimed' ||
        existingLicense.status === 'claimed_by_other'
      ) {
        return NextResponse.json(
          { error: 'This kit code has already been claimed.' },
          { status: 400 },
        )
      }

      if (existingLicense.status === 'rejected') {
        return NextResponse.json(
          { error: 'This kit code has been rejected and cannot be claimed.' },
          { status: 400 },
        )
      }

      return NextResponse.json(
        { error: 'This kit code is not available for claiming.' },
        { status: 400 },
      )
    }

    const productName =
      (claimedLicense.product as unknown as { name: string } | null)?.name ||
      'Kit'

    // Check and award kit-related achievements (after response)
    after(async () => {
      try {
        await checkKitClaimAchievements(user.id)
      } catch (err) {
        console.error('Error checking kit achievements:', err)
      }
    })

    return NextResponse.json({
      message: `${productName} claimed successfully!`,
      license: {
        id: claimedLicense.id,
        code: claimedLicense.code,
      },
    })
  } catch (error) {
    console.error('Error in claim-license:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 },
    )
  }
}
