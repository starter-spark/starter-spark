import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

export type AuditAction =
  // Users
  | 'user.role_changed'
  | 'user.deleted'
  | 'user.banned_from_forums'
  | 'user.unbanned_from_forums'
  // Products
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.tags_updated'
  // Licenses
  | 'license.created'
  | 'license.bulk_created'
  | 'license.revoked'
  | 'license.assigned'
  | 'license.transferred'
  // Events
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  // Community
  | 'post.deleted'
  | 'post.status_changed'
  | 'comment.deleted'
  | 'comment.verified'
  // Content
  | 'content.updated'
  | 'content.published'
  | 'content.unpublished'
  | 'content.created'
  | 'content.deleted'
  // Settings
  | 'settings.updated'
  | 'stats.created'
  | 'stats.updated'
  | 'stats.deleted'
  | 'site_content.updated'
  | 'site_content.reset'
  // Banners
  | 'banner.created'
  | 'banner.updated'
  | 'banner.deleted'
  | 'banner.duplicated'
  | 'banner.activated'
  | 'banner.deactivated'
  // Learning
  | 'course.created'
  | 'course.updated'
  | 'course.deleted'
  | 'module.created'
  | 'module.updated'
  | 'module.deleted'
  | 'module.reordered'
  | 'lesson.created'
  | 'lesson.updated'
  | 'lesson.deleted'
  | 'lesson.reordered'
  // Docs
  | 'doc_category.created'
  | 'doc_category.updated'
  | 'doc_category.deleted'
  | 'doc_page.created'
  | 'doc_page.updated'
  | 'doc_page.deleted'
  | 'doc_page.published'
  | 'doc_page.unpublished'
  // Team
  | 'team_member.created'
  | 'team_member.updated'
  | 'team_member.deleted'
  | 'team_member.reordered'

export type AuditResourceType =
  | 'user'
  | 'product'
  | 'license'
  | 'event'
  | 'post'
  | 'comment'
  | 'content'
  | 'settings'
  | 'stats'
  | 'site_content'
  | 'banner'
  | 'course'
  | 'module'
  | 'lesson'
  | 'doc_category'
  | 'doc_page'
  | 'team_member'

interface AuditLogParams {
  userId: string
  action: AuditAction
  resourceType: AuditResourceType
  resourceId?: string
  details?: Record<string, unknown>
}

export async function logAuditEvent({
  userId,
  action,
  resourceType,
  resourceId,
  details,
}: AuditLogParams): Promise<void> {
  try {
    const headersList = await headers()
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      null
    const userAgent = headersList.get('user-agent') || null

    const { error } = await supabaseAdmin.from('admin_audit_log').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      details: (details as unknown as Json) || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    if (error) {
      console.error('[Audit] Failed to log event:', error.message)
    }
  } catch (err) {
    console.error('[Audit] Unexpected error:', err)
  }
}

export async function getAuditLogs(options?: {
  userId?: string
  action?: AuditAction
  resourceType?: AuditResourceType
  resourceId?: string
  limit?: number
  offset?: number
}) {
  const {
    userId,
    action,
    resourceType,
    resourceId,
    limit = 50,
    offset = 0,
  } = options || {}

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return []
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[Audit] Failed to verify admin role:', profileError)
    return []
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return []
  }

  let query = supabaseAdmin
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (action) {
    query = query.eq('action', action)
  }
  if (resourceType) {
    query = query.eq('resource_type', resourceType)
  }
  if (resourceId) {
    query = query.eq('resource_id', resourceId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[Audit] Failed to fetch logs:', error.message)
    return []
  }

  return data
}
