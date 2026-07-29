import {
  REVIEW_BODY_MAX,
  REVIEW_DISCLOSURE_MAX,
  REVIEW_MAX_LINKS,
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
  REVIEW_TITLE_MAX,
} from './constants'

function countLinks(text: string): number {
  const matches = text.match(/https?:\/\//gi)
  return matches ? matches.length : 0
}

function containsEmail(text: string): boolean {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
}

function containsPhoneNumber(text: string): boolean {
  // Heuristic phone detection (10 digits with common separators), written
  // without complex regexes to keep runtime predictable.
  let digits = 0
  let separatorRun = 0

  for (const ch of text) {
    if (ch >= '0' && ch <= '9') {
      digits += 1
      separatorRun = 0
      if (digits >= 10) return true
      continue
    }

    if (digits === 0) continue

    const isCommonSeparator =
      ch === ' ' || ch === '-' || ch === '.' || ch === '(' || ch === ')'

    if (isCommonSeparator) {
      separatorRun += 1
      if (separatorRun > 4) {
        digits = 0
        separatorRun = 0
      }
      continue
    }

    digits = 0
    separatorRun = 0
  }

  return false
}

export type ValidatedReviewInput = {
  rating: 1 | 2 | 3 | 4 | 5
  title: string | null
  body: string
  incentiveDisclosure: string | null
}

export function validateReviewInput(input: {
  rating: number
  title: string
  body: string
  incentiveDisclosure?: string | null
}): { ok: true; value: ValidatedReviewInput } | { ok: false; error: string } {
  const rating = Number(input.rating)
  if (!Number.isFinite(rating)) {
    return { ok: false, error: 'Please select a star rating.' }
  }
  if (rating < REVIEW_RATING_MIN || rating > REVIEW_RATING_MAX) {
    return { ok: false, error: 'Rating must be between 1 and 5 stars.' }
  }

  const body = input.body.trim()
  if (!body) {
    return { ok: false, error: 'Please write a review before submitting.' }
  }
  if (body.length > REVIEW_BODY_MAX) {
    return {
      ok: false,
      error: `Review must be ${String(REVIEW_BODY_MAX)} characters or fewer.`,
    }
  }

  const titleRaw = input.title.trim()
  const title = titleRaw.length > 0 ? titleRaw : null
  if (title && title.length > REVIEW_TITLE_MAX) {
    return {
      ok: false,
      error: `Title must be ${String(REVIEW_TITLE_MAX)} characters or fewer.`,
    }
  }

  const incentiveDisclosureRaw = (input.incentiveDisclosure ?? '').trim()
  const incentiveDisclosure =
    incentiveDisclosureRaw.length > 0 ? incentiveDisclosureRaw : null
  if (
    incentiveDisclosure &&
    incentiveDisclosure.length > REVIEW_DISCLOSURE_MAX
  ) {
    return {
      ok: false,
      error: `Disclosure must be ${String(REVIEW_DISCLOSURE_MAX)} characters or fewer.`,
    }
  }

  const combined = [title, body, incentiveDisclosure].filter(Boolean).join('\n')
  if (containsEmail(combined) || containsPhoneNumber(combined)) {
    return {
      ok: false,
      error:
        'Please remove personal contact info (email/phone number) from your review.',
    }
  }

  if (countLinks(combined) > REVIEW_MAX_LINKS) {
    return {
      ok: false,
      error: `Please keep links to ${String(REVIEW_MAX_LINKS)} or fewer.`,
    }
  }

  return {
    ok: true,
    value: {
      rating: rating as ValidatedReviewInput['rating'],
      title,
      body,
      incentiveDisclosure,
    },
  }
}
