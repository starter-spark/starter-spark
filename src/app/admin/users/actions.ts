'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'
import { rateLimitAction } from '@/lib/rate-limit'
import { requireAdmin, requireAdminOrStaff } from '@/lib/auth'

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'staff' | 'user',
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) {
    return {
      error: guard.user ? 'Only admins can change user roles' : guard.error,
    }
  }
  const user = guard.user

  // Rate limit admin actions
  const rateLimitResult = await rateLimitAction(user.id, 'adminMutation')
  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error || 'Rate limited' }
  }

  // Prevent admin from demoting themselves
  if (userId === user.id && role !== 'admin') {
    return { error: 'You cannot demote yourself' }
  }

  // Validate role (already type-checked, but extra safety)
  const validRoles = ['admin', 'staff', 'user'] as const
  if (!validRoles.includes(role)) {
    return { error: 'Invalid role' }
  }

  // Get the target user's current role for audit log
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from('profiles')
    .select('role, email')
    .eq('id', userId)
    .maybeSingle()

  if (targetError) {
    console.error('Error fetching target profile:', targetError)
    return { error: targetError.message }
  }

  if (!targetProfile) {
    return { error: 'User not found' }
  }

  const oldRole = targetProfile?.role || 'unknown'

  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select('id')
    .maybeSingle()

  if (updateError) {
    console.error('Error updating user role:', updateError)
    return { error: updateError.message }
  }

  if (!updatedProfile) {
    return { error: 'User not found' }
  }

  // Log the role change to audit log
  await logAuditEvent({
    userId: user.id,
    action: 'user.role_changed',
    resourceType: 'user',
    resourceId: userId,
    details: {
      targetEmail: targetProfile?.email,
      oldRole,
      newRole: role,
    },
  })

  revalidatePath('/admin/users')

  return { error: null }
}

export async function banUserFromForums(
  userId: string,
  reason?: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) {
    return { error: guard.user ? 'Only staff can ban users' : guard.error }
  }
  const user = guard.user

  // Rate limit admin actions
  const rateLimitResult = await rateLimitAction(user.id, 'adminMutation')
  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error || 'Rate limited' }
  }

  // Prevent banning yourself
  if (userId === user.id) {
    return { error: 'You cannot ban yourself' }
  }

  // Get the target user's info for validation and audit
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from('profiles')
    .select('role, email, is_banned_from_forums')
    .eq('id', userId)
    .maybeSingle()

  if (targetError) {
    console.error('Error fetching target profile:', targetError)
    return { error: targetError.message }
  }

  if (!targetProfile) {
    return { error: 'User not found' }
  }

  // Prevent banning other admins/staff
  if (targetProfile.role === 'admin' || targetProfile.role === 'staff') {
    return { error: 'Cannot ban admin or staff members' }
  }

  // Check if already banned
  if (targetProfile.is_banned_from_forums) {
    return { error: 'User is already banned from forums' }
  }

  // Apply the ban
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      is_banned_from_forums: true,
      banned_at: new Date().toISOString(),
      banned_by: user.id,
      ban_reason: reason || null,
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Error banning user:', updateError)
    return { error: updateError.message }
  }

  // Log the ban to audit log
  await logAuditEvent({
    userId: user.id,
    action: 'user.banned_from_forums',
    resourceType: 'user',
    resourceId: userId,
    details: {
      targetEmail: targetProfile.email,
      reason: reason || 'No reason provided',
    },
  })

  revalidatePath('/admin/users')

  return { error: null }
}

export async function unbanUserFromForums(
  userId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) {
    return { error: guard.user ? 'Only staff can unban users' : guard.error }
  }
  const user = guard.user

  // Rate limit admin actions
  const rateLimitResult = await rateLimitAction(user.id, 'adminMutation')
  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error || 'Rate limited' }
  }

  // Get the target user's info for validation and audit
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from('profiles')
    .select('email, is_banned_from_forums')
    .eq('id', userId)
    .maybeSingle()

  if (targetError) {
    console.error('Error fetching target profile:', targetError)
    return { error: targetError.message }
  }

  if (!targetProfile) {
    return { error: 'User not found' }
  }

  // Check if not banned
  if (!targetProfile.is_banned_from_forums) {
    return { error: 'User is not banned from forums' }
  }

  // Remove the ban
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      is_banned_from_forums: false,
      banned_at: null,
      banned_by: null,
      ban_reason: null,
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Error unbanning user:', updateError)
    return { error: updateError.message }
  }

  // Log the unban to audit log
  await logAuditEvent({
    userId: user.id,
    action: 'user.unbanned_from_forums',
    resourceType: 'user',
    resourceId: userId,
    details: {
      targetEmail: targetProfile.email,
    },
  })

  revalidatePath('/admin/users')

  return { error: null }
}
