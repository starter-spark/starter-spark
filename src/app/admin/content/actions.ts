'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdminOrStaff } from '@/lib/auth'

interface UpdateContentData {
  title: string
  content: string
  publish?: boolean
}

export async function updatePageContent(
  pageKey: string,
  data: UpdateContentData,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  // Get current content to check version
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('page_content')
    .select('version')
    .eq('page_key', pageKey)
    .maybeSingle()

  if (existingError) {
    console.error('Error fetching page content version:', existingError)
    return { error: existingError.message }
  }

  if (!existing) {
    return { error: 'Page not found' }
  }

  const newVersion = (existing?.version || 0) + 1

  const { data: updated, error } = await supabaseAdmin
    .from('page_content')
    .update({
      title: data.title,
      content: data.content,
      last_updated_by: user.id,
      updated_at: new Date().toISOString(),
      version: newVersion,
      // Only update published_at if explicitly publishing
      ...(data.publish ? { published_at: new Date().toISOString() } : {}),
    })
    .eq('page_key', pageKey)
    .select('page_key')
    .maybeSingle()

  if (error) {
    console.error('Error updating page content:', error)
    return { error: error.message }
  }

  if (!updated) {
    return { error: 'Page not found' }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: data.publish ? 'content.published' : 'content.updated',
    resourceType: 'content',
    resourceId: pageKey,
    details: {
      title: data.title,
      published: data.publish || false,
      version: newVersion,
    },
  })

  // Revalidate the admin page and the public page
  revalidatePath('/admin/content')
  revalidatePath(`/admin/content/${pageKey}`)
  revalidatePath(`/${pageKey}`)

  return { error: null }
}

export async function unpublishPageContent(
  pageKey: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data: updated, error } = await supabaseAdmin
    .from('page_content')
    .update({
      published_at: null,
      last_updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('page_key', pageKey)
    .select('page_key')
    .maybeSingle()

  if (error) {
    console.error('Error unpublishing page:', error)
    return { error: error.message }
  }

  if (!updated) {
    return { error: 'Page not found' }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: 'content.unpublished',
    resourceType: 'content',
    resourceId: pageKey,
  })

  revalidatePath('/admin/content')
  revalidatePath(`/admin/content/${pageKey}`)
  revalidatePath(`/${pageKey}`)

  return { error: null }
}

// Reserved slugs that cannot be used for custom pages
const RESERVED_SLUGS = new Set([
  'shop',
  'about',
  'events',
  'community',
  'learn',
  'workshop',
  'cart',
  'login',
  'privacy',
  'terms',
  'admin',
  'api',
  'auth',
  'checkout',
  'claim',
  'new',
  'team',
])

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, 50)
}

interface CreateCustomPageData {
  title: string
  slug: string
  content: string
  seoTitle?: string
  seoDescription?: string
  publish?: boolean
}

export async function createCustomPage(
  data: CreateCustomPageData,
): Promise<{ error: string | null; pageKey?: string }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  // Validate slug
  const slug = data.slug || generateSlug(data.title)

  if (!slug || slug.length < 1) {
    return { error: 'Slug is required' }
  }

  if (RESERVED_SLUGS.has(slug)) {
    return { error: `The slug "${slug}" is reserved and cannot be used` }
  }

  // Check if slug already exists
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('page_content')
    .select('id')
    .eq('slug', slug)
    .eq('is_custom_page', true)
    .maybeSingle()

  if (existingError) {
    console.error('Error checking slug availability:', existingError)
    return { error: existingError.message }
  }

  if (existing) {
    return { error: `A page with the slug "${slug}" already exists` }
  }

  // Generate a unique page_key for custom pages
  const pageKey = `custom_${slug}`

  const { error } = await supabaseAdmin.from('page_content').insert({
    page_key: pageKey,
    title: data.title,
    slug: slug,
    content: data.content,
    is_custom_page: true,
    seo_title: data.seoTitle || null,
    seo_description: data.seoDescription || null,
    last_updated_by: user.id,
    version: 1,
    ...(data.publish ? { published_at: new Date().toISOString() } : {}),
  })

  if (error) {
    console.error('Error creating custom page:', error)
    return { error: error.message }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: 'content.created',
    resourceType: 'content',
    resourceId: pageKey,
    details: {
      title: data.title,
      slug,
      published: data.publish || false,
      isCustomPage: true,
    },
  })

  revalidatePath('/admin/content')
  revalidatePath(`/p/${slug}`)

  return { error: null, pageKey }
}

export async function deleteCustomPage(
  pageKey: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  // Verify it's a custom page before deleting
  const { data: page, error: pageError } = await supabaseAdmin
    .from('page_content')
    .select('is_custom_page, slug')
    .eq('page_key', pageKey)
    .maybeSingle()

  if (pageError) {
    console.error('Error fetching page:', pageError)
    return { error: pageError.message }
  }

  if (!page) {
    return { error: 'Page not found' }
  }

  if (!page?.is_custom_page) {
    return { error: 'Cannot delete system pages' }
  }

  const { data: deleted, error } = await supabaseAdmin
    .from('page_content')
    .delete()
    .eq('page_key', pageKey)
    .select('page_key')
    .maybeSingle()

  if (error) {
    console.error('Error deleting custom page:', error)
    return { error: error.message }
  }

  if (!deleted) {
    return { error: 'Page not found' }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: 'content.deleted',
    resourceType: 'content',
    resourceId: pageKey,
    details: {
      slug: page.slug,
      isCustomPage: true,
    },
  })

  revalidatePath('/admin/content')
  if (page.slug) {
    revalidatePath(`/p/${page.slug}`)
  }

  return { error: null }
}

export async function checkSlugAvailability(
  slug: string,
): Promise<{ available: boolean; error?: string }> {
  if (!slug || slug.length < 1) {
    return { available: false, error: 'Slug is required' }
  }

  if (RESERVED_SLUGS.has(slug)) {
    return { available: false, error: `"${slug}" is a reserved slug` }
  }

  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { available: false, error: guard.error }

  const { data: existing, error } = await supabaseAdmin
    .from('page_content')
    .select('id')
    .eq('slug', slug)
    .eq('is_custom_page', true)
    .maybeSingle()

  if (error) {
    console.error('Error checking slug availability:', error)
    return { available: false, error: error.message }
  }

  if (existing) {
    return { available: false, error: 'This slug is already in use' }
  }

  return { available: true }
}
