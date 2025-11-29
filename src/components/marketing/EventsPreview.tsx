"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, ArrowRight, MessageSquare, Users, PlusCircle } from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"

export interface Workshop {
  id: string
  slug: string
  title: string
  location: string
  event_date: string
  capacity: number | null
}

export interface Discussion {
  id: string
  slug: string | null
  title: string
  author_name: string | null
  comment_count: number
  tags: string[] | null
}

interface EventsPreviewSectionProps {
  workshops: Workshop[]
  discussions: Discussion[]
  communityStats: {
    totalMembers: number
    totalDiscussions: number
  }
}

function formatEventDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function EventsPreviewSection({
  workshops,
  discussions,
  communityStats,
}: EventsPreviewSectionProps) {
  const hasWorkshops = workshops.length > 0
  const hasDiscussions = discussions.length > 0

  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-mono text-3xl lg:text-4xl text-slate-900 mb-4">
            Join the Community
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Learn together at our workshops or connect with builders in The Lab.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left - Upcoming Workshops (50%) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-mono text-xl text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-700" />
                Upcoming Workshops
              </h3>
              <Link href="/events">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-700 hover:text-cyan-600 font-mono"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {hasWorkshops ? (
              <div className="space-y-4">
                {workshops.map((workshop) => (
                  <Link
                    key={workshop.id}
                    href={`/events#${workshop.slug}`}
                    className="block cursor-pointer"
                  >
                    <Card className="bg-white border-slate-200 hover:border-cyan-200 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-mono text-sm text-cyan-700 mb-1">
                              {formatEventDate(workshop.event_date)}
                            </p>
                            <h4 className="font-medium text-slate-900 mb-2">
                              {workshop.title}
                            </h4>
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <MapPin className="w-3.5 h-3.5" />
                              {workshop.location}
                            </div>
                          </div>
                          {workshop.capacity && (
                            <div className="text-right">
                              <span
                                className={`text-xs font-mono px-2 py-1 rounded ${
                                  workshop.capacity <= 5
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {workshop.capacity} spots
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              /* No upcoming events fallback */
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded border border-slate-200 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="font-medium text-slate-900 mb-2">
                  No Upcoming Events
                </h4>
                <p className="text-sm text-slate-500 mb-4">
                  Check back soon for new workshops and events in your area.
                </p>
                <Link href="/events">
                  <Button variant="outline" size="sm" className="font-mono">
                    View Past Events
                  </Button>
                </Link>
              </div>
            )}

            <Link href="/events" className="block mt-auto pt-6">
              <Button
                variant="outline"
                className="w-full border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700 font-mono"
              >
                {hasWorkshops ? "Register for a Workshop" : "View All Events"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Right - The Lab Preview (50%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-mono text-xl text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-700" />
                The Lab
              </h3>
              <Link href="/community">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-700 hover:text-cyan-600 font-mono"
                >
                  Join Now
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Stats Bar - Clean and minimal */}
            <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
              <span>
                <span className="font-mono text-slate-900">{communityStats.totalMembers}</span> Members
              </span>
              <span className="text-slate-300">•</span>
              <span>
                <span className="font-mono text-slate-900">{communityStats.totalDiscussions}</span> Discussions
              </span>
            </div>

            {hasDiscussions ? (
              /* Recent Discussions */
              <div className="space-y-3">
                {discussions.map((discussion) => (
                  <Link
                    key={discussion.id}
                    href={`/community/${discussion.slug || discussion.id}`}
                    className="block p-4 bg-white rounded border border-slate-200 hover:border-cyan-200 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 text-sm truncate">
                          {discussion.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500">
                            @{discussion.author_name || "anonymous"}
                          </span>
                          {discussion.tags && discussion.tags[0] && (
                            <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              #{discussion.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {discussion.comment_count} {discussion.comment_count === 1 ? "reply" : "replies"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* No discussions fallback */
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded border border-slate-200 text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center mb-4">
                  <PlusCircle className="w-6 h-6 text-cyan-600" />
                </div>
                <h4 className="font-medium text-slate-900 mb-2">
                  Be the First to Ask
                </h4>
                <p className="text-sm text-slate-500 mb-4">
                  Start a discussion and help build our community of makers.
                </p>
                <Link href="/community/new">
                  <Button size="sm" className="bg-cyan-700 hover:bg-cyan-600 font-mono">
                    Ask a Question
                  </Button>
                </Link>
              </div>
            )}

            <Link href="/community" className="block mt-auto pt-6">
              <Button className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono">
                Join The Lab
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
