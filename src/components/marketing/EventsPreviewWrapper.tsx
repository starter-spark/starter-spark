import { createClient } from "@/lib/supabase/server"
import { getContents } from "@/lib/content"
import { EventsPreviewSection, type Workshop, type Discussion } from "./EventsPreview"

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
  // Fetch content and events in parallel
  const content = await getContents(Object.keys(DEFAULT_CONTENT), DEFAULT_CONTENT)

  const supabase = await createClient()

  let eventsData: Workshop[] = []
  const discussions: Discussion[] = []
  let memberCount = 0
  let discussionCount = 0

  try {
    const { data, error: eventsError } = await supabase
      .from("events")
      .select("id, slug, title, location, event_date, capacity")
      .eq("is_public", true)
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(3)

    if (eventsError) {
      console.error("Failed to fetch events:", eventsError.message)
    }

    eventsData = (data || []).map((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
      location: event.location,
      event_date: event.event_date,
      capacity: event.capacity,
    }))
  } catch (error) {
    console.error("Failed to fetch events:", error)
  }

  try {
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
          id,
          full_name,
          email,
          avatar_url,
          avatar_seed
        )
      `)
      .order("upvotes", { ascending: false })
      .limit(3)

    if (postsError) {
      console.error("Failed to fetch posts:", postsError.message)
    }

    if (postsData) {
      for (const post of postsData) {
        const { count } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id)

        const profile = post.profiles as unknown as { id: string; full_name: string | null; email: string | null; avatar_url: string | null; avatar_seed: string | null } | null
        discussions.push({
          id: post.id,
          slug: post.slug,
          title: post.title,
          author_id: profile?.id || null,
          author_name: profile?.full_name || null,
          author_email: profile?.email || null,
          author_avatar_url: profile?.avatar_url || null,
          author_avatar_seed: profile?.avatar_seed || null,
          comment_count: count || 0,
          upvotes: post.upvotes || 0,
          status: post.status || "open",
          tags: post.tags,
        })
      }
    }
  } catch (error) {
    console.error("Failed to fetch posts:", error)
  }

  try {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
    memberCount = count || 0
  } catch (error) {
    console.error("Failed to fetch profile count:", error)
  }

  try {
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
    discussionCount = count || 0
  } catch (error) {
    console.error("Failed to fetch discussion count:", error)
  }

  // Transform events data
  return (
    <EventsPreviewSection
      workshops={eventsData}
      discussions={discussions}
      communityStats={{
        totalMembers: memberCount,
        totalDiscussions: discussionCount,
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
