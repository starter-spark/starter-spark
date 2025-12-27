'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateLicenseCode, isValidEmail } from '@/lib/validation'
import { logAuditEvent } from '@/lib/audit'
import { requireAdmin, requireAdminOrStaff } from '@/lib/auth'

export async function revokeLicense(
  licenseId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) {
    return {
      error: guard.user ? 'Only admins can revoke licenses' : guard.error,
    }
  }
  const user = guard.user

  // Get license info before revoking for audit log
  const { data: license, error: licenseError } = await supabaseAdmin
    .from('licenses')
    .select('code, owner_id, product_id')
    .eq('id', licenseId)
    .maybeSingle()

  if (licenseError) {
    console.error('Error fetching license:', licenseError)
    return { error: licenseError.message }
  }

  if (!license) {
    return { error: 'License not found' }
  }

  // Use admin client to bypass RLS
  const { data: revoked, error: revokeError } = await supabaseAdmin
    .from('licenses')
    .update({
      owner_id: null,
      claimed_at: null,
    })
    .eq('id', licenseId)
    .select('id')
    .maybeSingle()

  if (revokeError) {
    console.error('Error revoking license:', revokeError)
    return { error: revokeError.message }
  }

  if (!revoked) {
    return { error: 'License not found' }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: 'license.revoked',
    resourceType: 'license',
    resourceId: licenseId,
    details: {
      code: license?.code,
      previousOwnerId: license?.owner_id,
      productId: license?.product_id,
    },
  })

  revalidatePath('/admin/licenses')

  return { error: null }
}

export async function generateLicenses(
  productId: string,
  quantity: number,
  source: 'online_purchase' | 'physical_card',
): Promise<{ error: string | null; codes: string[] }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error, codes: [] }
  const user = guard.user

  const safeQuantity = Number.isFinite(quantity) ? Math.trunc(quantity) : 0
  if (safeQuantity < 1) {
    return { error: 'Quantity must be at least 1', codes: [] }
  }

  // Avoid accidental huge inserts from the UI.
  if (safeQuantity > 500) {
    return { error: 'Quantity too large (max 500)', codes: [] }
  }

  // Insert in rounds via upsert(ignoreDuplicates) to avoid per-code existence checks.
  const insertedCodes: string[] = []
  const maxRounds = 10

  for (
    let round = 0;
    round < maxRounds && insertedCodes.length < safeQuantity;
    round++
  ) {
    const remaining = safeQuantity - insertedCodes.length
    const batchSize = Math.min(Math.max(remaining * 2, 10), 200)
    const batch = new Set<string>()
    while (batch.size < batchSize) batch.add(generateLicenseCode())

    const licensesToInsert = [...batch].map((code) => ({
      code,
      product_id: productId,
      source,
      owner_id: null,
    }))

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('licenses')
      .upsert(licensesToInsert, {
        onConflict: 'code',
        ignoreDuplicates: true,
      })
      .select('code')

    if (insertError) {
      console.error('Error generating licenses:', insertError)
      return { error: insertError.message, codes: [] }
    }

    if (inserted) {
      insertedCodes.push(...inserted.map((row) => row.code))
    }
  }

  if (insertedCodes.length < safeQuantity) {
    return { error: 'Could not generate enough unique codes', codes: [] }
  }

  // Log audit event for bulk license creation
  await logAuditEvent({
    userId: user.id,
    action: 'license.bulk_created',
    resourceType: 'license',
    resourceId: productId,
    details: {
      quantity: safeQuantity,
      source,
      productId,
      // Don't log all codes, could be sensitive.
      sampleCodes: insertedCodes.slice(0, 3),
    },
  })

  revalidatePath('/admin/licenses')

  return { error: null, codes: insertedCodes.slice(0, safeQuantity) }
}

export async function assignLicense(
  licenseId: string,
  userEmail: string,
): Promise<{ error: string | null }> {
  const normalizedEmail = userEmail.trim().toLowerCase()
  if (!isValidEmail(normalizedEmail)) {
    return { error: 'Invalid email' }
  }

  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  // Find user by email
  const { data: targetUser, error: targetUserError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (targetUserError) {
    console.error('Error looking up user by email:', targetUserError)
    return { error: targetUserError.message }
  }

  if (!targetUser) {
    return { error: 'User not found' }
  }

  // Assign license
  const { data: updatedLicense, error: assignError } = await supabaseAdmin
    .from('licenses')
    .update({
      owner_id: targetUser.id,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', licenseId)
    .is('owner_id', null) // Only if unclaimed
    .select('id, code, product_id')
    .maybeSingle()

  if (assignError) {
    console.error('Error assigning license:', assignError)
    return { error: assignError.message }
  }

  if (!updatedLicense) {
    return { error: 'License not found or already claimed' }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: 'license.assigned',
    resourceType: 'license',
    resourceId: licenseId,
    details: {
      code: updatedLicense.code,
      productId: updatedLicense.product_id,
      assignedToEmail: normalizedEmail,
      assignedToId: targetUser.id,
    },
  })

  revalidatePath('/admin/licenses')

  return { error: null }
}
