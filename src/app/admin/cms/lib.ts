import {
  cmsRegistry,
  type CmsType,
  type FieldDef,
  type FieldWidget,
  type TypeDef,
} from '@/cms/registry'

/**
 * Server-side helpers for the CMS admin UI. The registry carries zod schemas
 * (not serializable), so pages serialize the display metadata here before
 * handing it to client components.
 */

export interface SerializedField {
  name: string
  label: string
  widget: FieldWidget
  help?: string
  options?: { value: string; label: string }[]
  /** Select widgets: show a clear control (the schema accepts '') */
  clearable?: boolean
}

const typeDefs = new Map<string, TypeDef>(Object.entries(cmsRegistry))

export function typeDef(type: CmsType): TypeDef {
  const def = typeDefs.get(type)
  if (!def) throw new Error(`Unknown CMS type: ${type}`)
  return def
}

/** Registry field metadata without the zod schema, for client components. */
export function serializeFields(type: CmsType): SerializedField[] {
  return Object.entries(typeDef(type).fields).map(([name, field]) => ({
    name,
    label: field.label,
    widget: field.widget,
    ...(field.help ? { help: field.help } : {}),
    ...(field.options ? { options: field.options.map((o) => ({ ...o })) } : {}),
  }))
}

/**
 * A valid starting value for one field: the schema default when it has one,
 * otherwise the first widget-appropriate candidate the schema accepts.
 */
function fieldDefault(field: FieldDef): unknown {
  const fromSchema = field.schema.safeParse(undefined)
  if (fromSchema.success) return fromSchema.data

  const candidates: unknown[] =
    field.widget === 'number'
      ? [0, 1]
      : field.widget === 'checkbox'
        ? [false, true]
        : field.widget === 'select'
          ? (field.options?.map((o) => o.value) ?? [])
          : ['', 'New entry']
  for (const candidate of candidates) {
    if (field.schema.safeParse(candidate).success) return candidate
  }
  // Last resort; the save action will surface a validation message.
  return field.widget === 'number'
    ? 0
    : field.widget === 'checkbox'
      ? false
      : ''
}

/** Schema-default data for a new document of this type. */
export function defaultDataFor(type: CmsType): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(typeDef(type).fields).map(([name, field]) => [
      name,
      fieldDefault(field),
    ]),
  )
}

/** Column definitions for a collection's list view. */
export function listColumns(type: CmsType): { name: string; label: string }[] {
  const def = typeDef(type)
  const names = def.listFields ?? Object.keys(def.fields)
  const fields = new Map(Object.entries(def.fields))
  return names.map((name) => ({
    name,
    label: fields.get(name)?.label ?? name,
  }))
}
