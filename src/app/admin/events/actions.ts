"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { logAuditEvent } from "@/lib/audit"
import { requireAdmin, requireAdminOrStaff } from "@/lib/auth"

export async function createEvent(formData: {
  title: string
  slug: string
  description?: string
  location: string
  address?: string
  event_date: string
  end_date?: string
  event_type: string
  rsvp_url?: string
  image_url?: string
  capacity?: number
  is_public: boolean
}): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .insert({
      ...formData,
      capacity: formData.capacity || null,
    })
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Error creating event:", error)
    return { error: error.message }
  }

  if (!event) {
    return { error: "Failed to create event" }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: 'event.created',
    resourceType: 'event',
    resourceId: event.id,
    details: {
      title: formData.title,
      slug: formData.slug,
      eventDate: formData.event_date,
      eventType: formData.event_type,
    },
  })

  revalidatePath("/admin/events")
  revalidatePath("/events")

  return { error: null }
}

export async function updateEvent(
  eventId: string,
  formData: {
    title: string
    slug: string
    description?: string
    location: string
    address?: string
    event_date: string
    end_date?: string
    event_type: string
    rsvp_url?: string
    image_url?: string
    capacity?: number
    is_public: boolean
  }
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data: updatedEvent, error: updateError } = await supabaseAdmin
    .from("events")
    .update({
      ...formData,
      capacity: formData.capacity || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .select("id")
    .maybeSingle()

  if (updateError) {
    console.error("Error updating event:", updateError)
    return { error: updateError.message }
  }

  if (!updatedEvent) {
    return { error: "Event not found" }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: 'event.updated',
    resourceType: 'event',
    resourceId: eventId,
    details: {
      title: formData.title,
      slug: formData.slug,
      eventDate: formData.event_date,
    },
  })

  revalidatePath("/admin/events")
  revalidatePath("/events")

  return { error: null }
}

export async function deleteEvent(eventId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) {
    return { error: guard.user ? "Only admins can delete events" : guard.error }
  }
  const user = guard.user

  const { data: deletedEvent, error: deleteError } = await supabaseAdmin
    .from("events")
    .delete()
    .eq("id", eventId)
    .select("id, title, slug")
    .maybeSingle()

  if (deleteError) {
    console.error("Error deleting event:", deleteError)
    return { error: deleteError.message }
  }

  if (!deletedEvent) {
    return { error: "Event not found" }
  }

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: 'event.deleted',
    resourceType: 'event',
    resourceId: eventId,
    details: {
      title: deletedEvent.title,
      slug: deletedEvent.slug,
    },
  })

  revalidatePath("/admin/events")
  revalidatePath("/events")

  return { error: null }
}
