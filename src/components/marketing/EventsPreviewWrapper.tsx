import { createClient } from '@/lib/supabase/server'
import { getSingleton } from '@/cms/content'
import {
  EventsPreviewSection,
  type Workshop,
  type Discussion,
} from './EventsPreview'

/**
 * Server component that fetches upcoming events, recent discussions, and content
 * for the homepage preview section. All queries run in parallel for performance.
 */
export async function EventsPreview() {
  const supabase = await createClient()

  // Run ALL queries in parallel - this is the key optimization
  const [
    copy,
    eventsResult,
    postsResult,
    memberCountResult,
    discussionCountResult,
  ] = await Promise.all([
    // 1. Content
    getSingleton('home_community'),

    // 2. Upcoming events
    supabase
      .from('events')
      .select('id, slug, title, location, event_date, capacity')
      .eq('is_public', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(3),

    // 3. Posts with author and comment count in single query (no N+1)
    supabase
      .from('posts')
      .select(
        `
        id,
        slug,
        title,
        tags,
        upvotes,
        status,
        profiles:author_id (
          id,
          full_name,
          email,
          avatar_url,
          avatar_seed
        ),
        comments(count)
      `,
      )
      .order('upvotes', { ascending: false })
      .limit(3),

    // 4. Member count
    supabase.from('profiles').select('*', { count: 'exact', head: true }),

    // 5. Discussion count
    supabase.from('posts').select('*', { count: 'exact', head: true }),
  ])

  // Process events
  let eventsData: Workshop[] = []
  if (eventsResult.error) {
    console.error('Failed to fetch events:', eventsResult.error.message)
  } else {
    eventsData = (eventsResult.data || []).map((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
      location: event.location,
      event_date: event.event_date,
      capacity: event.capacity,
    }))
  }

  // Process posts/discussions
  const discussions: Discussion[] = []
  if (postsResult.error) {
    console.error('Failed to fetch posts:', postsResult.error.message)
  } else if (postsResult.data) {
    for (const post of postsResult.data) {
      const profile = post.profiles as unknown as {
        id: string
        full_name: string | null
        email: string | null
        avatar_url: string | null
        avatar_seed: string | null
      } | null

      // Extract comment count from joined data
      const commentCountData = post.comments as unknown as
        | { count: number }[]
        | null
      const commentCount = commentCountData?.[0]?.count ?? 0

      discussions.push({
        id: post.id,
        slug: post.slug,
        title: post.title,
        author_id: profile?.id || null,
        author_name: profile?.full_name || null,
        author_email: profile?.email || null,
        author_avatar_url: profile?.avatar_url || null,
        author_avatar_seed: profile?.avatar_seed || null,
        comment_count: commentCount,
        upvotes: post.upvotes || 0,
        status: post.status || 'open',
        tags: post.tags,
      })
    }
  }

  // Extract counts
  const memberCount = memberCountResult.count ?? 0
  const discussionCount = discussionCountResult.count ?? 0

  return (
    <EventsPreviewSection
      workshops={eventsData}
      discussions={discussions}
      communityStats={{
        totalMembers: memberCount,
        totalDiscussions: discussionCount,
      }}
      title={copy.title}
      description={copy.description}
      workshopsTitle={copy.workshopsTitle}
      workshopsViewAll={copy.workshopsViewAll}
      workshopsEmptyTitle={copy.workshopsEmptyTitle}
      workshopsEmptyDescription={copy.workshopsEmptyDescription}
      workshopsEmptyCta={copy.workshopsEmptyCta}
      workshopsCta={copy.workshopsCta}
      workshopsCtaEmpty={copy.workshopsCtaEmpty}
      labTitle={copy.labTitle}
      labJoinNow={copy.labJoinNow}
      labMembersLabel={copy.labMembersLabel}
      labDiscussionsLabel={copy.labDiscussionsLabel}
      labEmptyTitle={copy.labEmptyTitle}
      labEmptyDescription={copy.labEmptyDescription}
      labEmptyCta={copy.labEmptyCta}
      labCta={copy.labCta}
    />
  )
}
