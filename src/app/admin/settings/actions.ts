"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface UpdateStatInput {
  id: string
  value: number
  label: string
  suffix: string
}

export async function updateSiteStat(input: UpdateStatInput) {
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { error: "Not authorized" }
  }

  // Update the stat
  const { error } = await supabase
    .from("site_stats")
    .update({
      value: input.value,
      label: input.label,
      suffix: input.suffix || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)

  if (error) {
    console.error("Error updating site stat:", error)
    return { error: error.message }
  }

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
}) {
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { error: "Not authorized" }
  }

  // Get the max sort_order
  const { data: maxOrder } = await supabase
    .from("site_stats")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxOrder?.sort_order || 0) + 1

  // Create the stat
  const { error } = await supabase.from("site_stats").insert({
    key: input.key,
    value: input.value,
    label: input.label,
    suffix: input.suffix || "",
    is_auto_calculated: input.is_auto_calculated,
    sort_order: nextSortOrder,
  })

  if (error) {
    console.error("Error creating site stat:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/settings")
  revalidatePath("/")

  return { success: true }
}

export async function deleteSiteStat(id: string) {
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { error: "Not authorized" }
  }

  const { error } = await supabase.from("site_stats").delete().eq("id", id)

  if (error) {
    console.error("Error deleting site stat:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/settings")
  revalidatePath("/")

  return { success: true }
}
