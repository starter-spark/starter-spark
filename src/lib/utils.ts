import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600)
    return String(Math.floor(diffInSeconds / 60)) + ' min ago'
  if (diffInSeconds < 86_400)
    return String(Math.floor(diffInSeconds / 3600)) + ' hours ago'
  if (diffInSeconds < 604_800)
    return String(Math.floor(diffInSeconds / 86_400)) + ' days ago'
  return date.toLocaleDateString()
}

/**
 * Formats duration in minutes to human-readable string (e.g., "1h 30m", "45 min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return String(minutes) + ' min'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0
    ? String(hours) + 'h ' + String(mins) + 'm'
    : String(hours) + 'h'
}

/**
 * Formats a date string for display (e.g., "November 27, 2025")
 */
export type DateInput = string | Date | number

const longDateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

const shortDateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

const shortMonthOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
}

export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = longDateOptions,
  locale: string | string[] = 'en-US',
): string {
  const date =
    typeof value === 'string' || typeof value === 'number'
      ? new Date(value)
      : value
  return date.toLocaleDateString(locale, options)
}

export function formatShortDate(
  value: DateInput,
  locale: string | string[] = 'en-US',
): string {
  return formatDate(value, shortDateOptions, locale)
}

export function formatShortMonth(
  value: DateInput,
  locale: string | string[] = 'en-US',
): string {
  return formatDate(value, shortMonthOptions, locale)
}
