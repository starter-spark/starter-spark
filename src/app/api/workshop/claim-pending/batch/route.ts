import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { type NextRequest, NextResponse, after } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { checkKitClaimAchievements } from '@/lib/achievements'
import { isUuid } from '@/lib/uuid'

const MAX_BATCH_SIZE = 100

export async function POST(request: NextRequest) {
  // Rate limit: 3 batch requests per minute (stricter than individual)
  const rateLimitResponse = await rateLimit(request, 'claimLicenseBatch')
  if (rateLimitResponse) return rateLimitResponse

  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  // Parse request body
  let body: { licenseIds?: string[]; action?: string }
  try {
    body = (await request.json()) as { licenseIds?: string[]; action?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { licenseIds, action } = body

  if (!licenseIds || !Array.isArray(licenseIds) || licenseIds.length === 0) {
    return NextResponse.json(
      { error: 'License IDs array is required' },
      { status: 400 },
    )
  }

  if (licenseIds.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: `Maximum ${MAX_BATCH_SIZE} licenses per batch` },
      { status: 400 },
    )
  }

  // Validate all IDs are UUIDs
  if (!licenseIds.every((id) => typeof id === 'string' && isUuid(id))) {
    return NextResponse.json(
      { error: 'All license IDs must be valid UUIDs' },
      { status: 400 },
    )
  }

  if (action !== 'claim' && action !== 'reject') {
    return NextResponse.json(
      { error: "Action must be 'claim' or 'reject'" },
      { status: 400 },
    )
  }

  // Fetch all licenses in one query
  const { data: licenses, error: fetchError } = await supabaseAdmin
    .from('licenses')
    .select('id, status, customer_email, owner_id, product_id')
    .in('id', licenseIds)

  if (fetchError) {
    console.error('Failed to fetch licenses for batch:', fetchError)
    return NextResponse.json(
      { error: 'Failed to load licenses' },
      { status: 500 },
    )
  }

  // Process each license
  const results: { licenseId: string; success: boolean; error?: string }[] = []
  let successCount = 0
  let errorCount = 0

  for (const licenseId of licenseIds) {
    const license = licenses?.find((l) => l.id === licenseId)

    // Validate license
    if (!license) {
      results.push({ licenseId, success: false, error: 'License not found' })
      errorCount++
      continue
    }

    if (license.customer_email?.toLowerCase() !== user.email.toLowerCase()) {
      results.push({ licenseId, success: false, error: 'Permission denied' })
      errorCount++
      continue
    }

    if (license.status !== 'pending') {
      results.push({
        licenseId,
        success: false,
        error: 'License is no longer pending',
      })
      errorCount++
      continue
    }

    // Perform the action
    if (action === 'claim') {
      const { data: updatedLicense, error: updateError } = await supabaseAdmin
        .from('licenses')
        .update({
          status: 'claimed',
          owner_id: user.id,
          claimed_at: new Date().toISOString(),
          claim_token: null,
        })
        .eq('id', licenseId)
        .eq('status', 'pending')
        .is('owner_id', null)
        .select('id')
        .maybeSingle()

      if (updateError || !updatedLicense) {
        results.push({
          licenseId,
          success: false,
          error: 'Failed to claim license',
        })
        errorCount++
        continue
      }

      results.push({ licenseId, success: true })
      successCount++
    } else {
      // Reject
      const { data: updatedLicense, error: updateError } = await supabaseAdmin
        .from('licenses')
        .update({ status: 'rejected' })
        .eq('id', licenseId)
        .eq('status', 'pending')
        .is('owner_id', null)
        .select('id')
        .maybeSingle()

      if (updateError || !updatedLicense) {
        results.push({
          licenseId,
          success: false,
          error: 'Failed to reject license',
        })
        errorCount++
        continue
      }

      results.push({ licenseId, success: true })
      successCount++
    }
  }

  // Trigger achievement check if any licenses were claimed
  if (action === 'claim' && successCount > 0) {
    after(async () => {
      try {
        await checkKitClaimAchievements(user.id)
      } catch (err) {
        console.error('Error checking kit achievements after batch claim:', err)
      }
    })
  }

  return NextResponse.json({
    success: errorCount === 0,
    results,
    successCount,
    errorCount,
  })
}
