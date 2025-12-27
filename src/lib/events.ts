import { formatDate, formatShortMonth, type DateInput } from '@/lib/utils'

const eventDateOptions: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}

const eventTypeLabels = new Map<string, string>([
  ['workshop', 'Workshop'],
  ['competition', 'Competition'],
  ['meetup', 'Meetup'],
  ['exhibition', 'Exhibition'],
  ['other', 'Event'],
])

const eventTypeClasses = new Map<string, string>([
  ['workshop', 'bg-cyan-100 text-cyan-700'],
  ['competition', 'bg-amber-100 text-amber-700'],
  ['meetup', 'bg-green-100 text-green-700'],
  ['exhibition', 'bg-purple-100 text-purple-700'],
  ['other', 'bg-slate-100 text-slate-600'],
])

export function formatEventDate(value: DateInput): string {
  return formatDate(value, eventDateOptions)
}

export function formatEventTime(value: DateInput): string {
  const date =
    typeof value === 'string' || typeof value === 'number'
      ? new Date(value)
      : value
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatEventRange(
  start: DateInput,
  end?: DateInput | null,
): string {
  const startDate =
    typeof start === 'string' || typeof start === 'number'
      ? new Date(start)
      : start
  const endDate =
    typeof end === 'string' || typeof end === 'number'
      ? new Date(end)
      : end
        ? end
        : null

  if (endDate && startDate.toDateString() === endDate.toDateString()) {
    return `${formatEventTime(startDate)} - ${formatEventTime(endDate)}`
  }

  if (endDate) {
    return `${formatEventDate(startDate)} - ${formatEventDate(endDate)}`
  }

  return formatEventTime(startDate)
}

export function getEventTypeLabel(type: string): string {
  return eventTypeLabels.get(type) ?? 'Event'
}

export function getEventTypeBadgeClasses(
  type: string,
  options: { muted?: boolean } = {},
): string {
  if (options.muted) return 'bg-slate-100 text-slate-600'
  return eventTypeClasses.get(type) ?? 'bg-slate-100 text-slate-600'
}

export function formatEventMonth(value: DateInput): string {
  return formatShortMonth(value)
}
