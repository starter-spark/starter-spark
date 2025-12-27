'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { updateEvent, deleteEvent } from '../actions'
import {
  AdminLabel,
  AdminSelect,
} from '@/components/admin/form-controls'

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
  is_public: boolean
}

interface EditEventFormProps {
  event: Event
}

function formatDateForInput(isoString: string): string {
  const date = new Date(isoString)
  return date.toISOString().slice(0, 16)
}

export function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState(event.title)
  const [slug, setSlug] = useState(event.slug)
  const [description, setDescription] = useState(event.description || '')
  const [location, setLocation] = useState(event.location)
  const [address, setAddress] = useState(event.address || '')
  const [eventDate, setEventDate] = useState(
    formatDateForInput(event.event_date),
  )
  const [endDate, setEndDate] = useState(
    event.end_date ? formatDateForInput(event.end_date) : '',
  )
  const [eventType, setEventType] = useState(event.event_type)
  const [rsvpUrl, setRsvpUrl] = useState(event.rsvp_url || '')
  const [imageUrl, setImageUrl] = useState(event.image_url || '')
  const [capacity, setCapacity] = useState<number | ''>(event.capacity || '')
  const [isPublic, setIsPublic] = useState(event.is_public)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await updateEvent(event.id, {
        title,
        slug,
        description: description || undefined,
        location,
        address: address || undefined,
        event_date: new Date(eventDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        event_type: eventType,
        rsvp_url: rsvpUrl || undefined,
        image_url: imageUrl || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        is_public: isPublic,
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin/events')
      }
    })
  }

  const handleDelete = () => {
    if (
      !confirm(
        'Are you sure you want to delete this event? This cannot be undone.',
      )
    ) {
      return
    }

    startTransition(async () => {
      const result = await deleteEvent(event.id)

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin/events')
      }
    })
  }

  return (
    <form
      onSubmit={(e) => {
        handleSubmit(e)
      }}
      className="space-y-6"
    >
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Basic information about the event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <AdminLabel htmlFor="title">Title *</AdminLabel>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <AdminLabel htmlFor="slug">Slug *</AdminLabel>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <AdminLabel htmlFor="description">Description</AdminLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
              }}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <AdminLabel htmlFor="event_type">Event Type *</AdminLabel>
              <AdminSelect
                id="event_type"
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value)
                }}
                required
              >
                <option value="workshop">Workshop</option>
                <option value="meetup">Meetup</option>
                <option value="conference">Conference</option>
                <option value="hackathon">Hackathon</option>
                <option value="other">Other</option>
              </AdminSelect>
            </div>
            <div className="space-y-2">
              <AdminLabel htmlFor="capacity">Capacity</AdminLabel>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => {
                  setCapacity(
                    e.target.value ? Number.parseInt(e.target.value) : '',
                  )
                }}
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date & Location</CardTitle>
          <CardDescription>
            When and where the event takes place
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <AdminLabel htmlFor="event_date">
                Start Date & Time *
              </AdminLabel>
              <Input
                id="event_date"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => {
                  setEventDate(e.target.value)
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <AdminLabel htmlFor="end_date">End Date & Time</AdminLabel>
              <Input
                id="end_date"
                type="datetime-local"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <AdminLabel htmlFor="location">Location Name *</AdminLabel>
              <Input
                id="location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <AdminLabel htmlFor="address">Address</AdminLabel>
              <Input
                id="address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Options</CardTitle>
          <CardDescription>Links and visibility settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <AdminLabel htmlFor="rsvp_url">RSVP URL</AdminLabel>
              <Input
                id="rsvp_url"
                type="url"
                value={rsvpUrl}
                onChange={(e) => {
                  setRsvpUrl(e.target.value)
                }}
              />
            </div>
            <div className="space-y-2">
              <AdminLabel htmlFor="image_url">Image URL</AdminLabel>
              <Input
                id="image_url"
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => {
                setIsPublic(e.target.checked)
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="is_public" className="text-sm text-slate-700">
              Make this event public (visible on the events page)
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => {
            handleDelete()
          }}
          disabled={isPending}
        >
          Delete Event
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              router.push('/admin/events')
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-cyan-700 hover:bg-cyan-600"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}
