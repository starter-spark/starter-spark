"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/audit"

export async function deleteBanner(bannerId: string) {
  const supabase = await createClient()

  // Get user for audit log
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get banner info for audit log
  const { data: banner } = await supabase
    .from("site_banners")
    .select("title")
    .eq("id", bannerId)
    .single()

  const { error } = await supabase.from("site_banners").delete().eq("id", bannerId)

  if (error) {
    throw new Error(error.message)
  }

  await logAuditEvent({
    userId: user.id,
    action: "banner.deleted",
    resourceType: "banner",
    resourceId: bannerId,
    details: {
      title: banner?.title,
    },
  })

  revalidatePath("/admin/banners")
}

export async function toggleBannerActive(bannerId: string, isActive: boolean) {
  const supabase = await createClient()

  // Get user for audit log
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("site_banners")
    .update({ is_active: isActive })
    .eq("id", bannerId)

  if (error) {
    throw new Error(error.message)
  }

  await logAuditEvent({
    userId: user.id,
    action: isActive ? "banner.activated" : "banner.deactivated",
    resourceType: "banner",
    resourceId: bannerId,
    details: {
      is_active: isActive,
    },
  })

  revalidatePath("/admin/banners")
}

export async function duplicateBanner(bannerId: string) {
  const supabase = await createClient()

  // Get user for audit log
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get the original banner
  const { data: original, error: fetchError } = await supabase
    .from("site_banners")
    .select("*")
    .eq("id", bannerId)
    .single()

  if (fetchError || !original) {
    throw new Error("Banner not found")
  }

  // Create a copy with modified title and inactive status
  const { id, created_at, updated_at, ...bannerData } = original
  const { data: newBanner, error: insertError } = await supabase
    .from("site_banners")
    .insert({
      ...bannerData,
      title: `${bannerData.title} (Copy)`,
      is_active: false, // Start as inactive
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(insertError.message)
  }

  await logAuditEvent({
    userId: user.id,
    action: "banner.duplicated",
    resourceType: "banner",
    resourceId: newBanner.id,
    details: {
      duplicated_from: bannerId,
      title: newBanner.title,
    },
  })

  revalidatePath("/admin/banners")
}

export async function createBanner(formData: FormData) {
  const supabase = await createClient()

  // Get user for audit log
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const title = formData.get("title") as string
  const message = formData.get("message") as string
  const link_url = formData.get("link_url") as string | null
  const link_text = formData.get("link_text") as string | null
  const icon = formData.get("icon") as string | null
  const color_scheme = formData.get("color_scheme") as string
  const pages = formData.getAll("pages") as string[]
  const is_dismissible = formData.get("is_dismissible") === "true"
  const dismiss_duration_hours = formData.get("dismiss_duration_hours")
    ? parseInt(formData.get("dismiss_duration_hours") as string, 10)
    : null
  const starts_at = formData.get("starts_at") as string | null
  const ends_at = formData.get("ends_at") as string | null
  const is_active = formData.get("is_active") === "true"
  const sort_order = parseInt(formData.get("sort_order") as string, 10) || 0

  const { data, error } = await supabase
    .from("site_banners")
    .insert({
      title,
      message,
      link_url: link_url || null,
      link_text: link_text || null,
      icon: icon || null,
      color_scheme,
      pages: pages.length > 0 ? pages : [],
      is_dismissible,
      dismiss_duration_hours,
      starts_at: starts_at || null,
      ends_at: ends_at || null,
      is_active,
      sort_order,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await logAuditEvent({
    userId: user.id,
    action: "banner.created",
    resourceType: "banner",
    resourceId: data.id,
    details: {
      title: data.title,
    },
  })

  revalidatePath("/admin/banners")
  return data
}

export async function updateBanner(bannerId: string, formData: FormData) {
  const supabase = await createClient()

  // Get user for audit log
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const title = formData.get("title") as string
  const message = formData.get("message") as string
  const link_url = formData.get("link_url") as string | null
  const link_text = formData.get("link_text") as string | null
  const icon = formData.get("icon") as string | null
  const color_scheme = formData.get("color_scheme") as string
  const pages = formData.getAll("pages") as string[]
  const is_dismissible = formData.get("is_dismissible") === "true"
  const dismiss_duration_hours = formData.get("dismiss_duration_hours")
    ? parseInt(formData.get("dismiss_duration_hours") as string, 10)
    : null
  const starts_at = formData.get("starts_at") as string | null
  const ends_at = formData.get("ends_at") as string | null
  const is_active = formData.get("is_active") === "true"
  const sort_order = parseInt(formData.get("sort_order") as string, 10) || 0

  const { error } = await supabase
    .from("site_banners")
    .update({
      title,
      message,
      link_url: link_url || null,
      link_text: link_text || null,
      icon: icon || null,
      color_scheme,
      pages: pages.length > 0 ? pages : [],
      is_dismissible,
      dismiss_duration_hours,
      starts_at: starts_at || null,
      ends_at: ends_at || null,
      is_active,
      sort_order,
    })
    .eq("id", bannerId)

  if (error) {
    throw new Error(error.message)
  }

  await logAuditEvent({
    userId: user.id,
    action: "banner.updated",
    resourceType: "banner",
    resourceId: bannerId,
    details: {
      title,
    },
  })

  revalidatePath("/admin/banners")
  revalidatePath("/")
}
