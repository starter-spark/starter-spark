export interface SpecRow {
  label: string
  value: string
}

// Keys in products.specs that configure the page rather than describe the kit
const RESERVED_KEYS = new Set([
  'modelPath',
  'category',
  'badge',
  'inStock',
  'learningOutcomes',
  'includedItems',
  'technicalSpecs',
  // Read by the filament color picker on the add-robot-car-kit branch
  'Filament Colors',
])

/**
 * Rows for the Technical Specs tab. Uses the structured `technicalSpecs`
 * list when present, otherwise the plain key/value specs entered in
 * /admin/products, in the order they were saved.
 */
export function getTechnicalSpecs(specs: unknown): SpecRow[] {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return []
  const record = specs as Record<string, unknown>

  const structured = record.technicalSpecs
  if (Array.isArray(structured) && structured.length > 0) {
    return structured.filter(
      (row): row is SpecRow =>
        !!row &&
        typeof row === 'object' &&
        typeof (row as SpecRow).label === 'string' &&
        typeof (row as SpecRow).value === 'string',
    )
  }

  return Object.entries(record)
    .filter(([key]) => !RESERVED_KEYS.has(key))
    .filter(
      (entry): entry is [string, string | number] =>
        (typeof entry[1] === 'string' && entry[1].trim() !== '') ||
        typeof entry[1] === 'number',
    )
    .map(([label, value]) => ({ label, value: String(value) }))
}
