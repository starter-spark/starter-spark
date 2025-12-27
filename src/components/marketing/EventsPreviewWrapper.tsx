import { createClient } from '@/lib/supabase/server'
import { getContents } from '@/lib/content'
import {
  EventsPreviewSection,
  type Workshop,
  type Discussion,
} from './EventsPreview'

const DEFAULT_CONTENT = {
  'home.community.title': 'Join the Community',
  'home.community.description':
    'Learn together at our workshops or connect with builders in The Lab.',
  'home.community.workshops.title': 'Upcoming Workshops',
  'home.community.workshops.viewAll': 'View All',
  'home.community.workshops.empty.title': 'No Upcoming Events',
  'home.community.workshops.empty.description':
    'Check back soon for new workshops and events in your area.',
  'home.community.workshops.empty.cta': 'View Past Events',
  'home.community.workshops.cta': 'Register for a Workshop',
  'home.community.workshops.ctaEmpty': 'View All Events',
  'home.community.lab.title': 'The Lab',
  'home.community.lab.joinNow': 'Join Now',
  'home.community.lab.membersLabel': 'Members',
  'home.community.lab.discussionsLabel': 'Discussions',
  'home.community.lab.empty.title': 'Be the First to Ask',
  'home.community.lab.empty.description':
    'Start a discussion and help build our community of makers.',
  'home.community.lab.empty.cta': 'Ask a Question',
  'home.community.lab.cta': 'Join The Lab',
}

/**
 * Server component that fetches upcoming events, recent discussions, and content
 * for the homepage preview section. All queries run in parallel for performance.
 */
export async function EventsPreview() {
  const supabase = await createClient()

  // Run ALL queries in parallel - this is the key optimization
  const [
    content,
    eventsResult,
    postsResult,
    memberCountResult,
    discussionCountResult,
  ] = await Promise.all([
    // 1. Content
    getContents(Object.keys(DEFAULT_CONTENT), DEFAULT_CONTENT),

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
      title={content['home.community.title']}
      description={content['home.community.description']}
      workshopsTitle={content['home.community.workshops.title']}
      workshopsViewAll={content['home.community.workshops.viewAll']}
      workshopsEmptyTitle={content['home.community.workshops.empty.title']}
      workshopsEmptyDescription={
        content['home.community.workshops.empty.description']
      }
      workshopsEmptyCta={content['home.community.workshops.empty.cta']}
      workshopsCta={content['home.community.workshops.cta']}
      workshopsCtaEmpty={content['home.community.workshops.ctaEmpty']}
      labTitle={content['home.community.lab.title']}
      labJoinNow={content['home.community.lab.joinNow']}
      labMembersLabel={content['home.community.lab.membersLabel']}
      labDiscussionsLabel={content['home.community.lab.discussionsLabel']}
      labEmptyTitle={content['home.community.lab.empty.title']}
      labEmptyDescription={content['home.community.lab.empty.description']}
      labEmptyCta={content['home.community.lab.empty.cta']}
      labCta={content['home.community.lab.cta']}
    />
  )
}
