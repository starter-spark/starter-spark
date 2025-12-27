'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimitAction } from '@/lib/rate-limit'
import { isUuid } from '@/lib/uuid'
import { revalidatePath } from 'next/cache'

/**
 * Check if the current user is banned from forums
 */
async function checkBanStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_banned_from_forums', {
    user_id: userId,
  })
  if (error) {
    console.error('Error checking ban status:', error)
    return false // Fail open, let RLS handle it.
  }
  return data === true
}

export async function voteOnPost(postId: string, voteType: 1 | -1) {
  if (!isUuid(postId)) {
    return { error: 'Invalid post.', requiresAuth: false }
  }
  if (voteType !== 1 && voteType !== -1) {
    return { error: 'Invalid vote.', requiresAuth: false }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to vote', requiresAuth: true }
  }

  // Check if user is banned from forums
  if (await checkBanStatus(supabase, user.id)) {
    return {
      error:
        'Your account has been restricted from participating in the community forums.',
    }
  }

  const rateLimitResult = await rateLimitAction(user.id, 'communityVote')
  if (!rateLimitResult.success) {
    return {
      error:
        rateLimitResult.error || 'Too many votes. Please try again shortly.',
    }
  }

  // Check if user already voted on this post
  const { data: existingVote, error: existingVoteError } = await supabase
    .from('post_votes')
    .select('id, vote_type')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingVoteError) {
    console.error('Error checking existing post vote:', existingVoteError)
    return { error: 'Failed to load your vote. Please try again.' }
  }

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Same vote, remove it (toggle off).
      const { error: deleteError } = await supabase
        .from('post_votes')
        .delete()
        .eq('id', existingVote.id)

      if (deleteError) {
        console.error('Error removing vote:', deleteError)
        return { error: 'Failed to remove vote. Please try again.' }
      }

      // Update post upvotes count
      const { error: rpcError } = await supabase.rpc('update_post_upvotes', {
        p_post_id: postId,
      })
      if (rpcError) {
        console.error('Error updating vote count:', rpcError)
      }
    } else {
      // Different vote, update it.
      const { error: updateError } = await supabase
        .from('post_votes')
        .update({ vote_type: voteType })
        .eq('id', existingVote.id)

      if (updateError) {
        console.error('Error updating vote:', updateError)
        return { error: 'Failed to change vote. Please try again.' }
      }

      // Update post upvotes count
      const { error: rpcError } = await supabase.rpc('update_post_upvotes', {
        p_post_id: postId,
      })
      if (rpcError) {
        console.error('Error updating vote count:', rpcError)
      }
    }
  } else {
    // No existing vote, create new.
    const { error } = await supabase.from('post_votes').insert({
      post_id: postId,
      user_id: user.id,
      vote_type: voteType,
    })

    if (error) {
      console.error('Error voting:', error)
      return { error: 'Failed to vote. Please try again.' }
    }

    // Update post upvotes count
    const { error: rpcError } = await supabase.rpc('update_post_upvotes', {
      p_post_id: postId,
    })
    if (rpcError) {
      console.error('Error updating vote count:', rpcError)
    }
  }

  revalidatePath(`/community/${postId}`)
  return { success: true }
}

export async function voteOnComment(commentId: string, voteType: 1 | -1) {
  if (!isUuid(commentId)) {
    return { error: 'Invalid comment.', requiresAuth: false }
  }
  if (voteType !== 1 && voteType !== -1) {
    return { error: 'Invalid vote.', requiresAuth: false }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to vote', requiresAuth: true }
  }

  // Check if user is banned from forums
  if (await checkBanStatus(supabase, user.id)) {
    return {
      error:
        'Your account has been restricted from participating in the community forums.',
    }
  }

  const rateLimitResult = await rateLimitAction(user.id, 'communityVote')
  if (!rateLimitResult.success) {
    return {
      error:
        rateLimitResult.error || 'Too many votes. Please try again shortly.',
    }
  }

  // Check if user already voted on this comment
  const { data: existingVote, error: existingVoteError } = await supabase
    .from('comment_votes')
    .select('id, vote_type')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingVoteError) {
    console.error('Error checking existing comment vote:', existingVoteError)
    return { error: 'Failed to load your vote. Please try again.' }
  }

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Same vote, remove it.
      const { error: deleteError } = await supabase
        .from('comment_votes')
        .delete()
        .eq('id', existingVote.id)

      if (deleteError) {
        console.error('Error removing vote:', deleteError)
        return { error: 'Failed to remove vote. Please try again.' }
      }

      const { error: rpcError } = await supabase.rpc('update_comment_upvotes', {
        p_comment_id: commentId,
      })
      if (rpcError) {
        console.error('Error updating vote count:', rpcError)
      }
    } else {
      // Different vote, update it.
      const { error: updateError } = await supabase
        .from('comment_votes')
        .update({ vote_type: voteType })
        .eq('id', existingVote.id)

      if (updateError) {
        console.error('Error updating vote:', updateError)
        return { error: 'Failed to change vote. Please try again.' }
      }

      const { error: rpcError } = await supabase.rpc('update_comment_upvotes', {
        p_comment_id: commentId,
      })
      if (rpcError) {
        console.error('Error updating vote count:', rpcError)
      }
    }
  } else {
    const { error } = await supabase.from('comment_votes').insert({
      comment_id: commentId,
      user_id: user.id,
      vote_type: voteType,
    })

    if (error) {
      console.error('Error voting:', error)
      return { error: 'Failed to vote. Please try again.' }
    }

    const { error: rpcError } = await supabase.rpc('update_comment_upvotes', {
      p_comment_id: commentId,
    })
    if (rpcError) {
      console.error('Error updating vote count:', rpcError)
    }
  }

  revalidatePath(`/community`)
  return { success: true }
}

export async function reportPost(postId: string) {
  if (!isUuid(postId)) {
    return { error: 'Invalid post.', requiresAuth: false }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to report', requiresAuth: true }
  }

  // Check if user is banned from forums
  if (await checkBanStatus(supabase, user.id)) {
    return {
      error:
        'Your account has been restricted from participating in the community forums.',
    }
  }

  const rateLimitResult = await rateLimitAction(user.id, 'communityReport')
  if (!rateLimitResult.success) {
    return {
      error:
        rateLimitResult.error || 'Too many reports. Please try again later.',
    }
  }

  const { error: reportError } = await supabase.from('post_reports').insert({
    post_id: postId,
    reporter_id: user.id,
  })

  if (reportError) {
    if (reportError.code === '23505') {
      return {
        success: true,
        message: "Thanks for reporting. We've already noted this post.",
      }
    }
    console.error('Error reporting:', reportError)
    return { error: 'Failed to report. Please try again.' }
  }

  const { error: updateError } = await supabaseAdmin
    .from('posts')
    .update({ status: 'flagged' })
    .eq('id', postId)
    .neq('status', 'flagged')

  if (updateError) {
    console.error('Error flagging post:', updateError)
  }

  revalidatePath(`/community/${postId}`)
  revalidatePath('/community')
  return { success: true, message: 'Post reported for review. Thank you.' }
}
