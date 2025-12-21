"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Doc Category Actions
export async function createCategory(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const description = formData.get("description") as string | null
  const icon = formData.get("icon") as string | null
  const parentId = formData.get("parent_id") as string | null
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0
  const isPublished = formData.get("is_published") === "true"

  const { error } = await supabase.from("doc_categories").insert({
    name,
    slug,
    description: description || null,
    icon: icon || null,
    parent_id: parentId || null,
    sort_order: sortOrder,
    is_published: isPublished,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/docs/categories")
  revalidatePath("/docs")
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const description = formData.get("description") as string | null
  const icon = formData.get("icon") as string | null
  const parentId = formData.get("parent_id") as string | null
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0
  const isPublished = formData.get("is_published") === "true"

  const { error } = await supabase
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

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/docs/categories")
  revalidatePath("/docs")
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("doc_categories").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/docs/categories")
  revalidatePath("/docs")
  return { success: true }
}

// Doc Page Actions
export async function createDocPage(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
      created_by: user?.id,
      updated_by: user?.id,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/docs")
  revalidatePath("/docs")
  return { success: true, id: data.id }
}

export async function updateDocPage(id: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const categoryId = formData.get("category_id") as string
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const content = formData.get("content") as string | null
  const excerpt = formData.get("excerpt") as string | null
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0
  const isPublished = formData.get("is_published") === "true"

  const { error } = await supabase
    .from("doc_pages")
    .update({
      category_id: categoryId,
      title,
      slug,
      content: content || null,
      excerpt: excerpt || null,
      sort_order: sortOrder,
      is_published: isPublished,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/docs")
  revalidatePath("/docs")
  return { success: true }
}

export async function deleteDocPage(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("doc_pages").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/docs")
  revalidatePath("/docs")
  return { success: true }
}

export async function toggleDocPagePublished(id: string, isPublished: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("doc_pages")
    .update({
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/docs")
  revalidatePath("/docs")
  return { success: true }
}
