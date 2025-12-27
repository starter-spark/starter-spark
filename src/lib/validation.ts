import crypto from 'node:crypto'

const LICENSE_CODE_CHARS = [
  'ABCDEFGH',
  'JKLMNPQR',
  'STUVWXYZ',
  '23456789',
].join('')

export const LICENSE_CODE_SEGMENTS = 4
export const LICENSE_CODE_SEGMENT_LENGTH = 4
export const LICENSE_CODE_LENGTH =
  LICENSE_CODE_SEGMENTS * LICENSE_CODE_SEGMENT_LENGTH +
  (LICENSE_CODE_SEGMENTS - 1)

export function generateLicenseCode(): string {
  const parts: string[] = []
  for (let i = 0; i < LICENSE_CODE_SEGMENTS; i++) {
    let segment = ''
    for (let j = 0; j < LICENSE_CODE_SEGMENT_LENGTH; j++) {
      segment += LICENSE_CODE_CHARS.charAt(
        crypto.randomInt(LICENSE_CODE_CHARS.length),
      )
    }
    parts.push(segment)
  }
  return parts.join('-')
}

export function generateClaimToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function isValidLicenseCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false
  const normalized = code.trim().toUpperCase()
  const withDashesRegex =
    /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/
  if (withDashesRegex.test(normalized)) return true
  const withoutDashesRegex = /^[A-HJ-NP-Z2-9]{16}$/
  if (withoutDashesRegex.test(normalized)) return true
  return false
}

export function normalizeLicenseCode(code: string): string {
  return code.trim().toUpperCase()
}

export function normalizeLicenseCodeForLookup(code: string): string {
  const normalized = normalizeLicenseCode(code)
  const stripped = normalized.replaceAll('-', '')
  if (stripped.length !== LICENSE_CODE_SEGMENTS * LICENSE_CODE_SEGMENT_LENGTH) {
    return normalized
  }
  const parts = stripped.match(/.{1,4}/g) || []
  return parts.join('-')
}

export function isValidClaimToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  return /^[a-f0-9]{64}$/.test(token)
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatPriceWithCurrency(
  cents: number,
  currency = 'USD',
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const trimmed = email.trim()
  if (!trimmed) return false
  if (trimmed.includes(' ')) return false

  const atIndex = trimmed.indexOf('@')
  if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) return false

  const domain = trimmed.slice(atIndex + 1)
  if (!domain || domain.startsWith('.') || domain.endsWith('.')) return false
  if (!domain.includes('.')) return false

  return true
}
