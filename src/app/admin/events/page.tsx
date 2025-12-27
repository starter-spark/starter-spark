import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Calendar, MapPin, Users } from 'lucide-react'
import { EventActions } from './EventActions'

export const metadata = {
  title: 'Events | Admin',
}

async function getEvents() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  return data
}

export default async function EventsPage() {
  const events = await getEvents()

  const now = new Date()
  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= now)
  const pastEvents = events.filter((e) => new Date(e.event_date) < now)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-900">
            Events
          </h1>
          <p className="text-slate-600">
            Manage workshops and community events
          </p>
        </div>
        <Button asChild className="bg-cyan-700 hover:bg-cyan-600">
          <Link href="/admin/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Total Events</p>
          <p className="font-mono text-2xl font-bold text-slate-900">
            {events.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Upcoming</p>
          <p className="font-mono text-2xl font-bold text-cyan-700">
            {upcomingEvents.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Past Events</p>
          <p className="font-mono text-2xl font-bold text-slate-500">
            {pastEvents.length}
          </p>
        </div>
      </div>

      {/* Events Table */}
      {events.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-600">No events yet.</p>
          <Button asChild className="mt-4 bg-cyan-700 hover:bg-cyan-600">
            <Link href="/admin/events/new">Create your first event</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const eventDate = new Date(event.event_date)
                const isPast = eventDate < now
                const isToday = eventDate.toDateString() === now.toDateString()

                return (
                  <TableRow
                    key={event.id}
                    className={isPast ? 'opacity-60' : ''}
                  >
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="truncate font-medium text-slate-900">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="truncate text-xs text-slate-500">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          event.event_type === 'workshop'
                            ? 'border-purple-300 text-purple-700'
                            : event.event_type === 'meetup'
                              ? 'border-cyan-300 text-cyan-700'
                              : 'border-slate-300 text-slate-700'
                        }
                      >
                        {event.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-slate-900">
                            {eventDate.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {eventDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {event.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.capacity ? (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Users className="h-4 w-4 text-slate-400" />
                          {event.capacity}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Unlimited
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isPast ? (
                        <Badge
                          variant="outline"
                          className="border-slate-300 text-slate-500"
                        >
                          Past
                        </Badge>
                      ) : isToday ? (
                        <Badge className="bg-green-100 text-green-700">
                          Today
                        </Badge>
                      ) : event.is_public ? (
                        <Badge className="bg-cyan-100 text-cyan-700">
                          Public
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-300 text-amber-700"
                        >
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <EventActions eventId={event.id} slug={event.slug} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
