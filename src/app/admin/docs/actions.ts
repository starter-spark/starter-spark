"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { requireAdminOrStaff } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"

// Doc Category Actions
export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const description = formData.get("description") as string | null
  const icon = formData.get("icon") as string | null
  const parentId = formData.get("parent_id") as string | null
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0
  const isPublished = formData.get("is_published") === "true"

  const { data, error } = await supabase
    .from("doc_categories")
    .insert({
      name,
      slug,
      description: description || null,
      icon: icon || null,
      parent_id: parentId || null,
      sort_order: sortOrder,
      is_published: isPublished,
    })
    .select("id, name, slug")
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: "Failed to create category" }
  }

  await logAuditEvent({
    userId: user.id,
    action: "doc_category.created",
    resourceType: "doc_category",
    resourceId: data.id,
    details: {
      name: data.name,
      slug: data.slug,
      is_published: isPublished,
    },
  })

  revalidatePath("/admin/docs/categories")
  revalidatePath("/docs")
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const description = formData.get("description") as string | null
  const icon = formData.get("icon") as string | null
  const parentId = formData.get("parent_id") as string | null
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0
  const isPublished = formData.get("is_published") === "true"

  const { data, error } = await supabase
    .from("doc_categories")
    .update({
      name,
      slug,
      description: description || null,
      icon: icon || null,
      parent_id: parentId || null,
      sort_order: sortOrder,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, name, slug")
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: "Category not found" }
  }

  await logAuditEvent({
    userId: user.id,
    action: "doc_category.updated",
    resourceType: "doc_category",
    resourceId: data.id,
    details: {
      name: data.name,
      slug: data.slug,
      is_published: isPublished,
    },
  })

  revalidatePath("/admin/docs/categories")
  revalidatePath("/docs")
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data, error } = await supabase
    .from("doc_categories")
    .delete()
    .eq("id", id)
    .select("id, name, slug")
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: "Category not found" }
  }

  await logAuditEvent({
    userId: user.id,
    action: "doc_category.deleted",
    resourceType: "doc_category",
    resourceId: data.id,
    details: {
      name: data.name,
      slug: data.slug,
    },
  })

  revalidatePath("/admin/docs/categories")
  revalidatePath("/docs")
  return { success: true }
}

// Doc Page Actions
export async function createDocPage(formData: FormData) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const categoryId = formData.get("category_id") as string
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const content = formData.get("content") as string | null
  const excerpt = formData.get("excerpt") as string | null
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0
  const isPublished = formData.get("is_published") === "true"

  const { data, error } = await supabase
    .from("doc_pages")
    .insert({
      category_id: categoryId,
      title,
      slug,
      content: content || null,
      excerpt: excerpt || null,
      sort_order: sortOrder,
      is_published: isPublished,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id, title, slug, is_published")
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: "Failed to create doc page" }
  }

  await logAuditEvent({
    userId: user.id,
    action: "doc_page.created",
    resourceType: "doc_page",
    resourceId: data.id,
    details: {
      title: data.title,
      slug: data.slug,
      category_id: categoryId,
      is_published: data.is_published,
    },
  })

  revalidatePath("/admin/docs")
  revalidatePath("/docs")
  return { success: true, id: data.id }
}

export async function updateDocPage(id: string, formData: FormData) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const categoryId = formData.get("category_id") as string
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const content = formData.get("content") as string | null
  const excerpt = formData.get("excerpt") as string | null
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0
  const isPublished = formData.get("is_published") === "true"

  const { data, error } = await supabase
    .from("doc_pages")
    .update({
      category_id: categoryId,
      title,
      slug,
      content: content || null,
      excerpt: excerpt || null,
      sort_order: sortOrder,
      is_published: isPublished,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, title, slug, is_published")
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: "Doc page not found" }
  }

  await logAuditEvent({
    userId: user.id,
    action: "doc_page.updated",
    resourceType: "doc_page",
    resourceId: data.id,
    details: {
      title: data.title,
      slug: data.slug,
      category_id: categoryId,
      is_published: data.is_published,
    },
  })

  revalidatePath("/admin/docs")
  revalidatePath("/docs")
  return { success: true }
}

export async function deleteDocPage(id: string) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data, error } = await supabase
    .from("doc_pages")
    .delete()
    .eq("id", id)
    .select("id, title, slug")
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: "Doc page not found" }
  }

  await logAuditEvent({
    userId: user.id,
    action: "doc_page.deleted",
    resourceType: "doc_page",
    resourceId: data.id,
    details: {
      title: data.title,
      slug: data.slug,
    },
  })

  revalidatePath("/admin/docs")
  revalidatePath("/docs")
  return { success: true }
}

export async function toggleDocPagePublished(id: string, isPublished: boolean) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data, error } = await supabase
    .from("doc_pages")
    .update({
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, title, slug")
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: "Doc page not found" }
  }

  await logAuditEvent({
    userId: user.id,
    action: isPublished ? "doc_page.published" : "doc_page.unpublished",
    resourceType: "doc_page",
    resourceId: data.id,
    details: {
      title: data.title,
      slug: data.slug,
    },
  })

  revalidatePath("/admin/docs")
  revalidatePath("/docs")
  return { success: true }
}
