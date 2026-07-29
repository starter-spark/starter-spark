import { describe, it, expect } from 'vitest'
import { validateReviewInput } from './validation'

describe('reviews/validateReviewInput', () => {
  it('rejects missing rating', () => {
    const result = validateReviewInput({
      rating: Number.NaN,
      title: '',
      body: 'This is a valid-length review body with enough characters.',
    })
    expect(result.ok).toBe(false)
  })

  it('rejects rating out of range', () => {
    const result = validateReviewInput({
      rating: 6,
      title: '',
      body: 'This is a valid-length review body with enough characters.',
    })
    expect(result.ok).toBe(false)
  })

  it('accepts short (non-empty) body', () => {
    const result = validateReviewInput({
      rating: 5,
      title: '',
      body: 'Ok',
    })
    expect(result.ok).toBe(true)
  })

  it('rejects email addresses', () => {
    const result = validateReviewInput({
      rating: 5,
      title: '',
      body: 'Email me at test@example.com for details about this kit.',
    })
    expect(result.ok).toBe(false)
  })

  it('rejects phone numbers', () => {
    const result = validateReviewInput({
      rating: 5,
      title: '',
      body: 'Call me at 555-123-4567 to talk about the build.',
    })
    expect(result.ok).toBe(false)
  })

  it('rejects too many links', () => {
    const result = validateReviewInput({
      rating: 5,
      title: '',
      body:
        'Links: https://a.com https://b.com https://c.com https://d.com ' +
        'and some more text to meet minimum length requirements.',
    })
    expect(result.ok).toBe(false)
  })

  it('normalizes title and disclosure', () => {
    const result = validateReviewInput({
      rating: 4,
      title: '  Great kit  ',
      body: 'This is a valid-length review body with enough characters for submission.',
      incentiveDisclosure: '  StarterSpark sent this at a discount.  ',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.title).toBe('Great kit')
    expect(result.value.incentiveDisclosure).toBe(
      'StarterSpark sent this at a discount.',
    )
  })
})
