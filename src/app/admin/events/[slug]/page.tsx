import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EditEventForm } from "./EditEventForm"

export const metadata = {
  title: "Edit Event | Admin",
}

async function getEvent(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    console.error("Error fetching event:", error)
    throw new Error("Failed to load event")
  }

  return data
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">Edit Event</h1>
        <p className="text-slate-600">Update event details</p>
      </div>
      <EditEventForm event={event} />
    </div>
  )
}
