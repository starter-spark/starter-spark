import { describe, it, expect } from 'vitest'
import { getTechnicalSpecs } from './product-specs'

describe('getTechnicalSpecs', () => {
  it('prefers the structured technicalSpecs list', () => {
    const rows = [{ label: 'Servos', value: '4× SG90' }]
    expect(
      getTechnicalSpecs({ technicalSpecs: rows, Microcontroller: 'Nano' }),
    ).toEqual(rows)
  })

  it('falls back to plain admin specs, skipping page settings and colors', () => {
    expect(
      getTechnicalSpecs({
        Microcontroller: 'Arduino Nano',
        'Filament Colors': 'Black, Blue Grey',
        modelPath: '/assets/3d/car/car.glb',
        Empty: '  ',
        Weight: 250,
      }),
    ).toEqual([
      { label: 'Microcontroller', value: 'Arduino Nano' },
      { label: 'Weight', value: '250' },
    ])
  })

  it('returns nothing for missing specs', () => {
    expect(getTechnicalSpecs(null)).toEqual([])
    expect(getTechnicalSpecs([])).toEqual([])
  })
})
