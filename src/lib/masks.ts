type LicenseMaskMode = 'raw' | 'normalized' | 'hyphenated'

interface MaskLicenseCodeOptions {
  mode?: LicenseMaskMode
  preserveShort?: boolean
  revealStart?: number
  revealEnd?: number
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  if (local.length <= 2) return `**@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

export function maskLicenseCode(
  code: string,
  options: MaskLicenseCodeOptions = {},
): string {
  const {
    mode = 'raw',
    preserveShort = false,
    revealStart = 4,
    revealEnd = 4,
  } = options

  if (mode === 'hyphenated') {
    const parts = code.split('-')
    if (parts.length !== 4) return code
    return `${parts[0]}-****-****-${parts[3]}`
  }

  const raw = mode === 'normalized' ? code.replaceAll('-', '') : code
  if (raw.length <= revealStart + revealEnd) {
    return preserveShort ? code : '****'
  }
  return `${raw.slice(0, revealStart)}-****-****-${raw.slice(-revealEnd)}`
}
