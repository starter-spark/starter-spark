import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { createPublicClient } from '@/lib/supabase/public'
import { cmsDb } from './db'
import { cmsRegistry, typeSchema, type CmsData, type CmsType } from './registry'

/**
 * Public delivery layer. Published reads are cached and tagged
 * (`cms:{type}` and `cms:{type}:{key}`); publishing revalidates the tags, so
 * edits go live immediately WITHOUT paying a database round trip on every
 * request. When Next.js draft mode is enabled (admin preview), reads bypass
 * the cache and prefer each document's draft version.
 */

export interface CmsEntry<T extends CmsType> {
  key: string
  sortOrder: number
  data: CmsData<T>
}

export function cmsTag(type: CmsType, key?: string): string {
  return key ? `cms:${type}:${key}` : `cms:${type}`
}

function parseData<T extends CmsType>(
  type: T,
  key: string,
  raw: unknown,
): CmsData<T> | null {
  const parsed = typeSchema(type).safeParse(raw)
  if (!parsed.success) {
    console.error(
      `cms: stored data for ${type}/${key} does not match the registry schema`,
      parsed.error.issues,
    )
    return null
  }
  return parsed.data as CmsData<T>
}

async function isDraftMode(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled
  } catch {
    // draftMode() throws outside a request scope (e.g. build-time collection)
    return false
  }
}

async function fetchPublishedEntries(
  type: CmsType,
): Promise<{ key: string; sort_order: number; data: unknown }[]> {
  // Published content is public by design (RLS exposes exactly the published
  // version of live documents), so this read needs no service role.
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('cms_published')
    .select('key, sort_order, data')
    .eq('type', type)
    .order('sort_order', { ascending: true })
    .order('key', { ascending: true })

  if (error) {
    console.error(`cms: failed to fetch published ${type}:`, error)
    return []
  }
  // View columns are inferred nullable by the type generator; the underlying
  // table columns are NOT NULL, so drop any row that violates that anyway.
  return (data ?? []).flatMap((row) =>
    row.key === null || row.sort_order === null
      ? []
      : [{ key: row.key, sort_order: Number(row.sort_order), data: row.data }],
  )
}

async function fetchDraftEntries(
  type: CmsType,
): Promise<{ key: string; sort_order: number; data: unknown }[]> {
  // Preview: prefer the draft version, fall back to published, include
  // documents that have never been published.
  const { data: docs, error } = await cmsDb
    .from('cms_documents')
    .select('key, sort_order, published_version_id, draft_version_id')
    .eq('type', type)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('key', { ascending: true })

  if (error || !docs) {
    if (error) console.error(`cms: failed to fetch ${type} documents:`, error)
    return []
  }

  const versionIds = docs
    .map((d) => d.draft_version_id ?? d.published_version_id)
    .filter((id): id is string => Boolean(id))
  if (versionIds.length === 0) return []

  const { data: versions, error: versionsError } = await cmsDb
    .from('cms_versions')
    .select('id, data')
    .in('id', versionIds)
  if (versionsError || !versions) {
    if (versionsError)
      console.error(`cms: failed to fetch ${type} versions:`, versionsError)
    return []
  }
  const byId = new Map(versions.map((v) => [v.id, v.data]))

  return docs.flatMap((d) => {
    const versionId = d.draft_version_id ?? d.published_version_id
    if (!versionId || !byId.has(versionId)) return []
    return [
      {
        key: d.key,
        sort_order: Number(d.sort_order),
        data: byId.get(versionId),
      },
    ]
  })
}

async function loadEntries<T extends CmsType>(type: T): Promise<CmsEntry<T>[]> {
  const rows = (await isDraftMode())
    ? await fetchDraftEntries(type)
    : await unstable_cache(
        async () => fetchPublishedEntries(type),
        ['cms-entries', type],
        { tags: ['cms', cmsTag(type)] },
      )()

  return rows.flatMap((row) => {
    const data = parseData(type, row.key, row.data)
    return data ? [{ key: row.key, sortOrder: row.sort_order, data }] : []
  })
}

/** All published entries of a collection, in admin-defined order. */
export async function getCollection<T extends CmsType>(
  type: T,
): Promise<CmsEntry<T>[]> {
  return loadEntries(type)
}

/** One entry by key, or null. */
export async function getEntry<T extends CmsType>(
  type: T,
  key = 'default',
): Promise<CmsData<T> | null> {
  const entries = await loadEntries(type)
  return entries.find((e) => e.key === key)?.data ?? null
}

/**
 * Singleton settings, guaranteed non-null: every settings field carries a
 * schema default, so a missing document degrades to defaults instead of
 * failing — and callers never carry their own fallback copies.
 */
export async function getSettings<T extends CmsType>(
  type: T,
): Promise<CmsData<T>> {
  if (cmsRegistry[type].kind !== 'singleton') {
    throw new Error(`cms: ${type} is not a singleton`)
  }
  const stored = await getEntry(type, 'default')
  if (stored) return stored
  return typeSchema(type).parse({}) as CmsData<T>
}
