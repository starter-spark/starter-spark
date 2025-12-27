import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type UserRole = Database['public']['Enums']['user_role']

export type RoleGuardResult =
  | { ok: true; user: User; role: UserRole }
  | { ok: false; user: User | null; error: string }

export async function getAuthenticatedUser(
  supabase: SupabaseClient<Database>,
): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    console.error('[auth] supabase.auth.getUser failed:', error)
    return { user: null, error: 'Unauthorized' }
  }
  return { user: data.user, error: null }
}

export async function getUserRole(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ role: UserRole | null; error: string | null }> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[auth] role lookup failed:', error)
    return { role: null, error: 'Failed to verify permissions' }
  }

  return { role: profile?.role ?? null, error: null }
}

export async function requireRole(
  supabase: SupabaseClient<Database>,
  allowed: readonly UserRole[],
): Promise<RoleGuardResult> {
  const { user, error } = await getAuthenticatedUser(supabase)
  if (!user) return { ok: false, user: null, error: error || 'Unauthorized' }

  const { role, error: roleError } = await getUserRole(supabase, user.id)
  if (roleError) return { ok: false, user, error: roleError }
  if (!role || !allowed.includes(role))
    return { ok: false, user, error: 'Unauthorized' }

  return { ok: true, user, role }
}

export async function requireAdmin(
  supabase: SupabaseClient<Database>,
): Promise<RoleGuardResult> {
  return requireRole(supabase, ['admin'])
}

export async function requireAdminOrStaff(
  supabase: SupabaseClient<Database>,
): Promise<RoleGuardResult> {
  return requireRole(supabase, ['admin', 'staff'])
}
