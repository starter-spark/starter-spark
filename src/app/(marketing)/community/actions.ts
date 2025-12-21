"use server"

import { createClient } from "@/lib/supabase/server"
import { rateLimitAction } from "@/lib/rate-limit"
import { revalidatePath } from "next/cache"
import { isUuid } from "@/lib/uuid"

const TITLE_MIN = 10
const TITLE_MAX = 200
const CONTENT_MIN = 30
const CONTENT_MAX = 10_000
const ANSWER_MAX = 8_000
const TAG_LIMIT = 5
const TAG_MAX = 30

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags || tags.length === 0) return []
  const cleaned = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= TAG_MAX)
  return Array.from(new Set(cleaned)).slice(0, TAG_LIMIT)
}

export async function createPost(input: {
  title: string
  content: string
  productId?: string | null
  tags?: string[]
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to post.", requiresAuth: true }
  }

  const rateLimitResult = await rateLimitAction(user.id, "communityPost")
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: rateLimitResult.error || "Too many posts. Please try again shortly.",
    }
  }

  const title = input.title.trim()
  if (!title) {
    return { success: false, error: "Please enter a title for your question." }
  }
  if (title.length < TITLE_MIN) {
    return { success: false, error: `Title must be at least ${TITLE_MIN} characters.` }
  }
  if (title.length > TITLE_MAX) {
    return { success: false, error: `Title must be ${TITLE_MAX} characters or fewer.` }
  }

  const content = input.content.trim()
  if (!content) {
    return { success: false, error: "Please describe your question in detail." }
  }
  if (content.length < CONTENT_MIN) {
    return { success: false, error: `Please provide at least ${CONTENT_MIN} characters.` }
  }
  if (content.length > CONTENT_MAX) {
    return { success: false, error: `Question must be ${CONTENT_MAX} characters or fewer.` }
  }

  const productId = input.productId?.trim()
  if (productId && !isUuid(productId)) {
    return { success: false, error: "Invalid product selection." }
  }

  const tags = normalizeTags(input.tags)

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      title,
      content,
      author_id: user.id,
      product_id: productId || null,
      tags: tags.length > 0 ? tags : null,
      status: "open",
    })
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Error posting question:", error)
    return { success: false, error: "Failed to post your question. Please try again." }
  }

  if (!post) {
    return { success: false, error: "Your question was created, but we couldn't load it." }
  }

  revalidatePath("/community")
  return { success: true, postId: post.id }
}

export async function createAnswer(input: { postId: string; content: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to post an answer.", requiresAuth: true }
  }

  const rateLimitResult = await rateLimitAction(user.id, "communityAnswer")
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: rateLimitResult.error || "Too many answers. Please try again shortly.",
    }
  }

  const postId = input.postId.trim()
  if (!isUuid(postId)) {
    return { success: false, error: "Invalid post." }
  }

  const content = input.content.trim()
  if (!content) {
    return { success: false, error: "Please write an answer before submitting." }
  }
  if (content.length > ANSWER_MAX) {
    return { success: false, error: `Answer must be ${ANSWER_MAX} characters or fewer.` }
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content,
  })

  if (error) {
    console.error("Error posting answer:", error)
    return { success: false, error: "Failed to post your answer. Please try again." }
  }

  revalidatePath(`/community/${postId}`)
  return { success: true }
}
