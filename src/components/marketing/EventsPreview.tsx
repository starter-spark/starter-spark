'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  Calendar,
  MapPin,
  ArrowRight,
  MessageSquare,
  Users,
  PlusCircle,
  ChevronUp,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { SectionIntro } from './SectionIntro'
import { cn, formatShortDate } from '@/lib/utils'
import {
  ctaGhost,
  ctaOutline,
  ctaOutlineSm,
  ctaPrimary,
  ctaPrimarySm,
} from './cta-classes'

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
  author_id: string | null
  author_name: string | null
  author_email: string | null
  author_avatar_url: string | null
  author_avatar_seed: string | null
  comment_count: number
  upvotes: number
  status: string
  tags: string[] | null
}

export interface EventsPreviewContentProps {
  title?: string
  description?: string
  workshopsTitle?: string
  workshopsViewAll?: string
  workshopsEmptyTitle?: string
  workshopsEmptyDescription?: string
  workshopsEmptyCta?: string
  workshopsCta?: string
  workshopsCtaEmpty?: string
  labTitle?: string
  labJoinNow?: string
  labMembersLabel?: string
  labDiscussionsLabel?: string
  labEmptyTitle?: string
  labEmptyDescription?: string
  labEmptyCta?: string
  labCta?: string
}

interface EventsPreviewSectionProps extends EventsPreviewContentProps {
  workshops: Workshop[]
  discussions: Discussion[]
  communityStats: {
    totalMembers: number
    totalDiscussions: number
  }
}

export function EventsPreviewSection({
  workshops,
  discussions,
  communityStats,
  title = 'Join the Community',
  description = 'Learn together at our workshops or connect with builders in The Lab.',
  workshopsTitle = 'Upcoming Workshops',
  workshopsViewAll = 'View All',
  workshopsEmptyTitle = 'No Upcoming Events',
  workshopsEmptyDescription = 'Check back soon for new workshops and events in your area.',
  workshopsEmptyCta = 'View Past Events',
  workshopsCta = 'Register for a Workshop',
  workshopsCtaEmpty = 'View All Events',
  labTitle = 'The Lab',
  labJoinNow = 'Join Now',
  labMembersLabel = 'Members',
  labDiscussionsLabel = 'Discussions',
  labEmptyTitle = 'Be the First to Ask',
  labEmptyDescription = 'Start a discussion and help build our community of makers.',
  labEmptyCta = 'Ask a Question',
  labCta = 'Join The Lab',
}: EventsPreviewSectionProps) {
  const hasWorkshops = workshops.length > 0
  const hasDiscussions = discussions.length > 0

  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <SectionIntro title={title} description={description} />

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left (50%) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 flex flex-col min-w-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="font-mono text-xl text-slate-900 flex items-center gap-2 break-words">
                <Calendar className="w-5 h-5 text-cyan-700" />
                {workshopsTitle}
              </h3>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={ctaGhost}
              >
                <Link href="/events">
                  {workshopsViewAll}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            {hasWorkshops ? (
              <div className="space-y-4">
                {workshops.map((workshop) => (
                  <Link
                    key={workshop.id}
                    href={`/events#${workshop.slug}`}
                    className="block cursor-pointer"
                  >
                    <Card className="bg-white border-slate-200 hover:border-cyan-200 transition-colors focus-within:ring-2 focus-within:ring-cyan-700/20 focus-within:border-cyan-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-mono text-sm text-cyan-700 mb-1">
                              {formatShortDate(workshop.event_date)}
                            </p>
                            <h4 className="font-medium text-slate-900 mb-2 break-words">
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
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-green-100 text-green-700'
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
                <h4 className="font-medium text-slate-900 mb-2 break-words">
                  {workshopsEmptyTitle}
                </h4>
                <p className="text-sm text-slate-500 mb-4 break-words">
                  {workshopsEmptyDescription}
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={ctaOutlineSm}
                >
                  <Link href="/events">{workshopsEmptyCta}</Link>
                </Button>
              </div>
            )}

            <div className="mt-auto pt-6">
              <Button
                asChild
                variant="outline"
                className={cn(ctaOutline, 'w-full')}
              >
                <Link href="/events">
                  {hasWorkshops ? workshopsCta : workshopsCtaEmpty}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Right (50%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 flex flex-col min-w-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="font-mono text-xl text-slate-900 flex items-center gap-2 break-words">
                <Users className="w-5 h-5 text-cyan-700" />
                {labTitle}
              </h3>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={ctaGhost}
              >
                <Link href="/community">
                  {labJoinNow}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-slate-600">
              <span>
                <span className="font-mono text-slate-900">
                  {communityStats.totalMembers}
                </span>{' '}
                {labMembersLabel}
              </span>
              <span className="text-slate-300">•</span>
              <span>
                <span className="font-mono text-slate-900">
                  {communityStats.totalDiscussions}
                </span>{' '}
                {labDiscussionsLabel}
              </span>
            </div>

            {hasDiscussions ? (
              /* Top discussions */
              <div className="space-y-4">
                {discussions.map((discussion) => (
                  <Link
                    key={discussion.id}
                    href={`/community/${discussion.slug || discussion.id}`}
                    className="block"
                  >
                    <Card className="bg-white border-slate-200 hover:border-cyan-300 transition-colors focus-within:ring-2 focus-within:ring-cyan-700/20 focus-within:border-cyan-300">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Vote/Comment Column */}
                          <div className="flex flex-col items-center gap-1 text-center min-w-[40px]">
                            <div className="flex items-center gap-0.5 text-slate-500">
                              <ChevronUp className="w-4 h-4" />
                              <span className="font-mono text-sm">
                                {discussion.upvotes}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 text-slate-400">
                              <MessageSquare className="w-3 h-3" />
                              <span className="font-mono text-xs">
                                {discussion.comment_count}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              {/* Status Badge */}
                              {discussion.status === 'solved' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-mono rounded flex-shrink-0">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Solved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono rounded flex-shrink-0">
                                  <Circle className="w-3 h-3" />
                                  Open
                                </span>
                              )}
                              <h4 className="font-mono text-sm text-slate-900 truncate">
                                {discussion.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <UserAvatar
                                user={{
                                  id: discussion.author_id || discussion.id,
                                  full_name: discussion.author_name,
                                  email: discussion.author_email,
                                  avatar_url: discussion.author_avatar_url,
                                  avatar_seed: discussion.author_avatar_seed,
                                }}
                                size="sm"
                              />
                              <span>
                                {discussion.author_name || 'Anonymous'}
                              </span>
                              {discussion.tags && discussion.tags[0] && (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    #{discussion.tags[0]}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              /* No discussions fallback */
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded border border-slate-200 text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center mb-4">
                  <PlusCircle className="w-6 h-6 text-cyan-600" />
                </div>
                <h4 className="font-medium text-slate-900 mb-2 break-words">
                  {labEmptyTitle}
                </h4>
                <p className="text-sm text-slate-500 mb-4 break-words">
                  {labEmptyDescription}
                </p>
                <Button
                  asChild
                  size="sm"
                  className={ctaPrimarySm}
                >
                  <Link href="/community/new">{labEmptyCta}</Link>
                </Button>
              </div>
            )}

            <div className="mt-auto pt-6">
              <Button
                asChild
                className={cn(ctaPrimary, 'w-full')}
              >
                <Link href="/community">
                  {labCta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
