import { describe, expect, it } from 'vitest'
import { cmsRegistry, cmsTypeNames, isCmsType, typeSchema } from './registry'

describe('cms registry', () => {
  it('exposes every registered type', () => {
    expect(cmsTypeNames).toContain('settings_commerce')
    expect(cmsTypeNames).toContain('impact_stat')
    expect(isCmsType('settings_commerce')).toBe(true)
    expect(isCmsType('nope')).toBe(false)
  })

  it('settings_commerce parses from empty input via schema defaults', () => {
    const parsed = typeSchema('settings_commerce').parse({})
    expect(parsed).toEqual({
      freeShippingThresholdCents: 7500,
      shippingRateCents: 999,
    })
  })

  it('settings_commerce rejects negative and non-integer money', () => {
    const schema = typeSchema('settings_commerce')
    expect(schema.safeParse({ freeShippingThresholdCents: -1 }).success).toBe(
      false,
    )
    expect(schema.safeParse({ shippingRateCents: 9.99 }).success).toBe(false)
  })

  it('impact_stat validates the seeded shape and rejects unknown autoSource', () => {
    const schema = typeSchema('impact_stat')
    const good = schema.safeParse({
      label: 'Kits Deployed',
      value: '0',
      suffix: '',
      autoSource: 'licenses_count',
      visible: true,
    })
    expect(good.success).toBe(true)

    const bad = schema.safeParse({
      label: 'X',
      value: '1',
      autoSource: 'stripe_balance',
    })
    expect(bad.success).toBe(false)
  })

  it('every singleton field carries a default so getSettings can never throw', () => {
    for (const [name, def] of Object.entries(cmsRegistry)) {
      if (def.kind !== 'singleton') continue
      const parsed = typeSchema(name as never).safeParse({})
      expect(parsed.success, `${name} must parse from {}`).toBe(true)
    }
  })
})
