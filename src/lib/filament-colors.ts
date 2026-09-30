/**
 * Filament colour options for kits with 3D-printed parts.
 *
 * Admins set them per product as a plain spec, so they stay editable in
 * /admin/products: key "Filament Colors", value "Black, Blue Grey".
 */

export const FILAMENT_COLORS_SPEC_KEY = 'Filament Colors'

export interface FilamentColor {
  name: string
  hex: string
}

// Swatch colours for known filaments; unknown names fall back to grey.
const KNOWN_SWATCHES: Record<string, string> = {
  black: '#1f1f23',
  'blue grey': '#6b8ba4',
  white: '#f8fafc',
  grey: '#94a3b8',
}

const FALLBACK_SWATCH = '#cbd5e1'
const MAX_COLOR_NAME_LENGTH = 40

function normalizeColorName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

/** Parses the product's "Filament Colors" spec into swatches (empty if unset). */
export function getFilamentColors(specs: unknown): FilamentColor[] {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return []
  const raw = (specs as Record<string, unknown>)[FILAMENT_COLORS_SPEC_KEY]
  if (typeof raw !== 'string') return []

  const seen = new Set<string>()
  const colors: FilamentColor[] = []
  for (const part of raw.split(',')) {
    const name = normalizeColorName(part)
    const key = name.toLowerCase()
    if (!name || name.length > MAX_COLOR_NAME_LENGTH || seen.has(key)) continue
    seen.add(key)
    colors.push({ name, hex: KNOWN_SWATCHES[key] ?? FALLBACK_SWATCH })
  }
  return colors
}

/** Returns the product's canonical spelling of `color`, or null if it isn't offered. */
export function matchFilamentColor(
  specs: unknown,
  color: string,
): string | null {
  const wanted = normalizeColorName(color).toLowerCase()
  return (
    getFilamentColors(specs).find((c) => c.name.toLowerCase() === wanted)
      ?.name ?? null
  )
}
