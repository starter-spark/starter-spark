"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { logAuditEvent } from "@/lib/audit"
import { rateLimitAction } from "@/lib/rate-limit"

export async function updatePostStatus(
  postId: string,
  status: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  // Check if user is admin/staff
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

  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
    return { error: "Unauthorized" }
  }

  // Get the post's current status for audit log
  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("status, title")
    .eq("id", postId)
    .single()

  const oldStatus = post?.status || "unknown"

  const { error } = await supabaseAdmin
    .from("posts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", postId)

  if (error) {
    console.error("Error updating post status:", error)
    return { error: error.message }
  }

  // Log the status change to audit log
  await logAuditEvent({
    userId: user.id,
    action: "post.status_changed",
    resourceType: "post",
    resourceId: postId,
    details: {
      postTitle: post?.title,
      oldStatus,
      newStatus: status,
    },
  })

  revalidatePath("/admin/community")

  return { error: null }
}

export async function deletePost(postId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  // Check if user is admin
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
    return { error: "Only admins can delete posts" }
  }

  // Get post info for audit log before deleting
  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("title, author_id")
    .eq("id", postId)
    .single()

  // Get comment IDs first
  const { data: comments } = await supabaseAdmin
    .from("comments")
    .select("id")
    .eq("post_id", postId)

  const commentCount = comments?.length || 0

  // Delete related data
  if (comments && comments.length > 0) {
    const commentIds = comments.map((c) => c.id)
    await supabaseAdmin.from("comment_votes").delete().in("comment_id", commentIds)
  }
  await supabaseAdmin.from("comments").delete().eq("post_id", postId)
  await supabaseAdmin.from("post_votes").delete().eq("post_id", postId)

  const { error } = await supabaseAdmin.from("posts").delete().eq("id", postId)

  if (error) {
    console.error("Error deleting post:", error)
    return { error: error.message }
  }

  // Log the deletion to audit log
  await logAuditEvent({
    userId: user.id,
    action: "post.deleted",
    resourceType: "post",
    resourceId: postId,
    details: {
      postTitle: post?.title,
      authorId: post?.author_id,
      commentsDeleted: commentCount,
    },
  })

  revalidatePath("/admin/community")

  return { error: null }
}
