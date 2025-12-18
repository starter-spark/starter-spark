import { createClient } from "@/lib/supabase/server"
import { getContents } from "@/lib/content"
import { EventsPreviewSection, Workshop, Discussion } from "./EventsPreview"

const DEFAULT_CONTENT = {
  "home.community.title": "Join the Community",
  "home.community.description": "Learn together at our workshops or connect with builders in The Lab.",
  "home.community.workshops.title": "Upcoming Workshops",
  "home.community.workshops.viewAll": "View All",
  "home.community.workshops.empty.title": "No Upcoming Events",
  "home.community.workshops.empty.description": "Check back soon for new workshops and events in your area.",
  "home.community.workshops.empty.cta": "View Past Events",
  "home.community.workshops.cta": "Register for a Workshop",
  "home.community.workshops.ctaEmpty": "View All Events",
  "home.community.lab.title": "The Lab",
  "home.community.lab.joinNow": "Join Now",
  "home.community.lab.membersLabel": "Members",
  "home.community.lab.discussionsLabel": "Discussions",
  "home.community.lab.empty.title": "Be the First to Ask",
  "home.community.lab.empty.description": "Start a discussion and help build our community of makers.",
  "home.community.lab.empty.cta": "Ask a Question",
  "home.community.lab.cta": "Join The Lab",
}

/**
 * Server component that fetches upcoming events, recent discussions, and content
 * for the homepage preview section
 */
export async function EventsPreview() {
  const supabase = await createClient()

  // Fetch content and events in parallel
  const [content, eventsResult] = await Promise.all([
    getContents(Object.keys(DEFAULT_CONTENT), DEFAULT_CONTENT),
    supabase
      .from("events")
      .select("id, slug, title, location, event_date, capacity")
      .eq("is_public", true)
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(3),
  ])

  const { data: eventsData, error: eventsError } = eventsResult

  if (eventsError) {
    console.error("Failed to fetch events:", eventsError.message)
  }

  // Fetch top discussions by upvotes with author info
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(`
      id,
      slug,
      title,
      tags,
      upvotes,
      status,
      profiles:author_id (
        full_name
      )
    `)
    .order("upvotes", { ascending: false })
    .limit(3)

  if (postsError) {
    console.error("Failed to fetch posts:", postsError.message)
  }

  // Get comment counts for each post
  const discussions: Discussion[] = []
  if (postsData) {
    for (const post of postsData) {
      const { count } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id)

      const profile = post.profiles as unknown as { full_name: string | null } | null
      discussions.push({
        id: post.id,
        slug: post.slug,
        title: post.title,
        author_name: profile?.full_name || null,
        comment_count: count || 0,
        upvotes: post.upvotes || 0,
        status: post.status || "open",
        tags: post.tags,
      })
    }
  }

  // Get community stats
  const { count: memberCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  const { count: discussionCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })

  // Transform events data
  const workshops: Workshop[] = (eventsData || []).map((event) => ({
    id: event.id,
    slug: event.slug,
    title: event.title,
    location: event.location,
    event_date: event.event_date,
    capacity: event.capacity,
  }))

  return (
    <EventsPreviewSection
      workshops={workshops}
      discussions={discussions}
      communityStats={{
        totalMembers: memberCount || 0,
        totalDiscussions: discussionCount || 0,
      }}
      title={content["home.community.title"]}
      description={content["home.community.description"]}
      workshopsTitle={content["home.community.workshops.title"]}
      workshopsViewAll={content["home.community.workshops.viewAll"]}
      workshopsEmptyTitle={content["home.community.workshops.empty.title"]}
      workshopsEmptyDescription={content["home.community.workshops.empty.description"]}
      workshopsEmptyCta={content["home.community.workshops.empty.cta"]}
      workshopsCta={content["home.community.workshops.cta"]}
      workshopsCtaEmpty={content["home.community.workshops.ctaEmpty"]}
      labTitle={content["home.community.lab.title"]}
      labJoinNow={content["home.community.lab.joinNow"]}
      labMembersLabel={content["home.community.lab.membersLabel"]}
      labDiscussionsLabel={content["home.community.lab.discussionsLabel"]}
      labEmptyTitle={content["home.community.lab.empty.title"]}
      labEmptyDescription={content["home.community.lab.empty.description"]}
      labEmptyCta={content["home.community.lab.empty.cta"]}
      labCta={content["home.community.lab.cta"]}
    />
  )
}
