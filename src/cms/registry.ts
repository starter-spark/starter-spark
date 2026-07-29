import { z } from 'zod'

/**
 * The CMS registry: the single source of truth for every content type.
 *
 * Developers define the vocabulary here (closed schema); admins create,
 * edit, reorder, draft, and publish entries freely (open content). From one
 * definition we derive write validation, the admin form, TypeScript types,
 * and seed defaults — so a key can never exist in code but not in the admin,
 * and defaults can never fork from the schema.
 */

export type FieldWidget =
  | 'input'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'select'

export interface FieldDef {
  schema: z.ZodType
  label: string
  widget: FieldWidget
  help?: string
  /** For widget 'select' */
  options?: { value: string; label: string }[]
}

export interface TypeDef {
  kind: 'singleton' | 'collection'
  label: string
  description: string
  /** v1 supports flat objects only; block fields arrive with the pages phase */
  fields: Record<string, FieldDef>
  /** Which fields show as columns in the admin list view (collections) */
  listFields?: string[]
  /** Whether admins can drag-reorder entries (collections) */
  orderable?: boolean
}

export const cmsRegistry = {
  settings_commerce: {
    kind: 'singleton',
    label: 'Commerce Settings',
    description:
      'Operational commerce values. Code computes with these (checkout math and copy read the same source).',
    fields: {
      freeShippingThresholdCents: {
        schema: z.number().int().min(0).default(7500),
        label: 'Free shipping threshold (cents)',
        widget: 'number',
        help: 'Orders at or above this subtotal ship free. 7500 = $75.00',
      },
      shippingRateCents: {
        schema: z.number().int().min(0).default(999),
        label: 'Shipping rate (cents)',
        widget: 'number',
        help: 'Flat shipping charged below the threshold. 999 = $9.99',
      },
    },
  },
  impact_stat: {
    kind: 'collection',
    label: 'Impact Stats',
    description:
      'Stats shown in the homepage impact strip. Insert as many as you like; the strip renders every visible entry in order.',
    fields: {
      label: {
        schema: z.string().min(1).max(80),
        label: 'Label',
        widget: 'input',
      },
      value: {
        schema: z.string().max(20),
        label: 'Value',
        widget: 'input',
        help: 'Ignored when an auto source is set',
      },
      suffix: {
        schema: z.string().max(10).default(''),
        label: 'Suffix',
        widget: 'input',
        help: 'e.g. "+" or "%"',
      },
      autoSource: {
        schema: z
          .enum(['none', 'licenses_count', 'events_count'])
          .default('none'),
        label: 'Auto-calculated from',
        widget: 'select',
        options: [
          { value: 'none', label: 'Not auto-calculated' },
          { value: 'licenses_count', label: 'Claimed licenses count' },
          { value: 'events_count', label: 'Past events count' },
        ],
      },
      visible: {
        schema: z.boolean().default(true),
        label: 'Visible',
        widget: 'checkbox',
      },
    },
    listFields: ['label', 'value', 'autoSource', 'visible'],
    orderable: true,
  },
} as const satisfies Record<string, TypeDef>

export type CmsType = keyof typeof cmsRegistry

type FieldSchemas<T extends CmsType> = {
  [K in keyof (typeof cmsRegistry)[T]['fields']]: (typeof cmsRegistry)[T]['fields'][K] extends {
    schema: infer S extends z.ZodType
  }
    ? S
    : never
}

/** Zod object for a type, derived from its field definitions. */
export function typeSchema<T extends CmsType>(type: T): z.ZodObject {
  const def = cmsRegistry[type] as TypeDef
  const shape: Record<string, z.ZodType> = {}
  for (const [name, field] of Object.entries(def.fields)) {
    shape[name] = field.schema
  }
  return z.object(shape)
}

export type CmsData<T extends CmsType> = z.infer<z.ZodObject<FieldSchemas<T>>>

export function isCmsType(value: string): value is CmsType {
  return value in cmsRegistry
}

export const cmsTypeNames = Object.keys(cmsRegistry) as CmsType[]
