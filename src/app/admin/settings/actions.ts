"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/audit"
import { requireAdmin } from "@/lib/auth"

interface UpdateStatInput {
  id: string
  value: number
  label: string
  suffix: string
  is_auto_calculated?: boolean
  auto_source?: string | null
}

export async function updateSiteStat(input: UpdateStatInput) {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) {
    return { error: guard.error }
  }
  const user = guard.user

  // Update the stat
  const updateData: Record<string, unknown> = {
    value: input.value,
    label: input.label,
    suffix: input.suffix || "",
    updated_at: new Date().toISOString(),
  }

  // Include auto_calculated fields if provided
  if (input.is_auto_calculated !== undefined) {
    updateData.is_auto_calculated = input.is_auto_calculated
    updateData.auto_source = input.is_auto_calculated ? (input.auto_source || null) : null
  }

  const { data: updated, error } = await supabase
    .from("site_stats")
    .update(updateData)
    .eq("id", input.id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Error updating site stat:", error)
    return { error: error.message }
  }

  if (!updated) {
    return { error: "Stat not found" }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: 'stats.updated',
    resourceType: 'stats',
    resourceId: input.id,
    details: {
      label: input.label,
      value: input.value,
      suffix: input.suffix,
    },
  })

  revalidatePath("/admin/settings")
  revalidatePath("/")

  return { success: true }
}

export async function createSiteStat(input: {
  key: string
  value: number
  label: string
  suffix: string
  is_auto_calculated: boolean
  auto_source?: string | null
}) {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) {
    return { error: guard.error }
  }
  const user = guard.user

  // Get the max sort_order
  const { data: maxOrder, error: maxOrderError } = await supabase
    .from("site_stats")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (maxOrderError) {
    console.error("Error fetching max sort_order:", maxOrderError)
    return { error: maxOrderError.message }
  }

  const nextSortOrder = (maxOrder?.sort_order || 0) + 1

  // Create the stat
  const { data: stat, error } = await supabase
    .from("site_stats")
    .insert({
      key: input.key,
      value: input.value,
      label: input.label,
      suffix: input.suffix || "",
      is_auto_calculated: input.is_auto_calculated,
      auto_source: input.is_auto_calculated ? (input.auto_source || null) : null,
      sort_order: nextSortOrder,
    })
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Error creating site stat:", error)
    return { error: error.message }
  }

  if (!stat) {
    return { error: "Failed to create stat" }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: 'stats.created',
    resourceType: 'stats',
    resourceId: stat.id,
    details: {
      key: input.key,
      label: input.label,
      value: input.value,
    },
  })

  revalidatePath("/admin/settings")
  revalidatePath("/")

  return { success: true }
}

export async function deleteSiteStat(id: string) {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) {
    return { error: guard.error }
  }
  const user = guard.user

  // Delete and return the stat for audit details.
  const { data: stat, error } = await supabase
    .from("site_stats")
    .delete()
    .eq("id", id)
    .select("id, key, label")
    .maybeSingle()

  if (error) {
    console.error("Error deleting site stat:", error)
    return { error: error.message }
  }

  if (!stat) {
    return { error: "Stat not found" }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: 'stats.deleted',
    resourceType: 'stats',
    resourceId: id,
    details: {
      key: stat.key,
      label: stat.label,
    },
  })

  revalidatePath("/admin/settings")
  revalidatePath("/")

  return { success: true }
}
