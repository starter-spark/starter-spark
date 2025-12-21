"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/audit"
import { requireAdmin } from "@/lib/auth"

export async function updateSiteContent(
  id: string,
  content: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  // Get current content for audit log
  const { data: existingContent, error: existingError } = await supabase
    .from("site_content")
    .select("content_key, content, category")
    .eq("id", id)
    .maybeSingle()

  if (existingError) {
    console.error("Error fetching site content:", existingError)
    return { error: existingError.message }
  }

  if (!existingContent) {
    return { error: "Content not found" }
  }

  // Update the content
  const { data: updated, error } = await supabase
    .from("site_content")
    .update({
      content,
      last_updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Error updating site content:", error)
    return { error: error.message }
  }

  if (!updated) {
    return { error: "Content not found" }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: "site_content.updated",
    resourceType: "site_content",
    resourceId: id,
    details: {
      content_key: existingContent?.content_key,
      category: existingContent?.category,
      previous_content: existingContent?.content?.slice(0, 100),
      new_content: content.slice(0, 100),
    },
  })

  // Revalidate relevant paths based on category
  const category = existingContent.category
  switch (category) {
  case "global": {
    revalidatePath("/", "layout")
  
  break;
  }
  case "homepage": {
    revalidatePath("/")
  
  break;
  }
  case "shop": {
    revalidatePath("/shop")
  
  break;
  }
  case "events": {
    revalidatePath("/events")
  
  break;
  }
  case "community": {
    revalidatePath("/community")
  
  break;
  }
  case "learn": {
    revalidatePath("/learn")
  
  break;
  }
  case "workshop": {
    revalidatePath("/workshop")
  
  break;
  }
  case "cart": {
    revalidatePath("/cart")
  
  break;
  }
  // No default
  }

  revalidatePath("/admin/content/site")

  return { error: null }
}

export async function resetSiteContentToDefault(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  // Get the default value
  const { data: existingContent, error: existingError } = await supabase
    .from("site_content")
    .select("content_key, content, default_value, category")
    .eq("id", id)
    .maybeSingle()

  if (existingError) {
    console.error("Error fetching site content:", existingError)
    return { error: existingError.message }
  }

  if (!existingContent) {
    return { error: "Content not found" }
  }

  if (!existingContent.default_value) {
    return { error: "No default value available" }
  }

  // Reset to default
  const { data: updated, error } = await supabase
    .from("site_content")
    .update({
      content: existingContent.default_value,
      last_updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Error resetting site content:", error)
    return { error: error.message }
  }

  if (!updated) {
    return { error: "Content not found" }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: "site_content.reset",
    resourceType: "site_content",
    resourceId: id,
    details: {
      content_key: existingContent.content_key,
      category: existingContent.category,
      previous_content: existingContent.content?.slice(0, 100),
      reset_to: existingContent.default_value.slice(0, 100),
    },
  })

  // Revalidate
  revalidatePath("/")
  revalidatePath("/admin/content/site")

  return { error: null }
}
