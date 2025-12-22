import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

/**
 * Audit action types for admin operations
 */
export type AuditAction =
  // User management
  | 'user.role_changed'
  | 'user.deleted'
  // Product management
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.tags_updated'
  // License management
  | 'license.created'
  | 'license.bulk_created'
  | 'license.revoked'
  | 'license.assigned'
  | 'license.transferred'
  // Event management
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  // Community moderation
  | 'post.deleted'
  | 'post.status_changed'
  | 'comment.deleted'
  | 'comment.verified'
  // Content management
  | 'content.updated'
  | 'content.published'
  | 'content.unpublished'
  | 'content.created'
  | 'content.deleted'
  // Site settings
  | 'settings.updated'
  | 'stats.created'
  | 'stats.updated'
  | 'stats.deleted'
  // Site content
  | 'site_content.updated'
  | 'site_content.reset'
  // Banner management
  | 'banner.created'
  | 'banner.updated'
  | 'banner.deleted'
  | 'banner.duplicated'
  | 'banner.activated'
  | 'banner.deactivated'
  // Learning management
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
  // Docs management
  | 'doc_category.created'
  | 'doc_category.updated'
  | 'doc_category.deleted'
  | 'doc_page.created'
  | 'doc_page.updated'
  | 'doc_page.deleted'
  | 'doc_page.published'
  | 'doc_page.unpublished'
  // Team management
  | 'team_member.created'
  | 'team_member.updated'
  | 'team_member.deleted'
  | 'team_member.reordered'

/**
 * Resource types that can be audited
 */
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

/**
 * Log an admin action to the audit log
 *
 * @example
 * await logAuditEvent({
 *   userId: adminUser.id,
 *   action: 'user.role_changed',
 *   resourceType: 'user',
 *   resourceId: targetUserId,
 *   details: { oldRole: 'user', newRole: 'staff' }
 * })
 */
export async function logAuditEvent({
  userId,
  action,
  resourceType,
  resourceId,
  details,
}: AuditLogParams): Promise<void> {
  try {
    // Get request headers for IP and user agent
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
      // Log error but don't throw - audit logging should not break the main operation
      console.error('[Audit] Failed to log event:', error.message)
    }
  } catch (err) {
    // Silently fail - audit logging should never break the main operation
    console.error('[Audit] Unexpected error:', err)
  }
}

/**
 * Fetch audit logs with optional filters
 * Only admins/staff can access this function (enforced in code before using service role)
 */
export async function getAuditLogs(options?: {
  userId?: string
  action?: AuditAction
  resourceType?: AuditResourceType
  resourceId?: string
  limit?: number
  offset?: number
}) {
  const { userId, action, resourceType, resourceId, limit = 50, offset = 0 } = options || {}

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
