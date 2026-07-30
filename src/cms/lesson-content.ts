import { revalidateTag } from 'next/cache'
import { cmsDb } from './db'
import { cmsTag } from './content'

/**
 * Lifecycle bridge between the relational learning structure (lessons) and
 * the engine documents that hold their content. Lessons own the document
 * lifecycle: one gated `lesson_content` document per lesson, keyed by the
 * lesson id, created with the lesson and soft-deleted with it (the version
 * history survives, append-only as everywhere else).
 *
 * Server-only by inheritance (cmsDb). Callers are the admin-guarded learn
 * actions.
 */

export async function createLessonContentDocument(
  lessonId: string,
): Promise<{ error?: string }> {
  const { data: doc, error } = await cmsDb
    .from('cms_documents')
    .insert({ type: 'lesson_content', key: lessonId, sort_order: 0 })
    .select('id')
    .single()
  if (error || !doc) {
    return { error: error?.message ?? 'Failed to create lesson content' }
  }

  const { data: version, error: versionError } = await cmsDb
    .from('cms_versions')
    .insert({
      document_id: doc.id,
      version: 1,
      data: { blocks: [] },
      note: 'Created with lesson',
    })
    .select('id')
    .single()
  if (versionError || !version) {
    await cmsDb.from('cms_documents').delete().eq('id', doc.id)
    return { error: versionError?.message ?? 'Failed to create lesson content' }
  }

  // Draft-only: content goes live when the author publishes it.
  const { error: pointerError } = await cmsDb
    .from('cms_documents')
    .update({ draft_version_id: version.id })
    .eq('id', doc.id)
  if (pointerError) {
    // Versions cascade with the document; a partial create must not leave
    // an orphan holding the lesson's unique (type, key) slot.
    await cmsDb.from('cms_documents').delete().eq('id', doc.id)
    return { error: pointerError.message }
  }

  return {}
}

export async function softDeleteLessonContentDocuments(
  lessonIds: string[],
): Promise<void> {
  if (lessonIds.length === 0) return

  const { error } = await cmsDb
    .from('cms_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('type', 'lesson_content')
    .in('key', lessonIds)
    .is('deleted_at', null)
  if (error) {
    // The lesson row is already gone; a stale document only lingers in
    // storage (unreachable — its lesson page 404s), so log rather than fail
    // the user-visible delete.
    console.error('cms: failed to soft-delete lesson content:', error)
    return
  }

  revalidateTag(cmsTag('lesson_content'), 'max')
  for (const lessonId of lessonIds) {
    revalidateTag(cmsTag('lesson_content', lessonId), 'max')
  }
}
