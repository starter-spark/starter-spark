"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { logAuditEvent } from "@/lib/audit"
import { rateLimitAction } from "@/lib/rate-limit"
import { requireAdmin } from "@/lib/auth"

export async function updateUserRole(
  userId: string,
  role: "admin" | "staff" | "user"
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) {
    return { error: guard.user ? "Only admins can change user roles" : guard.error }
  }
  const user = guard.user

  // Rate limit admin actions
  const rateLimitResult = await rateLimitAction(user.id, "adminMutation")
  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error || "Rate limited" }
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
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from("profiles")
    .select("role, email")
    .eq("id", userId)
    .maybeSingle()

  if (targetError) {
    console.error("Error fetching target profile:", targetError)
    return { error: targetError.message }
  }

  if (!targetProfile) {
    return { error: "User not found" }
  }

  const oldRole = targetProfile?.role || "unknown"

  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select("id")
    .maybeSingle()

  if (updateError) {
    console.error("Error updating user role:", updateError)
    return { error: updateError.message }
  }

  if (!updatedProfile) {
    return { error: "User not found" }
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
