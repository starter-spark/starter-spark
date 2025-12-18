import { createClient } from "@/lib/supabase/server"
import { Calendar, MapPin, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"
import { EventsToggle } from "./EventsToggle"
import { getEventSchema, getBreadcrumbSchema } from "@/lib/structured-data"
import { getContents } from "@/lib/content"
import type { Metadata } from "next"
import { siteConfig } from "@/config/site"

const pageTitle = "Events & Workshops"
const pageDescription = "Workshops, competitions, and community events in Hawaii. Learn robotics with hands-on experiences."

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: `${siteConfig.url}/events`,
    siteName: siteConfig.name,
    images: [
      {
        url: `/api/og?title=${encodeURIComponent(pageTitle)}&subtitle=${encodeURIComponent(pageDescription)}&type=event`,
        width: 1200,
        height: 630,
        alt: pageTitle,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [`/api/og?title=${encodeURIComponent(pageTitle)}&subtitle=${encodeURIComponent(pageDescription)}&type=event`],
  },
}

interface Event {
  id: string
  slug: string
  title: string
  description: string | null
  location: string
  address: string | null
  event_date: string
  end_date: string | null
  event_type: string
  rsvp_url: string | null
  image_url: string | null
  capacity: number | null
}

function formatEventDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDateRange(start: string, end: string | null): string {
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null

  // Same day event
  if (endDate && startDate.toDateString() === endDate.toDateString()) {
    return `${formatEventTime(start)} - ${formatEventTime(end as string)}`
  }

  // Multi-day event
  if (endDate) {
    return `${formatEventDate(start)} - ${formatEventDate(end as string)}`
  }

  return formatEventTime(start)
}

function getEventTypeLabel(type: string): string {
  switch (type) {
    case "workshop":
      return "Workshop"
    case "competition":
      return "Competition"
    case "meetup":
      return "Meetup"
    case "exhibition":
      return "Exhibition"
    case "other":
      return "Event"
    default:
      return "Event"
  }
}

function getEventTypeColor(type: string): string {
  switch (type) {
    case "workshop":
      return "bg-cyan-100 text-cyan-700"
    case "competition":
      return "bg-amber-100 text-amber-700"
    case "meetup":
      return "bg-green-100 text-green-700"
    case "exhibition":
      return "bg-purple-100 text-purple-700"
    case "other":
      return "bg-slate-100 text-slate-600"
    default:
      return "bg-slate-100 text-slate-600"
  }
}

function EventCard({ event, isPast = false }: { event: Event; isPast?: boolean }) {
  const eventDate = new Date(event.event_date)

  return (
    <div
      id={event.slug}
      className={`relative pl-8 pb-12 last:pb-0 scroll-mt-32 ${isPast ? "opacity-60" : ""}`}
    >
      {/* Timeline line */}
      <div
        className={`absolute left-0 top-2 bottom-0 w-px ${
          isPast ? "bg-slate-200" : "bg-cyan-200"
        }`}
      />

      {/* Timeline dot */}
      <div
        className={`absolute left-0 top-2 w-2 h-2 rounded-full -translate-x-[3px] ${
          isPast ? "bg-slate-400" : "bg-cyan-700"
        }`}
      />

      {/* Event card */}
      <div className="bg-white border border-slate-200 rounded shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          {/* Date badge */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div
                className={`font-mono text-sm ${
                  isPast ? "text-slate-500" : "text-cyan-700"
                }`}
              >
                {formatEventDate(event.event_date)}
              </div>
              <span
                className={`inline-block mt-2 px-2 py-0.5 text-xs font-mono rounded ${getEventTypeColor(
                  event.event_type
                )}`}
              >
                {getEventTypeLabel(event.event_type)}
              </span>
            </div>

            {/* Month/Day highlight for upcoming events */}
            {!isPast && (
              <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded px-3 py-2">
                <span className="text-xs font-mono text-slate-500 uppercase">
                  {eventDate.toLocaleDateString("en-US", { month: "short" })}
                </span>
                <span className="text-2xl font-mono font-bold text-cyan-700">
                  {eventDate.getDate()}
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3
            className={`font-mono text-xl mb-2 ${
              isPast ? "text-slate-600" : "text-slate-900"
            }`}
          >
            {event.title}
          </h3>

          {/* Description */}
          {event.description && (
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{formatDateRange(event.event_date, event.end_date)}</span>
            </div>
          </div>

          {/* RSVP Link */}
          {event.rsvp_url && !isPast && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                href={event.rsvp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-mono text-cyan-700 hover:text-cyan-600 transition-colors"
              >
                Register / RSVP
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function EventsPage() {
  const supabase = await createClient()

  // Fetch dynamic content
  const content = await getContents(
    ["events.header.title", "events.header.description", "events.empty"],
    {
      "events.header.title": "Learn With Us",
      "events.header.description": "Hands-on workshops, competitions, and community events throughout Hawaii. Join us to learn robotics, meet fellow builders, and grow your skills.",
      "events.empty": "No upcoming events. Check back soon for new workshops and events!",
    }
  )

  // Fetch all public events
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_public", true)
    .order("event_date", { ascending: true })

  if (error) {
    console.error("Error fetching events:", error)
  }

  const now = new Date()

  // Split into upcoming and past events
  const upcomingEvents = (events || []).filter(
    (e) => new Date(e.event_date) >= now
  )
  const pastEvents = (events || [])
    .filter((e) => new Date(e.event_date) < now)
    .reverse() // Most recent past events first

  // Generate structured data for SEO
  const eventSchemas = upcomingEvents.map((event) =>
    getEventSchema({
      name: event.title,
      description: event.description || "",
      startDate: event.event_date,
      endDate: event.end_date || undefined,
      location: event.location,
      address: event.address || undefined,
      url: event.rsvp_url || undefined,
    })
  )

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Events", url: "/events" },
  ])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* JSON-LD Structured Data for SEO */}
      {eventSchemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-100 text-cyan-700 text-sm font-mono rounded mb-6">
            <Calendar className="w-4 h-4" />
            Events & Workshops
          </div>
          <h1 className="font-mono text-4xl lg:text-5xl text-slate-900 mb-4">
            {content["events.header.title"]}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {content["events.header.description"]}
          </p>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="pb-16 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-mono text-2xl text-slate-900 mb-8">
            Upcoming Events
          </h2>

          {upcomingEvents.length > 0 ? (
            <div className="relative">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded p-8 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">
                {content["events.empty"]}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <section className="pb-24 px-6 lg:px-20">
          <div className="max-w-4xl mx-auto">
            <EventsToggle pastEvents={pastEvents} />
          </div>
        </section>
      )}
    </div>
  )
}
