// DiceBear avatar generation

const DICEBEAR_STYLE = 'shapes'
const DICEBEAR_BASE_URL = 'https://api.dicebear.com/9.x'
const AVATAR_BACKGROUND_COLORS = [
  '0ea5e9',
  '14b8a6',
  '8b5cf6',
  'f43f5e',
  'f97316',
  'eab308',
]

export function generateAvatarUrl(seed: string, size = 80): string {
  const encodedSeed = encodeURIComponent(seed)
  const bgColors = AVATAR_BACKGROUND_COLORS.join(',')
  return `${DICEBEAR_BASE_URL}/${DICEBEAR_STYLE}/svg?seed=${encodedSeed}&size=${size}&backgroundColor=${bgColors}`
}

export function getUserAvatarUrl(options: {
  id: string
  avatarUrl?: string | null
  avatarSeed?: string | null
  size?: number
}): string {
  const { id, avatarUrl, avatarSeed, size = 80 } = options
  if (avatarUrl) return avatarUrl
  const seed = avatarSeed || id
  return generateAvatarUrl(seed, size)
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() || '?'
  }

  return (
    (parts[0][0] || '') + (parts[parts.length - 1][0] || '')
  ).toUpperCase()
}
