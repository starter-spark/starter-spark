import { cmsDb } from './db'
import { isCmsType, typeDefOf, typeSchema, type CmsType } from './registry'

/**
 * Read helpers for the admin UI (server components only). Unlike the public
 * delivery layer these are uncached and see drafts, history, and documents
 * that have never been published.
 */

export interface AdminDocumentSummary {
  key: string
  sortOrder: number
  hasDraft: boolean
  isPublished: boolean
  updatedAt: string
  /** Draft-preferred data for list display; null when it fails validation */
  data: Record<string, unknown> | null
}

export interface AdminVersionSummary {
  id: string
  version: number
  note: string | null
  createdBy: string | null
  createdAt: string
  isPublished: boolean
  isDraft: boolean
}

export interface AdminDocumentDetail {
  /** cms_documents.id — attachments and other side tables key off it */
  id: string
  key: string
  /** Draft-preferred data for editing; null only for never-saved singletons */
  data: Record<string, unknown> | null
  /** Latest version number — the editor's optimistic-concurrency base */
  latestVersion: number
  hasDraft: boolean
  isPublished: boolean
  history: AdminVersionSummary[]
}

export async function listCmsDocuments(
  type: CmsType,
): Promise<AdminDocumentSummary[]> {
  const { data: docs, error } = await cmsDb
    .from('cms_documents')
    .select(
      'id, key, sort_order, published_version_id, draft_version_id, updated_at',
    )
    .eq('type', type)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('key', { ascending: true })
  if (error) throw new Error(error.message)
  if (!docs || docs.length === 0) return []

  const versionIds = docs
    .map((d) => d.draft_version_id ?? d.published_version_id)
    .filter((id): id is string => Boolean(id))
  const { data: versions, error: versionsError } = versionIds.length
    ? await cmsDb.from('cms_versions').select('id, data').in('id', versionIds)
    : { data: [], error: null }
  if (versionsError) throw new Error(versionsError.message)
  const byId = new Map((versions ?? []).map((v) => [v.id, v.data]))

  const schema = typeSchema(type)
  return docs.map((d) => {
    const versionId = d.draft_version_id ?? d.published_version_id
    const raw = versionId ? byId.get(versionId) : null
    const parsed = raw != null ? schema.safeParse(raw) : null
    return {
      key: d.key,
      sortOrder: Number(d.sort_order),
      hasDraft: Boolean(d.draft_version_id),
      isPublished: Boolean(d.published_version_id),
      updatedAt: d.updated_at,
      data: parsed?.success ? parsed.data : null,
    }
  })
}

/**
 * The live entries a reference field can point at, as select options:
 * every non-deleted entry of the referenced type (drafts included — an
 * admin can wire up content before either side is published).
 */
export async function referenceOptionsFor(
  type: CmsType,
): Promise<Map<string, { value: string; label: string }[]>> {
  const options = new Map<string, { value: string; label: string }[]>()
  for (const [name, field] of Object.entries(typeDefOf(type).fields)) {
    const ref = field.reference
    if (!ref || !isCmsType(ref.type)) continue
    const entries = await listCmsDocuments(ref.type)
    options.set(
      name,
      entries.map((entry) => {
        const label = entry.data
          ? Object.entries(entry.data).find(([k]) => k === ref.labelField)?.[1]
          : undefined
        return {
          value: entry.key,
          label: typeof label === 'string' && label ? label : entry.key,
        }
      }),
    )
  }
  return options
}

export async function getCmsDocumentDetail(
  type: CmsType,
  key: string,
): Promise<AdminDocumentDetail | null> {
  const { data: doc, error } = await cmsDb
    .from('cms_documents')
    .select('id, key, published_version_id, draft_version_id')
    .eq('type', type)
    .eq('key', key)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!doc) return null

  const { data: versions, error: versionsError } = await cmsDb
    .from('cms_versions')
    .select('id, version, data, note, created_by, created_at')
    .eq('document_id', doc.id)
    .order('version', { ascending: false })
  if (versionsError) throw new Error(versionsError.message)

  const all = versions ?? []
  const latest = all[0]
  const editingVersionId = doc.draft_version_id ?? doc.published_version_id
  const editing = all.find((v) => v.id === editingVersionId)
  const parsed = editing ? typeSchema(type).safeParse(editing.data) : null

  return {
    id: doc.id,
    key: doc.key,
    data: parsed?.success ? parsed.data : null,
    latestVersion: latest?.version ?? 0,
    hasDraft: Boolean(doc.draft_version_id),
    isPublished: Boolean(doc.published_version_id),
    history: all.map((v) => ({
      id: v.id,
      version: v.version,
      note: v.note,
      createdBy: v.created_by,
      createdAt: v.created_at,
      isPublished: v.id === doc.published_version_id,
      isDraft: v.id === doc.draft_version_id,
    })),
  }
}
