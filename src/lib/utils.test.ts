import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, formatRelativeTime, formatDuration, formatDate } from './utils'

describe('cn (className merge)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar')
  })

  it('should merge conflicting Tailwind classes (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('bg-white', 'bg-slate-50')).toBe('bg-slate-50')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })

  it('should handle object syntax', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })

  it('should return empty string for no arguments', () => {
    expect(cn()).toBe('')
  })

  it('should ignore undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock Date.now() to have consistent tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-11-27T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should return 'just now' for times less than 60 seconds ago", () => {
    expect(formatRelativeTime('2025-11-27T11:59:30Z')).toBe('just now')
    expect(formatRelativeTime('2025-11-27T11:59:55Z')).toBe('just now')
  })

  it('should return minutes for times less than an hour ago', () => {
    expect(formatRelativeTime('2025-11-27T11:58:00Z')).toBe('2 min ago')
    expect(formatRelativeTime('2025-11-27T11:30:00Z')).toBe('30 min ago')
    expect(formatRelativeTime('2025-11-27T11:01:00Z')).toBe('59 min ago')
  })

  it('should return hours for times less than a day ago', () => {
    expect(formatRelativeTime('2025-11-27T10:00:00Z')).toBe('2 hours ago')
    expect(formatRelativeTime('2025-11-27T00:00:00Z')).toBe('12 hours ago')
    expect(formatRelativeTime('2025-11-26T13:00:00Z')).toBe('23 hours ago')
  })

  it('should return days for times less than a week ago', () => {
    expect(formatRelativeTime('2025-11-26T12:00:00Z')).toBe('1 days ago')
    expect(formatRelativeTime('2025-11-24T12:00:00Z')).toBe('3 days ago')
    expect(formatRelativeTime('2025-11-21T12:00:00Z')).toBe('6 days ago')
  })

  it('should return formatted date for times more than a week ago', () => {
    const result = formatRelativeTime('2025-11-01T12:00:00Z')
    // Should be a date string format (depends on locale)
    expect(result).toMatch(/\d/)
  })
})

describe('formatDuration', () => {
  it('should format minutes under 60', () => {
    expect(formatDuration(0)).toBe('0 min')
    expect(formatDuration(1)).toBe('1 min')
    expect(formatDuration(30)).toBe('30 min')
    expect(formatDuration(59)).toBe('59 min')
  })

  it('should format exactly one hour', () => {
    expect(formatDuration(60)).toBe('1h')
  })

  it('should format hours with remaining minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(135)).toBe('2h 15m')
    expect(formatDuration(61)).toBe('1h 1m')
  })

  it('should format exact hours without minutes', () => {
    expect(formatDuration(120)).toBe('2h')
    expect(formatDuration(180)).toBe('3h')
    expect(formatDuration(300)).toBe('5h')
  })

  it('should handle large durations', () => {
    expect(formatDuration(600)).toBe('10h')
    expect(formatDuration(1440)).toBe('24h')
    expect(formatDuration(1441)).toBe('24h 1m')
  })
})

describe('formatDate', () => {
  it("should format date as 'Month Day, Year'", () => {
    // Use explicit timestamps to avoid timezone issues
    // These dates are mid-day UTC to avoid date boundary issues
    expect(formatDate('2025-11-27T12:00:00')).toMatch(/November 2\d, 2025/)
    expect(formatDate('2025-01-01T12:00:00')).toMatch(/January \d, 2025/)
    expect(formatDate('2024-12-25T12:00:00')).toMatch(/December 2\d, 2024/)
  })

  it('should handle ISO date strings', () => {
    expect(formatDate('2025-11-27T12:00:00Z')).toMatch(/November 2\d, 2025/)
  })

  it('should handle various date formats', () => {
    const result1 = formatDate('2025-11-27T12:00:00')
    expect(result1).toContain('2025')
    expect(result1).toContain('November')
  })
})
