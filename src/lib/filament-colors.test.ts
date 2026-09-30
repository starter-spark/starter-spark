import { describe, it, expect } from 'vitest'
import { getFilamentColors, matchFilamentColor } from './filament-colors'

describe('getFilamentColors', () => {
  it('parses the comma-separated spec with swatches', () => {
    expect(getFilamentColors({ 'Filament Colors': 'Black, Blue Grey' })).toEqual([
      { name: 'Black', hex: '#1f1f23' },
      { name: 'Blue Grey', hex: '#6b8ba4' },
    ])
  })

  it('ignores blanks and duplicates and falls back for unknown colors', () => {
    expect(
      getFilamentColors({ 'Filament Colors': ' Black ,, black, Neon  Pink ' }),
    ).toEqual([
      { name: 'Black', hex: '#1f1f23' },
      { name: 'Neon Pink', hex: '#cbd5e1' },
    ])
  })

  it('returns nothing when the spec is missing or malformed', () => {
    expect(getFilamentColors(null)).toEqual([])
    expect(getFilamentColors({})).toEqual([])
    expect(getFilamentColors({ 'Filament Colors': ['Black'] })).toEqual([])
  })
})

describe('matchFilamentColor', () => {
  const specs = { 'Filament Colors': 'Black, Blue Grey' }

  it('matches case- and spacing-insensitively and returns the listed spelling', () => {
    expect(matchFilamentColor(specs, 'blue  grey')).toBe('Blue Grey')
  })

  it('rejects colors the product does not offer', () => {
    expect(matchFilamentColor(specs, 'Red')).toBeNull()
  })
})
