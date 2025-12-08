"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { logAuditEvent } from "@/lib/audit"
import { rateLimitAction } from "@/lib/rate-limit"

export async function updateUserRole(
  userId: string,
  role: "admin" | "staff" | "user"
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  // Check if current user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  // Rate limit admin actions
  const rateLimitResult = await rateLimitAction(user.id, "adminMutation")
  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error || "Rate limited" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can change user roles" }
  }

  // Prevent admin from demoting themselves
  if (userId === user.id && role !== "admin") {
    return { error: "You cannot demote yourself" }
  }

  // Validate role (already type-checked, but extra safety)
  const validRoles = ["admin", "staff", "user"] as const
  if (!validRoles.includes(role)) {
    return { error: "Invalid role" }
  }

  // Get the target user's current role for audit log
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("role, email")
    .eq("id", userId)
    .single()

  const oldRole = targetProfile?.role || "unknown"

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  if (error) {
    console.error("Error updating user role:", error)
    return { error: error.message }
  }

  // Log the role change to audit log
  await logAuditEvent({
    userId: user.id,
    action: "user.role_changed",
    resourceType: "user",
    resourceId: userId,
    details: {
      targetEmail: targetProfile?.email,
      oldRole,
      newRole: role,
    },
  })

  revalidatePath("/admin/users")

  return { error: null }
}
