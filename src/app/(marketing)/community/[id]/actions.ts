"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function voteOnPost(postId: string, voteType: 1 | -1) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be signed in to vote", requiresAuth: true }
  }

  // Check if user already voted on this post
  const { data: existingVote } = await supabase
    .from("post_votes")
    .select("id, vote_type")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single()

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Same vote - remove it (toggle off)
      await supabase.from("post_votes").delete().eq("id", existingVote.id)

      // Update post upvotes count
      await supabase.rpc("update_post_upvotes", { p_post_id: postId })
    } else {
      // Different vote - update it
      await supabase
        .from("post_votes")
        .update({ vote_type: voteType })
        .eq("id", existingVote.id)

      // Update post upvotes count
      await supabase.rpc("update_post_upvotes", { p_post_id: postId })
    }
  } else {
    // No existing vote - create new
    const { error } = await supabase.from("post_votes").insert({
      post_id: postId,
      user_id: user.id,
      vote_type: voteType,
    })

    if (error) {
      console.error("Error voting:", error)
      return { error: "Failed to vote. Please try again." }
    }

    // Update post upvotes count
    await supabase.rpc("update_post_upvotes", { p_post_id: postId })
  }

  revalidatePath(`/community/${postId}`)
  return { success: true }
}

export async function voteOnComment(commentId: string, voteType: 1 | -1) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be signed in to vote", requiresAuth: true }
  }

  // Check if user already voted on this comment
  const { data: existingVote } = await supabase
    .from("comment_votes")
    .select("id, vote_type")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .single()

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Same vote - remove it
      await supabase.from("comment_votes").delete().eq("id", existingVote.id)
      await supabase.rpc("update_comment_upvotes", { p_comment_id: commentId })
    } else {
      // Different vote - update it
      await supabase
        .from("comment_votes")
        .update({ vote_type: voteType })
        .eq("id", existingVote.id)
      await supabase.rpc("update_comment_upvotes", { p_comment_id: commentId })
    }
  } else {
    const { error } = await supabase.from("comment_votes").insert({
      comment_id: commentId,
      user_id: user.id,
      vote_type: voteType,
    })

    if (error) {
      console.error("Error voting:", error)
      return { error: "Failed to vote. Please try again." }
    }

    await supabase.rpc("update_comment_upvotes", { p_comment_id: commentId })
  }

  revalidatePath(`/community`)
  return { success: true }
}

export async function reportPost(postId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be signed in to report", requiresAuth: true }
  }

  // Flag the post for review
  const { error } = await supabase
    .from("posts")
    .update({ status: "flagged" })
    .eq("id", postId)

  if (error) {
    console.error("Error reporting:", error)
    return { error: "Failed to report. Please try again." }
  }

  revalidatePath(`/community/${postId}`)
  return { success: true, message: "Post reported for review. Thank you." }
}
