"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { logAuditEvent } from "@/lib/audit"
import { rateLimitAction } from "@/lib/rate-limit"
import { requireAdmin, requireAdminOrStaff } from "@/lib/auth"

export async function updatePostStatus(
  postId: string,
  status: string
): Promise<{ error: string | null }> {
  const validStatuses = ["published", "pending", "flagged"] as const
  if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
    return { error: "Invalid status" }
  }

  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  // Rate limit admin actions
  const rateLimitResult = await rateLimitAction(user.id, "adminMutation")
  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error || "Rate limited" }
  }

  // Get the post's current status for audit log
  const { data: post, error: postError } = await supabaseAdmin
    .from("posts")
    .select("status, title")
    .eq("id", postId)
    .maybeSingle()

  if (postError) {
    console.error("Error fetching post:", postError)
    return { error: postError.message }
  }

  if (!post) {
    return { error: "Post not found" }
  }

  const oldStatus = post?.status || "unknown"

  const { data: updatedPost, error: updateError } = await supabaseAdmin
    .from("posts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .select("id")
    .maybeSingle()

  if (updateError) {
    console.error("Error updating post status:", updateError)
    return { error: updateError.message }
  }

  if (!updatedPost) {
    return { error: "Post not found" }
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

  const guard = await requireAdmin(supabase)
  if (!guard.ok) {
    return { error: guard.user ? "Only admins can delete posts" : guard.error }
  }
  const user = guard.user

  // Rate limit admin actions
  const rateLimitResult = await rateLimitAction(user.id, "adminMutation")
  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error || "Rate limited" }
  }

  const { count: commentCount, error: countError } = await supabaseAdmin
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)

  if (countError) {
    console.error("Error counting comments:", countError)
    return { error: countError.message }
  }

  // Delete the post and rely on DB ON DELETE CASCADE to clean up comments/votes.
  const { data: deletedPost, error: deleteError } = await supabaseAdmin
    .from("posts")
    .delete()
    .eq("id", postId)
    .select("id, title, author_id")
    .maybeSingle()

  if (deleteError) {
    console.error("Error deleting post:", deleteError)
    return { error: deleteError.message }
  }

  if (!deletedPost) {
    return { error: "Post not found" }
  }

  // Log the deletion to audit log
  await logAuditEvent({
    userId: user.id,
    action: "post.deleted",
    resourceType: "post",
    resourceId: postId,
    details: {
      postTitle: deletedPost.title,
      authorId: deletedPost.author_id,
      commentsDeleted: commentCount || 0,
    },
  })

  revalidatePath("/admin/community")

  return { error: null }
}
