'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'

function normalizeBannerLink(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/')) {
    return trimmed.startsWith('//') ? null : trimmed
  }
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed
    }
  } catch {
    return null
  }
  return null
}

function normalizeBannerLinkText(
  value: FormDataEntryValue | null,
  hasLink: boolean,
): string | null {
  if (!hasLink) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export async function deleteBanner(bannerId: string) {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) throw new Error(guard.error)
  const user = guard.user

  const { data: deletedBanner, error: deleteError } = await supabase
    .from('site_banners')
    .delete()
    .eq('id', bannerId)
    .select('id, title')
    .maybeSingle()

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (!deletedBanner) {
    throw new Error('Banner not found')
  }

  await logAuditEvent({
    userId: user.id,
    action: 'banner.deleted',
    resourceType: 'banner',
    resourceId: bannerId,
    details: {
      title: deletedBanner.title,
    },
  })

  revalidatePath('/admin/banners')
  revalidatePath('/', 'layout')
}

export async function toggleBannerActive(bannerId: string, isActive: boolean) {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) throw new Error(guard.error)
  const user = guard.user

  const { data: updatedBanner, error: updateError } = await supabase
    .from('site_banners')
    .update({ is_active: isActive })
    .eq('id', bannerId)
    .select('id')
    .maybeSingle()

  if (updateError) {
    throw new Error(updateError.message)
  }

  if (!updatedBanner) {
    throw new Error('Banner not found')
  }

  await logAuditEvent({
    userId: user.id,
    action: isActive ? 'banner.activated' : 'banner.deactivated',
    resourceType: 'banner',
    resourceId: bannerId,
    details: {
      is_active: isActive,
    },
  })

  revalidatePath('/admin/banners')
  revalidatePath('/', 'layout')
}

export async function duplicateBanner(bannerId: string) {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) throw new Error(guard.error)
  const user = guard.user

  // Get the original banner
  const { data: original, error: fetchError } = await supabase
    .from('site_banners')
    .select('*')
    .eq('id', bannerId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (!original) {
    throw new Error('Banner not found')
  }

  // Create a copy with modified title and inactive status
  const { id, created_at, updated_at, ...bannerData } = original
  void id
  void created_at
  void updated_at
  const { data: newBanner, error: insertError } = await supabase
    .from('site_banners')
    .insert({
      ...bannerData,
      title: `${bannerData.title} (Copy)`,
      is_active: false, // Start as inactive
    })
    .select()
    .maybeSingle()

  if (insertError) {
    throw new Error(insertError.message)
  }

  if (!newBanner) {
    throw new Error('Failed to duplicate banner')
  }

  await logAuditEvent({
    userId: user.id,
    action: 'banner.duplicated',
    resourceType: 'banner',
    resourceId: newBanner.id,
    details: {
      duplicated_from: bannerId,
      title: newBanner.title,
    },
  })

  revalidatePath('/admin/banners')
  revalidatePath('/', 'layout')
}

export async function createBanner(formData: FormData) {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) throw new Error(guard.error)
  const user = guard.user

  const titleRaw = formData.get('title')
  const messageRaw = formData.get('message')
  if (typeof titleRaw !== 'string' || !titleRaw.trim()) {
    throw new Error('Title is required')
  }
  if (typeof messageRaw !== 'string' || !messageRaw.trim()) {
    throw new Error('Message is required')
  }

  const title = titleRaw.trim()
  const message = messageRaw.trim()
  const link_url = formData.get('link_url')
  const link_text = formData.get('link_text')
  const icon = formData.get('icon')
  const color_scheme = formData.get('color_scheme')
  const pages = formData
    .getAll('pages')
    .filter((p): p is string => typeof p === 'string')
  const is_dismissible = formData.get('is_dismissible') === 'true'
  const dismiss_duration_hours = formData.get('dismiss_duration_hours')
    ? Number.parseInt(formData.get('dismiss_duration_hours') as string, 10)
    : null
  const starts_at = formData.get('starts_at')
  const ends_at = formData.get('ends_at')
  const is_active = formData.get('is_active') === 'true'
  const sort_order =
    Number.parseInt(formData.get('sort_order') as string, 10) || 0

  const normalizedLinkUrl = normalizeBannerLink(link_url)
  const normalizedLinkText = normalizeBannerLinkText(
    link_text,
    !!normalizedLinkUrl,
  )

  const { data, error } = await supabase
    .from('site_banners')
    .insert({
      title,
      message,
      link_url: normalizedLinkUrl,
      link_text: normalizedLinkText,
      icon: typeof icon === 'string' && icon.trim() ? icon.trim() : null,
      color_scheme:
        typeof color_scheme === 'string' && color_scheme
          ? color_scheme
          : 'info',
      pages: pages.length > 0 ? pages : [],
      is_dismissible,
      dismiss_duration_hours,
      starts_at: typeof starts_at === 'string' && starts_at ? starts_at : null,
      ends_at: typeof ends_at === 'string' && ends_at ? ends_at : null,
      is_active,
      sort_order,
      created_by: user.id,
    })
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Failed to create banner')
  }

  await logAuditEvent({
    userId: user.id,
    action: 'banner.created',
    resourceType: 'banner',
    resourceId: data.id,
    details: {
      title: data.title,
    },
  })

  revalidatePath('/admin/banners')
  revalidatePath('/', 'layout')
  return data
}

export async function updateBanner(bannerId: string, formData: FormData) {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) throw new Error(guard.error)
  const user = guard.user

  const titleRaw = formData.get('title')
  const messageRaw = formData.get('message')
  if (typeof titleRaw !== 'string' || !titleRaw.trim()) {
    throw new Error('Title is required')
  }
  if (typeof messageRaw !== 'string' || !messageRaw.trim()) {
    throw new Error('Message is required')
  }

  const title = titleRaw.trim()
  const message = messageRaw.trim()
  const link_url = formData.get('link_url')
  const link_text = formData.get('link_text')
  const icon = formData.get('icon')
  const color_scheme = formData.get('color_scheme')
  const pages = formData
    .getAll('pages')
    .filter((p): p is string => typeof p === 'string')
  const is_dismissible = formData.get('is_dismissible') === 'true'
  const dismiss_duration_hours = formData.get('dismiss_duration_hours')
    ? Number.parseInt(formData.get('dismiss_duration_hours') as string, 10)
    : null
  const starts_at = formData.get('starts_at')
  const ends_at = formData.get('ends_at')
  const is_active = formData.get('is_active') === 'true'
  const sort_order =
    Number.parseInt(formData.get('sort_order') as string, 10) || 0

  const normalizedLinkUrl = normalizeBannerLink(link_url)
  const normalizedLinkText = normalizeBannerLinkText(
    link_text,
    !!normalizedLinkUrl,
  )

  const { data: updatedBanner, error: updateError } = await supabase
    .from('site_banners')
    .update({
      title,
      message,
      link_url: normalizedLinkUrl,
      link_text: normalizedLinkText,
      icon: typeof icon === 'string' && icon.trim() ? icon.trim() : null,
      color_scheme:
        typeof color_scheme === 'string' && color_scheme
          ? color_scheme
          : 'info',
      pages: pages.length > 0 ? pages : [],
      is_dismissible,
      dismiss_duration_hours,
      starts_at: typeof starts_at === 'string' && starts_at ? starts_at : null,
      ends_at: typeof ends_at === 'string' && ends_at ? ends_at : null,
      is_active,
      sort_order,
    })
    .eq('id', bannerId)
    .select('id')
    .maybeSingle()

  if (updateError) {
    throw new Error(updateError.message)
  }

  if (!updatedBanner) {
    throw new Error('Banner not found')
  }

  await logAuditEvent({
    userId: user.id,
    action: 'banner.updated',
    resourceType: 'banner',
    resourceId: bannerId,
    details: {
      title,
    },
  })

  revalidatePath('/admin/banners')
  revalidatePath('/', 'layout')
}
