'use server'

import { randomUUID } from 'crypto'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdminOrStaff } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import type { Json } from '@/lib/supabase/database.types'
import { listCmsDocuments } from './admin'
import { cmsDb, type CmsDocumentRow } from './db'
import { cmsTag } from './content'
import {
  cmsRegistry,
  cmsTypeNames,
  isCmsType,
  typeDefOf,
  typeSchema,
  type CmsType,
  type TypeDef,
} from './registry'

/**
 * All CMS writes. Guarded by requireAdminOrStaff, validated against the
 * registry schema, audit-logged, and versioned append-only: saving a draft
 * inserts a version and moves the draft pointer; publish/rollback move the
 * published pointer. Nothing is ever overwritten.
 */

export interface CmsActionResult {
  success: boolean
  error?: string
  /** Set on successful saves so the editor can track its base version */
  version?: number
  /** Set when a save was rejected because someone else saved first */
  conflict?: boolean
  /** Set when a new collection entry was created */
  key?: string
}

interface Guarded {
  userId: string
}

async function guard(): Promise<Guarded | { error: string }> {
  const supabase = await createClient()
  const result = await requireAdminOrStaff(supabase)
  if (!result.ok) return { error: result.error }
  return { userId: result.user.id }
}

async function loadDocument(
  type: CmsType,
  key: string,
): Promise<CmsDocumentRow | null> {
  const { data, error } = await cmsDb
    .from('cms_documents')
    .select('*')
    .eq('type', type)
    .eq('key', key)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

async function latestVersionNumber(documentId: string): Promise<number> {
  const { data, error } = await cmsDb
    .from('cms_versions')
    .select('version')
    .eq('document_id', documentId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.version ?? 0
}

function revalidate(type: CmsType, key: string) {
  // Next 16 requires a cache-life profile; 'max' expires the tag immediately
  // for the next request, which is exactly publish semantics.
  revalidateTag(cmsTag(type), 'max')
  revalidateTag(cmsTag(type, key), 'max')
}

/**
 * Reference-field integrity. Drafts may leave a reference unset ('' — new
 * entries start empty) and may point at unpublished entries, but publishing
 * requires a published target — otherwise "Published" would lie: the public
 * page only renders when the whole reference chain is live.
 */
async function referenceProblem(
  def: TypeDef,
  data: unknown,
  mode: 'save' | 'publish',
): Promise<string | null> {
  if (typeof data !== 'object' || data === null) return null
  const values = new Map(Object.entries(data as Record<string, unknown>))
  for (const [name, field] of Object.entries(def.fields)) {
    const ref = field.reference
    if (!ref) continue
    const value = values.get(name)
    if (typeof value !== 'string' || value === '') {
      if (mode === 'publish') {
        return `Set a ${field.label.toLowerCase()} before publishing`
      }
      continue
    }
    const target = isCmsType(ref.type)
      ? await loadDocument(ref.type, value)
      : null
    if (!target) {
      return `${field.label} "${value}" does not exist`
    }
    if (mode === 'publish' && !target.published_version_id) {
      return `Publish ${field.label.toLowerCase()} "${value}" before publishing this entry`
    }
  }
  return null
}

/**
 * Live entries (draft or published) whose reference fields point at this
 * key. Deleting a referenced entry is the only way a reference could
 * dangle, so deleteCmsEntry blocks on a non-zero count.
 */
async function liveReferenceCount(
  targetType: CmsType,
  targetKey: string,
): Promise<number> {
  let count = 0
  for (const type of cmsTypeNames) {
    for (const [name, field] of Object.entries(typeDefOf(type).fields)) {
      if (field.reference?.type !== targetType) continue
      const docs = await listCmsDocuments(type)
      for (const doc of docs) {
        const value = doc.data
          ? Object.entries(doc.data).find(([k]) => k === name)?.[1]
          : undefined
        if (value === targetKey) count += 1
      }
    }
  }
  return count
}

/**
 * Save a draft. For existing documents, `baseVersion` must be the latest
 * version the editor loaded — a stale save returns `conflict` instead of
 * silently clobbering someone else's work. Pass `key: null` to create a new
 * collection entry.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function saveCmsDraft(input: {
  type: string
  key: string | null
  data: unknown
  baseVersion: number
  note?: string
  /** For keyed collections: the admin-chosen key (URL slug) of a new entry */
  newKey?: string
}): Promise<CmsActionResult> {
  const auth = await guard()
  if ('error' in auth) return { success: false, error: auth.error }
  if (!isCmsType(input.type)) {
    return { success: false, error: `Unknown content type: ${input.type}` }
  }
  const type = input.type
  const def = cmsRegistry[type]

  const parsed = typeSchema(type).safeParse(input.data)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      success: false,
      error: `Invalid ${String(issue?.path?.join('.'))}: ${issue?.message}`,
    }
  }

  try {
    const referenceError = await referenceProblem(
      def as TypeDef,
      parsed.data,
      'save',
    )
    if (referenceError) return { success: false, error: referenceError }

    let key = input.key
    let documentId: string

    if (key === null) {
      if (def.kind === 'singleton') {
        key = 'default'
      } else if ((def as TypeDef).keyed) {
        const slug = input.newKey?.trim().toLowerCase() ?? ''
        if (!SLUG_PATTERN.test(slug) || slug.length > 60) {
          return {
            success: false,
            error:
              'Enter a URL slug: lowercase letters, numbers, and hyphens (e.g. "return-policy")',
          }
        }
        if (await loadDocument(type, slug)) {
          return { success: false, error: `"${slug}" already exists` }
        }
        key = slug
      } else {
        key = randomUUID()
      }
    }

    const existing = await loadDocument(type, key)

    if (!existing) {
      // Bespoke-admin collections own their keys (e.g. lesson ids), so a
      // save may recreate a missing document; generic collections cannot.
      if (
        input.key !== null &&
        def.kind === 'collection' &&
        !(def as TypeDef).customAdminPath
      ) {
        return { success: false, error: 'Entry not found' }
      }
      // New document (or first save of a singleton): append at the end
      const { data: maxRow } = await cmsDb
        .from('cms_documents')
        .select('sort_order')
        .eq('type', type)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()
      const { data: doc, error: docError } = await cmsDb
        .from('cms_documents')
        .insert({ type, key, sort_order: (maxRow?.sort_order ?? 0) + 1 })
        .select('id')
        .single()
      if (docError || !doc) {
        // unique(type,key) also covers soft-deleted documents
        const taken = docError?.code === '23505'
        return {
          success: false,
          error: taken
            ? `"${key}" is already in use (possibly by a deleted entry)`
            : (docError?.message ?? 'Insert failed'),
        }
      }
      documentId = doc.id
    } else {
      documentId = existing.id
      const latest = await latestVersionNumber(documentId)
      if (latest !== input.baseVersion) {
        return {
          success: false,
          conflict: true,
          error:
            'Someone else saved a newer version while you were editing. Reload to see it — your text is still in this form.',
        }
      }
    }

    const nextVersion = (existing ? input.baseVersion : 0) + 1
    const { data: version, error: versionError } = await cmsDb
      .from('cms_versions')
      .insert({
        document_id: documentId,
        version: nextVersion,
        // Safe: validated against the registry schema just above
        data: parsed.data as Json,
        note: input.note ?? null,
        created_by: auth.userId,
      })
      .select('id')
      .single()
    if (versionError || !version) {
      // Unique (document_id, version) also backstops concurrency races
      const conflicted = versionError?.code === '23505'
      return {
        success: false,
        conflict: conflicted,
        error: conflicted
          ? 'Someone else saved a newer version while you were editing.'
          : (versionError?.message ?? 'Version insert failed'),
      }
    }

    const { error: pointerError } = await cmsDb
      .from('cms_documents')
      .update({
        draft_version_id: version.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
    if (pointerError) return { success: false, error: pointerError.message }

    await logAuditEvent({
      userId: auth.userId,
      action: 'cms.draft_saved',
      resourceType: 'cms_document',
      resourceId: `${type}/${key}`,
      details: { version: nextVersion, note: input.note ?? null },
    })

    return { success: true, version: nextVersion, key }
  } catch (error) {
    console.error('cms saveCmsDraft failed:', error)
    return { success: false, error: 'Save failed' }
  }
}

/** Publish the draft (or a specific historical version) and revalidate. */
export async function publishCmsVersion(input: {
  type: string
  key: string
  versionId?: string
}): Promise<CmsActionResult> {
  const auth = await guard()
  if ('error' in auth) return { success: false, error: auth.error }
  if (!isCmsType(input.type)) {
    return { success: false, error: `Unknown content type: ${input.type}` }
  }
  const type = input.type

  try {
    const doc = await loadDocument(type, input.key)
    if (!doc) return { success: false, error: 'Entry not found' }

    const targetVersionId = input.versionId ?? doc.draft_version_id
    if (!targetVersionId) {
      return { success: false, error: 'Nothing to publish' }
    }

    // The target version must belong to this document
    const { data: version, error: versionError } = await cmsDb
      .from('cms_versions')
      .select('id, version, data')
      .eq('id', targetVersionId)
      .eq('document_id', doc.id)
      .maybeSingle()
    if (versionError) return { success: false, error: versionError.message }
    if (!version) return { success: false, error: 'Version not found' }

    const referenceError = await referenceProblem(
      typeDefOf(type),
      version.data,
      'publish',
    )
    if (referenceError) return { success: false, error: referenceError }

    const clearDraft = doc.draft_version_id === targetVersionId
    const { error: updateError } = await cmsDb
      .from('cms_documents')
      .update({
        published_version_id: targetVersionId,
        ...(clearDraft ? { draft_version_id: null } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', doc.id)
    if (updateError) return { success: false, error: updateError.message }

    revalidate(type, input.key)

    await logAuditEvent({
      userId: auth.userId,
      action: input.versionId ? 'cms.version_restored' : 'cms.published',
      resourceType: 'cms_document',
      resourceId: `${type}/${input.key}`,
      details: { version: version.version },
    })

    return { success: true, version: version.version }
  } catch (error) {
    console.error('cms publishCmsVersion failed:', error)
    return { success: false, error: 'Publish failed' }
  }
}

/** Drop the draft pointer; the published version keeps rendering. */
export async function discardCmsDraft(input: {
  type: string
  key: string
}): Promise<CmsActionResult> {
  const auth = await guard()
  if ('error' in auth) return { success: false, error: auth.error }
  if (!isCmsType(input.type)) {
    return { success: false, error: `Unknown content type: ${input.type}` }
  }

  try {
    const doc = await loadDocument(input.type, input.key)
    if (!doc) return { success: false, error: 'Entry not found' }

    const { error } = await cmsDb
      .from('cms_documents')
      .update({ draft_version_id: null, updated_at: new Date().toISOString() })
      .eq('id', doc.id)
    if (error) return { success: false, error: error.message }

    await logAuditEvent({
      userId: auth.userId,
      action: 'cms.draft_discarded',
      resourceType: 'cms_document',
      resourceId: `${input.type}/${input.key}`,
      details: {},
    })
    return { success: true }
  } catch (error) {
    console.error('cms discardCmsDraft failed:', error)
    return { success: false, error: 'Discard failed' }
  }
}

/** Soft-delete a collection entry (unpublishes it everywhere). */
export async function deleteCmsEntry(input: {
  type: string
  key: string
}): Promise<CmsActionResult> {
  const auth = await guard()
  if ('error' in auth) return { success: false, error: auth.error }
  if (!isCmsType(input.type)) {
    return { success: false, error: `Unknown content type: ${input.type}` }
  }
  if (cmsRegistry[input.type].kind !== 'collection') {
    return { success: false, error: 'Settings cannot be deleted' }
  }
  // Bespoke-admin documents live and die with their owning record (e.g. a
  // lesson); deleting one here would strand the owner with no content slot.
  if (typeDefOf(input.type).customAdminPath) {
    return {
      success: false,
      error: 'This content is managed from its own admin section',
    }
  }

  try {
    const doc = await loadDocument(input.type, input.key)
    if (!doc) return { success: false, error: 'Entry not found' }

    const referencedBy = await liveReferenceCount(input.type, input.key)
    if (referencedBy > 0) {
      return {
        success: false,
        error:
          referencedBy === 1
            ? 'Cannot delete: 1 entry references this one. Point it at something else first.'
            : `Cannot delete: ${referencedBy} entries reference this one. Point them at something else first.`,
      }
    }

    const { error } = await cmsDb
      .from('cms_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', doc.id)
    if (error) return { success: false, error: error.message }

    revalidate(input.type, input.key)
    await logAuditEvent({
      userId: auth.userId,
      action: 'cms.entry_deleted',
      resourceType: 'cms_document',
      resourceId: `${input.type}/${input.key}`,
      details: {},
    })
    return { success: true }
  } catch (error) {
    console.error('cms deleteCmsEntry failed:', error)
    return { success: false, error: 'Delete failed' }
  }
}

/** Persist a full drag-reorder of a collection. */
export async function reorderCmsEntries(input: {
  type: string
  orderedKeys: string[]
}): Promise<CmsActionResult> {
  const auth = await guard()
  if ('error' in auth) return { success: false, error: auth.error }
  if (!isCmsType(input.type)) {
    return { success: false, error: `Unknown content type: ${input.type}` }
  }
  if (typeDefOf(input.type).customAdminPath) {
    return {
      success: false,
      error: 'This content is managed from its own admin section',
    }
  }

  try {
    const { data: docs, error } = await cmsDb
      .from('cms_documents')
      .select('id, key')
      .eq('type', input.type)
      .is('deleted_at', null)
    if (error || !docs) {
      return { success: false, error: error?.message ?? 'Load failed' }
    }

    const currentKeys = new Set(docs.map((d) => d.key))
    if (
      input.orderedKeys.length !== currentKeys.size ||
      !input.orderedKeys.every((k) => currentKeys.has(k))
    ) {
      return {
        success: false,
        error: 'The list changed while you were reordering — reload the page',
      }
    }

    const byKey = new Map(docs.map((d) => [d.key, d.id]))
    for (const [index, key] of input.orderedKeys.entries()) {
      const { error: updateError } = await cmsDb
        .from('cms_documents')
        .update({ sort_order: index + 1 })
        .eq('id', byKey.get(key) as string)
      if (updateError) return { success: false, error: updateError.message }
    }

    revalidateTag(cmsTag(input.type), 'max')
    await logAuditEvent({
      userId: auth.userId,
      action: 'cms.reordered',
      resourceType: 'cms_document',
      resourceId: input.type,
      details: { count: input.orderedKeys.length },
    })
    return { success: true }
  } catch (error) {
    console.error('cms reorderCmsEntries failed:', error)
    return { success: false, error: 'Reorder failed' }
  }
}
