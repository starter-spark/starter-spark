'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimitAction } from '@/lib/rate-limit'
import { revalidatePath } from 'next/cache'

const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]
const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update your profile.' }
  }

  const rateLimitResult = await rateLimitAction(user.id, 'profileUpdate')
  if (!rateLimitResult.success) {
    return {
      error:
        rateLimitResult.error || 'Too many updates. Please try again later.',
    }
  }

  const fullName = formData.get('full_name') as string | null
  const avatarSeed = formData.get('avatar_seed') as string | null

  // Validate full name
  const trimmedName = fullName?.trim()
  if (trimmedName && trimmedName.length > 100) {
    return { error: 'Name must be 100 characters or fewer.' }
  }

  // Update the profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      full_name: trimmedName || null,
      avatar_seed: avatarSeed || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating profile:', updateError)
    return { error: 'Failed to update profile. Please try again.' }
  }

  revalidatePath('/account')
  return { success: true }
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const rateLimitResult = await rateLimitAction(user.id, 'profileUpdate')
  if (!rateLimitResult.success) {
    return {
      error:
        rateLimitResult.error || 'Too many updates. Please try again later.',
    }
  }

  const file = formData.get('avatar') as File | null
  if (!file) {
    return { error: 'No file provided.' }
  }

  // Validate file type
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return {
      error:
        'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.',
    }
  }

  // Validate file size
  if (file.size > MAX_AVATAR_SIZE) {
    return { error: 'File too large. Maximum size is 2MB.' }
  }

  // Generate a unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${user.id}/avatar-${Date.now()}.${ext}`

  // Delete old avatar if exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.avatar_url?.includes('/avatars/')) {
    // Extract the path from the URL and delete the old file
    try {
      const oldPath = profile.avatar_url.split('/avatars/')[1]
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath])
      }
    } catch {
      // Ignore errors when deleting old avatar
    }
  }

  // Upload the new avatar
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError)
    return { error: 'Failed to upload avatar. Please try again.' }
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filename)
  const avatarUrl = urlData.publicUrl

  // Update the profile with the new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating profile with avatar:', updateError)
    return { error: 'Failed to save avatar. Please try again.' }
  }

  revalidatePath('/account')
  revalidatePath('/') // Refresh header
  return { success: true, avatarUrl }
}

export async function removeCustomAvatar() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const rateLimitResult = await rateLimitAction(user.id, 'profileUpdate')
  if (!rateLimitResult.success) {
    return {
      error:
        rateLimitResult.error || 'Too many updates. Please try again later.',
    }
  }

  // Get current avatar URL to delete the file
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  // Delete the file from storage if it's a custom upload
  if (profile?.avatar_url?.includes('/avatars/')) {
    try {
      const oldPath = profile.avatar_url.split('/avatars/')[1]
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath])
      }
    } catch {
      // Ignore errors when deleting avatar
    }
  }

  // Clear the avatar URL from the profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error removing avatar:', updateError)
    return { error: 'Failed to remove avatar. Please try again.' }
  }

  revalidatePath('/account')
  revalidatePath('/') // Refresh header
  return { success: true }
}

export async function deleteAccount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete your account.' }
  }

  const rateLimitResult = await rateLimitAction(user.id, 'accountDelete')
  if (!rateLimitResult.success) {
    return {
      error:
        rateLimitResult.error || 'Too many attempts. Please try again later.',
    }
  }

  try {
    // Delete profile via admin client (RLS blocks user deletes).
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      return { error: 'Failed to delete account data. Please contact support.' }
    }

    // Delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id,
    )

    if (authError) {
      console.error('Error deleting auth user:', authError)
      return { error: 'Failed to delete account. Please contact support.' }
    }

    // Sign out the user
    await supabase.auth.signOut()

    // Return success, client handles redirect.
    return { success: true }
  } catch (err) {
    console.error('Error during account deletion:', err)
    return { error: 'An unexpected error occurred. Please contact support.' }
  }
}
