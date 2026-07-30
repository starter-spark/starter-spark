import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { createPublicClient } from '@/lib/supabase/public'
import { cmsDb } from './db'
import {
  cmsRegistry,
  typeDefOf,
  typeSchema,
  type CmsData,
  type CmsType,
} from './registry'

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
  /** When the rendered version went live (draft save time in preview mode) */
  publishedAt: string | null
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

async function fetchPublishedEntries(type: CmsType): Promise<
  {
    key: string
    sort_order: number
    data: unknown
    published_at: string | null
  }[]
> {
  // Published content is public by design (RLS exposes exactly the published
  // version of live documents), so this read needs no service role.
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('cms_published')
    .select('key, sort_order, data, published_at')
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
      : [
          {
            key: row.key,
            sort_order: Number(row.sort_order),
            data: row.data,
            published_at: row.published_at,
          },
        ],
  )
}

async function fetchDraftEntries(type: CmsType): Promise<
  {
    key: string
    sort_order: number
    data: unknown
    published_at: string | null
  }[]
> {
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
    .select('id, data, created_at')
    .in('id', versionIds)
  if (versionsError || !versions) {
    if (versionsError)
      console.error(`cms: failed to fetch ${type} versions:`, versionsError)
    return []
  }
  const byId = new Map(versions.map((v) => [v.id, v]))

  return docs.flatMap((d) => {
    const versionId = d.draft_version_id ?? d.published_version_id
    const version = versionId ? byId.get(versionId) : undefined
    if (!version) return []
    return [
      {
        key: d.key,
        sort_order: Number(d.sort_order),
        data: version.data,
        published_at: version.created_at,
      },
    ]
  })
}

async function loadEntries<T extends CmsType>(type: T): Promise<CmsEntry<T>[]> {
  // Gated types are excluded from the anon-readable policies; serving them
  // through the public read path would return nothing in production and
  // leak paid content in any environment where the policies drifted.
  if (typeDefOf(type).gated) {
    throw new Error(`cms: ${type} is gated — read it with getGatedEntry`)
  }
  const rows = (await isDraftMode())
    ? await fetchDraftEntries(type)
    : await unstable_cache(
        async () => fetchPublishedEntries(type),
        ['cms-entries', type],
        { tags: ['cms', cmsTag(type)] },
      )()

  return rows.flatMap((row) => {
    const data = parseData(type, row.key, row.data)
    return data
      ? [
          {
            key: row.key,
            sortOrder: row.sort_order,
            data,
            publishedAt: row.published_at,
          },
        ]
      : []
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
  return (await getEntryMeta(type, key))?.data ?? null
}

/** One entry with its metadata (publish time), or null. */
export async function getEntryMeta<T extends CmsType>(
  type: T,
  key = 'default',
): Promise<CmsEntry<T> | null> {
  const entries = await loadEntries(type)
  return entries.find((e) => e.key === key) ?? null
}

async function fetchGatedPublishedEntry(
  type: CmsType,
  key: string,
): Promise<{
  key: string
  sort_order: number
  data: unknown
  published_at: string | null
} | null> {
  const { data: doc, error } = await cmsDb
    .from('cms_documents')
    .select('key, sort_order, published_version_id')
    .eq('type', type)
    .eq('key', key)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) {
    console.error(`cms: failed to fetch gated ${type}/${key}:`, error)
    return null
  }
  if (!doc?.published_version_id) return null

  const { data: version, error: versionError } = await cmsDb
    .from('cms_versions')
    .select('data, created_at')
    .eq('id', doc.published_version_id)
    .maybeSingle()
  if (versionError || !version) {
    if (versionError) {
      console.error(`cms: failed to fetch gated ${type}/${key}:`, versionError)
    }
    return null
  }

  return {
    key: doc.key,
    sort_order: Number(doc.sort_order),
    data: version.data,
    published_at: version.created_at,
  }
}

/**
 * One published entry of a gated type, read with the service role and
 * cached under the document's tag. The CALLER is the access control:
 * invoke this only after its own check (e.g. the lesson page's license
 * check) has passed. Draft mode prefers the draft version (the preview
 * cookie is staff-gated).
 */
export async function getGatedEntry<T extends CmsType>(
  type: T,
  key: string,
): Promise<CmsEntry<T> | null> {
  if (!typeDefOf(type).gated) {
    throw new Error(`cms: ${type} is not gated — use getEntry/getEntryMeta`)
  }

  const row = (await isDraftMode())
    ? ((await fetchDraftEntries(type)).find((r) => r.key === key) ?? null)
    : await unstable_cache(
        async () => fetchGatedPublishedEntry(type, key),
        ['cms-gated', type, key],
        { tags: ['cms', cmsTag(type, key)] },
      )()
  if (!row) return null

  const data = parseData(type, row.key, row.data)
  if (!data) return null
  return {
    key: row.key,
    sortOrder: row.sort_order,
    data,
    publishedAt: row.published_at,
  }
}

/**
 * A singleton document, guaranteed non-null: every singleton field carries a
 * schema default, so a missing document degrades to defaults instead of
 * failing — and callers never carry their own fallback copies.
 */
export async function getSingleton<T extends CmsType>(
  type: T,
): Promise<CmsData<T>> {
  if (cmsRegistry[type].kind !== 'singleton') {
    throw new Error(`cms: ${type} is not a singleton`)
  }
  const stored = await getEntry(type, 'default')
  if (stored) return stored
  return typeSchema(type).parse({}) as CmsData<T>
}
