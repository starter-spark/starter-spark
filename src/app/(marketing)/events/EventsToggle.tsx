'use client'

import { useState } from 'react'
import { ChevronDown, MapPin, Clock } from 'lucide-react'
import {
  formatEventDate,
  formatEventRange,
  getEventTypeBadgeClasses,
  getEventTypeLabel,
} from '@/lib/events'

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

function PastEventCard({ event }: { event: Event }) {
  return (
    <div className="relative pl-8 pb-8 last:pb-0 opacity-60">
      {/* Timeline line */}
      <div className="absolute left-0 top-2 bottom-0 w-px bg-slate-200" />

      {/* Timeline dot */}
      <div className="absolute left-0 top-2 w-2 h-2 rounded-full -translate-x-[3px] bg-slate-400" />

      {/* Event card */}
      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="p-6">
          {/* Date badge */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-mono text-sm text-slate-500">
                {formatEventDate(event.event_date)}
              </div>
              <span
                className={`inline-block mt-2 px-2 py-0.5 text-xs font-mono rounded ${getEventTypeBadgeClasses(
                  event.event_type,
                  { muted: true },
                )}`}
              >
                {getEventTypeLabel(event.event_type)}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-mono text-lg text-slate-600 mb-2">
            {event.title}
          </h3>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                {formatEventRange(event.event_date, event.end_date)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface EventsToggleProps {
  pastEvents: Event[]
}

export function EventsToggle({ pastEvents }: EventsToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div>
      <button
        onClick={() => {
          setIsExpanded(!isExpanded)
        }}
        className="flex items-center gap-2 font-mono text-lg text-slate-600 hover:text-slate-900 transition-colors mb-6"
      >
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
        Past Events ({pastEvents.length})
      </button>

      {isExpanded && (
        <div className="relative">
          {pastEvents.map((event) => (
            <PastEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
