import { describe, it, expect } from 'vitest'
import {
  generateLicenseCode,
  generateClaimToken,
  isValidLicenseCodeFormat,
  normalizeLicenseCode,
  isValidClaimToken,
  formatPrice,
  formatPriceWithCurrency,
  isValidEmail,
  LICENSE_CODE_LENGTH,
} from './validation'

describe('generateLicenseCode', () => {
  it('should generate code in XXXX-XXXX-XXXX-XXXX format', () => {
    const code = generateLicenseCode()
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  })

  it('should generate code with correct length', () => {
    const code = generateLicenseCode()
    expect(code.length).toBe(LICENSE_CODE_LENGTH)
  })

  it('should not contain ambiguous characters (0, O, 1, I)', () => {
    // Generate multiple codes to increase confidence
    for (let i = 0; i < 100; i++) {
      const code = generateLicenseCode()
      expect(code).not.toMatch(/[0O1I]/)
    }
  })

  it('should generate unique codes', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 100; i++) {
      codes.add(generateLicenseCode())
    }
    // All codes should be unique (very high probability)
    expect(codes.size).toBe(100)
  })
})

describe('generateClaimToken', () => {
  it('should generate 64-character hex string', () => {
    const token = generateClaimToken()
    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  it('should generate unique tokens', () => {
    const tokens = new Set<string>()
    for (let i = 0; i < 100; i++) {
      tokens.add(generateClaimToken())
    }
    expect(tokens.size).toBe(100)
  })
})

describe('isValidLicenseCodeFormat', () => {
  it('should validate code with dashes', () => {
    expect(isValidLicenseCodeFormat('ABCD-EFGH-JKLM-NPQR')).toBe(true)
    expect(isValidLicenseCodeFormat('2345-6789-ABCD-EFGH')).toBe(true)
  })

  it('should validate code without dashes', () => {
    expect(isValidLicenseCodeFormat('ABCDEFGHJKLMNPQR')).toBe(true)
    expect(isValidLicenseCodeFormat('23456789ABCDEFGH')).toBe(true)
  })

  it('should be case-insensitive', () => {
    expect(isValidLicenseCodeFormat('abcd-efgh-jklm-npqr')).toBe(true)
    expect(isValidLicenseCodeFormat('AbCd-EfGh-JkLm-NpQr')).toBe(true)
  })

  it('should reject invalid characters (0, O, 1, I)', () => {
    expect(isValidLicenseCodeFormat('ABCD-0000-JKLM-NPQR')).toBe(false)
    expect(isValidLicenseCodeFormat('ABCD-OOOO-JKLM-NPQR')).toBe(false)
    expect(isValidLicenseCodeFormat('ABCD-1111-JKLM-NPQR')).toBe(false)
    expect(isValidLicenseCodeFormat('ABCD-IIII-JKLM-NPQR')).toBe(false)
  })

  it('should reject codes with wrong length', () => {
    expect(isValidLicenseCodeFormat('ABC')).toBe(false)
    expect(isValidLicenseCodeFormat('ABCD-EFGH')).toBe(false)
    expect(isValidLicenseCodeFormat('ABCD-EFGH-JKLM-NPQR-STUV')).toBe(false)
  })

  it('should reject empty or invalid input', () => {
    expect(isValidLicenseCodeFormat('')).toBe(false)
    expect(isValidLicenseCodeFormat(null as unknown as string)).toBe(false)
    expect(isValidLicenseCodeFormat(undefined as unknown as string)).toBe(false)
    expect(isValidLicenseCodeFormat(123 as unknown as string)).toBe(false)
  })

  it('should handle whitespace', () => {
    expect(isValidLicenseCodeFormat('  ABCD-EFGH-JKLM-NPQR  ')).toBe(true)
  })
})

describe('normalizeLicenseCode', () => {
  it('should convert to uppercase', () => {
    expect(normalizeLicenseCode('abcd-efgh')).toBe('ABCD-EFGH')
  })

  it('should trim whitespace', () => {
    expect(normalizeLicenseCode('  ABCD  ')).toBe('ABCD')
  })

  it('should handle mixed case', () => {
    expect(normalizeLicenseCode('AbCd-EfGh')).toBe('ABCD-EFGH')
  })
})

describe('isValidClaimToken', () => {
  it('should validate 64-character hex token', () => {
    const validToken = 'a'.repeat(64)
    expect(isValidClaimToken(validToken)).toBe(true)

    const mixedToken = 'abc123def456'.padEnd(64, '0')
    expect(isValidClaimToken(mixedToken)).toBe(true)
  })

  it('should reject tokens with wrong length', () => {
    expect(isValidClaimToken('a'.repeat(63))).toBe(false)
    expect(isValidClaimToken('a'.repeat(65))).toBe(false)
    expect(isValidClaimToken('')).toBe(false)
  })

  it('should reject non-hex characters', () => {
    expect(isValidClaimToken('g'.repeat(64))).toBe(false)
    expect(isValidClaimToken('A'.repeat(64))).toBe(false) // Uppercase hex not valid
    expect(isValidClaimToken('-'.repeat(64))).toBe(false)
  })

  it('should reject invalid input', () => {
    expect(isValidClaimToken(null as unknown as string)).toBe(false)
    expect(isValidClaimToken(undefined as unknown as string)).toBe(false)
    expect(isValidClaimToken(123 as unknown as string)).toBe(false)
  })
})

describe('formatPrice', () => {
  it('should format cents to dollars', () => {
    expect(formatPrice(9900)).toBe('$99.00')
    expect(formatPrice(100)).toBe('$1.00')
    expect(formatPrice(50)).toBe('$0.50')
  })

  it('should handle zero', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })

  it('should handle large amounts', () => {
    expect(formatPrice(99999)).toBe('$999.99')
    expect(formatPrice(100000)).toBe('$1000.00')
  })

  it('should always show two decimal places', () => {
    expect(formatPrice(100)).toBe('$1.00')
    expect(formatPrice(10)).toBe('$0.10')
  })
})

describe('formatPriceWithCurrency', () => {
  it('should format with USD by default', () => {
    const result = formatPriceWithCurrency(9900)
    expect(result).toMatch(/\$99\.00/)
  })

  it('should format with specified currency', () => {
    const eurResult = formatPriceWithCurrency(9900, 'EUR')
    expect(eurResult).toContain('99')
  })

  it('should handle zero', () => {
    const result = formatPriceWithCurrency(0)
    expect(result).toMatch(/\$0\.00/)
  })
})

describe('isValidEmail', () => {
  it('should validate correct email formats', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.org')).toBe(true)
    expect(isValidEmail('user+tag@example.com')).toBe(true)
    expect(isValidEmail('test@subdomain.example.com')).toBe(true)
  })

  it('should reject invalid email formats', () => {
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('invalid@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('invalid@domain')).toBe(false)
    expect(isValidEmail('spaces in@email.com')).toBe(false)
  })

  it('should reject empty or invalid input', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail(null as unknown as string)).toBe(false)
    expect(isValidEmail(undefined as unknown as string)).toBe(false)
  })
})
