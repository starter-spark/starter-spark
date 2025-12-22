"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { requireAdminOrStaff } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"

interface TeamMemberData {
  name: string
  role: string
  bio: string
  image_url: string
  social_links: {
    github?: string
    linkedin?: string
    twitter?: string
  }
  is_active: boolean
}

export async function createTeamMember(data: TeamMemberData) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { success: false, error: guard.error }
  const user = guard.user

  // Get the highest sort_order
  const { data: lastMember, error: lastMemberError } = await supabase
    .from("team_members")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastMemberError) {
    console.error("Error fetching last team member:", lastMemberError)
    return { success: false, error: "Failed to create team member" }
  }

  const nextSortOrder = (lastMember?.sort_order || 0) + 1

  const { data: member, error } = await supabase
    .from("team_members")
    .insert({
      ...data,
      sort_order: nextSortOrder,
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error("Error creating team member:", error)
    return { success: false, error: error.message || "Failed to create team member" }
  }

  if (!member) {
    return { success: false, error: "Failed to create team member" }
  }

  await logAuditEvent({
    userId: user.id,
    action: "team_member.created",
    resourceType: "team_member",
    resourceId: member.id,
    details: {
      name: member.name,
      role: member.role,
      is_active: member.is_active,
    },
  })

  revalidatePath("/admin/content/team")
  revalidatePath("/about")
  return { success: true, member }
}

export async function updateTeamMember(id: string, data: Partial<TeamMemberData>) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { success: false, error: guard.error }
  const user = guard.user

  const { data: updated, error } = await supabase
    .from("team_members")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Error updating team member:", error)
    return { success: false, error: error.message }
  }

  if (!updated) {
    return { success: false, error: "Team member not found" }
  }

  await logAuditEvent({
    userId: user.id,
    action: "team_member.updated",
    resourceType: "team_member",
    resourceId: id,
    details: data,
  })

  revalidatePath("/admin/content/team")
  revalidatePath("/about")
  return { success: true }
}

export async function deleteTeamMember(id: string) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { success: false, error: guard.error }
  const user = guard.user

  const { data: deleted, error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Error deleting team member:", error)
    return { success: false, error: error.message }
  }

  if (!deleted) {
    return { success: false, error: "Team member not found" }
  }

  await logAuditEvent({
    userId: user.id,
    action: "team_member.deleted",
    resourceType: "team_member",
    resourceId: id,
  })

  revalidatePath("/admin/content/team")
  revalidatePath("/about")
  return { success: true }
}

export async function reorderTeamMembers(orderedIds: string[]) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { success: false, error: guard.error }
  const user = guard.user

  const uniqueIds = new Set(orderedIds)
  if (uniqueIds.size !== orderedIds.length) {
    return { success: false, error: "Invalid team member order" }
  }

  // Update sort_order for each member
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("team_members")
      .update({ sort_order: index + 1 })
      .eq("id", id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some((r) => r.error)

  if (hasError) {
    console.error("Error reordering team members")
    return { success: false, error: "Failed to reorder team members" }
  }

  await logAuditEvent({
    userId: user.id,
    action: "team_member.reordered",
    resourceType: "team_member",
    details: {
      ordered_ids: orderedIds,
    },
  })

  revalidatePath("/admin/content/team")
  revalidatePath("/about")
  return { success: true }
}
