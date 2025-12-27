import { EventForm } from './EventForm'

export const metadata = {
  title: 'Create Event | Admin',
}

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          Create Event
        </h1>
        <p className="text-slate-600">Add a new workshop or community event</p>
      </div>
      <EventForm />
    </div>
  )
}
