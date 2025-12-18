import crypto from "crypto"

/**
 * License code character set (excludes ambiguous characters: 0, O, 1, I)
 */
const LICENSE_CODE_CHARS = ["ABCDEFGH", "JKLMNPQR", "STUVWXYZ", "23456789"].join("")

/**
 * License code format: XXXX-XXXX-XXXX-XXXX (4 segments of 4 characters)
 */
export const LICENSE_CODE_SEGMENTS = 4
export const LICENSE_CODE_SEGMENT_LENGTH = 4
export const LICENSE_CODE_LENGTH =
  LICENSE_CODE_SEGMENTS * LICENSE_CODE_SEGMENT_LENGTH +
  (LICENSE_CODE_SEGMENTS - 1) // Including dashes

/**
 * Generates a unique license code in format XXXX-XXXX-XXXX-XXXX
 * Uses unambiguous characters to avoid confusion (no 0/O, 1/I)
 */
export function generateLicenseCode(): string {
  const parts: string[] = []
  for (let i = 0; i < LICENSE_CODE_SEGMENTS; i++) {
    let segment = ""
    for (let j = 0; j < LICENSE_CODE_SEGMENT_LENGTH; j++) {
      segment += LICENSE_CODE_CHARS.charAt(
        Math.floor(Math.random() * LICENSE_CODE_CHARS.length)
      )
    }
    parts.push(segment)
  }
  return parts.join("-")
}

/**
 * Generates a secure 64-character hex claim token
 */
export function generateClaimToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Validates license code format (XXXX-XXXX-XXXX-XXXX or XXXXXXXXXXXXXXXX)
 * Allowed characters: A-H, J-N, P-Z (excludes I, O), 2-9 (excludes 0, 1)
 */
export function isValidLicenseCodeFormat(code: string): boolean {
  if (!code || typeof code !== "string") return false

  const normalized = code.trim().toUpperCase()

  // Check with dashes: XXXX-XXXX-XXXX-XXXX
  const withDashesRegex = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/
  if (withDashesRegex.test(normalized)) return true

  // Check without dashes: 16 characters
  const withoutDashesRegex = /^[A-HJ-NP-Z2-9]{16}$/
  if (withoutDashesRegex.test(normalized)) return true

  return false
}

/**
 * Normalizes a license code to uppercase
 */
export function normalizeLicenseCode(code: string): string {
  return code.trim().toUpperCase()
}

/**
 * Validates a claim token format (64 character hex string)
 */
export function isValidClaimToken(token: string): boolean {
  if (!token || typeof token !== "string") return false
  return /^[a-f0-9]{64}$/.test(token)
}

/**
 * Formats price in cents to display string (e.g., 9900 -> "$99.00")
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Formats price with optional currency (e.g., 9900, "USD" -> "$99.00")
 */
export function formatPriceWithCurrency(
  cents: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100)
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  // Simple regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
