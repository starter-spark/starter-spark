/**
 * Avatar generation utilities using DiceBear
 * Generates deterministic avatars based on user ID or seed
 */

// DiceBear styles available - using "shapes" for a modern, clean look
const DICEBEAR_STYLE = "shapes"
const DICEBEAR_BASE_URL = "https://api.dicebear.com/9.x"

// Color palette for avatar backgrounds (Tailwind colors: cyan, teal, violet, rose, orange, yellow)
const AVATAR_BACKGROUND_COLORS = ["0ea5e9", "14b8a6", "8b5cf6", "f43f5e", "f97316", "eab308"]

/**
 * Generate a DiceBear avatar URL for a user
 * @param seed - The seed for avatar generation (typically user ID)
 * @param size - Size in pixels (default 80)
 * @returns URL string for the avatar image
 */
export function generateAvatarUrl(seed: string, size = 80): string {
  // Use the seed to generate a deterministic avatar
  const encodedSeed = encodeURIComponent(seed)
  const bgColors = AVATAR_BACKGROUND_COLORS.join(",")
  return `${DICEBEAR_BASE_URL}/${DICEBEAR_STYLE}/svg?seed=${encodedSeed}&size=${size}&backgroundColor=${bgColors}`
}

/**
 * Get the avatar URL for a user, preferring custom avatar over generated
 * @param options - User profile options
 * @returns URL string for the avatar image
 */
export function getUserAvatarUrl(options: {
  id: string
  avatarUrl?: string | null
  avatarSeed?: string | null
  size?: number
}): string {
  const { id, avatarUrl, avatarSeed, size = 80 } = options

  // If user has a custom avatar URL, use it
  if (avatarUrl) {
    return avatarUrl
  }

  // Generate avatar using seed (or fall back to user ID)
  const seed = avatarSeed || id
  return generateAvatarUrl(seed, size)
}

/**
 * Get initials from a name for fallback display
 * @param name - Full name or email
 * @returns 1-2 character initials
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?"

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() || "?"
  }

  return (
    (parts[0][0] || "") + (parts[parts.length - 1][0] || "")
  ).toUpperCase()
}
