"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createEvent } from "../actions"

export function EventForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [address, setAddress] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [eventType, setEventType] = useState("workshop")
  const [rsvpUrl, setRsvpUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [capacity, setCapacity] = useState<number | "">("")
  const [isPublic, setIsPublic] = useState(true)

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/(^-|-$)/g, "")
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createEvent({
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
        router.push("/admin/events")
      }
    })
  }

  return (
    <form onSubmit={(e) => { handleSubmit(e); }} className="space-y-6">
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
              <label htmlFor="title" className="text-sm font-medium text-slate-900">
                Title *
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => { handleTitleChange(e.target.value); }}
                placeholder="Arduino Workshop"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium text-slate-900">
                Slug *
              </label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); }}
                placeholder="arduino-workshop"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-slate-900">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); }}
              placeholder="Join us for a hands-on workshop..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="event_type" className="text-sm font-medium text-slate-900">
                Event Type *
              </label>
              <select
                id="event_type"
                value={eventType}
                onChange={(e) => { setEventType(e.target.value); }}
                required
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2"
              >
                <option value="workshop">Workshop</option>
                <option value="meetup">Meetup</option>
                <option value="conference">Conference</option>
                <option value="hackathon">Hackathon</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="capacity" className="text-sm font-medium text-slate-900">
                Capacity
              </label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => { setCapacity(e.target.value ? Number.parseInt(e.target.value) : ""); }}
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date & Location</CardTitle>
          <CardDescription>When and where the event takes place</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="event_date" className="text-sm font-medium text-slate-900">
                Start Date & Time *
              </label>
              <Input
                id="event_date"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => { setEventDate(e.target.value); }}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end_date" className="text-sm font-medium text-slate-900">
                End Date & Time
              </label>
              <Input
                id="end_date"
                type="datetime-local"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); }}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium text-slate-900">
                Location Name *
              </label>
              <Input
                id="location"
                value={location}
                onChange={(e) => { setLocation(e.target.value); }}
                placeholder="Honolulu Community Center"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium text-slate-900">
                Address
              </label>
              <Input
                id="address"
                value={address}
                onChange={(e) => { setAddress(e.target.value); }}
                placeholder="123 Main St, Honolulu, HI"
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
              <label htmlFor="rsvp_url" className="text-sm font-medium text-slate-900">
                RSVP URL
              </label>
              <Input
                id="rsvp_url"
                type="url"
                value={rsvpUrl}
                onChange={(e) => { setRsvpUrl(e.target.value); }}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="image_url" className="text-sm font-medium text-slate-900">
                Image URL
              </label>
              <Input
                id="image_url"
                type="url"
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); }}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => { setIsPublic(e.target.checked); }}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="is_public" className="text-sm text-slate-700">
              Make this event public (visible on the events page)
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => { router.push("/admin/events"); }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-cyan-700 hover:bg-cyan-600"
          disabled={isPending}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Event
        </Button>
      </div>
    </form>
  )
}
