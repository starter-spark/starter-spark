import { unstable_cache } from 'next/cache'
import { cmsDb } from './db'
import { cmsTag } from './content'
import type { CmsType } from './registry'

/**
 * Per-document file attachments for types with `attachments: true`.
 * Attachments are live objects, not versioned content: uploads and deletes
 * take effect immediately, independent of the document's draft/publish
 * state. Rows live in doc_attachments keyed by cms_documents.id; objects
 * live in the public doc-attachments bucket.
 */

export const ATTACHMENTS_BUCKET = 'doc-attachments'
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024
export const MAX_ATTACHMENT_FILENAME_LENGTH = 100

// First entry per extension is the canonical content type sent to storage
// and stored on the row; later entries cover browser-reported variants.
export const ATTACHMENT_MIME_TYPES_BY_EXTENSION = new Map<string, string[]>([
  ['pdf', ['application/pdf']],
  ['png', ['image/png']],
  ['jpg', ['image/jpeg']],
  ['jpeg', ['image/jpeg']],
  ['webp', ['image/webp']],
  ['gif', ['image/gif']],
  ['zip', ['application/zip', 'application/x-zip-compressed']],
  ['txt', ['text/plain']],
  // Windows machines with Excel installed report .csv as application/vnd.ms-excel
  ['csv', ['text/csv', 'text/plain', 'application/vnd.ms-excel']],
])

export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set(
  [...ATTACHMENT_MIME_TYPES_BY_EXTENSION.values()].flat(),
)

export function sanitizeAttachmentFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop() || 'file'
  const cleaned = basename
    .replaceAll(/[^a-zA-Z0-9._-]/g, '_')
    .replaceAll(/\.{2,}/g, '.')
    .replace(/^\.+/, '')

  if (!cleaned) return 'file'
  if (cleaned.length <= MAX_ATTACHMENT_FILENAME_LENGTH) return cleaned

  const dotIndex = cleaned.lastIndexOf('.')
  if (dotIndex <= 0) return cleaned.slice(0, MAX_ATTACHMENT_FILENAME_LENGTH)
  const ext = cleaned.slice(dotIndex)
  const truncated =
    cleaned.slice(0, Math.max(1, MAX_ATTACHMENT_FILENAME_LENGTH - ext.length)) +
    ext
  // Truncation can leave a trailing '.' abutting the extension, and the
  // finalize step rejects any path containing '..'.
  return truncated.replaceAll(/\.{2,}/g, '.')
}

export interface CmsAttachment {
  id: string
  filename: string
  fileSize: number | null
  mimeType: string | null
  /** Resolved public download URL (storage_path stays bucket-relative). */
  url: string
}

async function fetchAttachments(
  type: CmsType,
  key: string,
): Promise<CmsAttachment[]> {
  const { data: doc, error: docError } = await cmsDb
    .from('cms_documents')
    .select('id')
    .eq('type', type)
    .eq('key', key)
    .is('deleted_at', null)
    .maybeSingle()
  if (docError || !doc) {
    if (docError) {
      console.error(`cms: failed to load ${type}/${key}:`, docError)
    }
    return []
  }

  const { data, error } = await cmsDb
    .from('doc_attachments')
    .select('id, filename, storage_path, file_size, mime_type')
    .eq('document_id', doc.id)
    .order('created_at', { ascending: true })
  if (error) {
    console.error(`cms: failed to load attachments for ${type}/${key}:`, error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    filename: row.filename,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    url: cmsDb.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(row.storage_path)
      .data.publicUrl,
  }))
}

/** A document's attachments; cached and revalidated with the document's tag. */
export async function getCmsAttachments(
  type: CmsType,
  key: string,
): Promise<CmsAttachment[]> {
  return unstable_cache(
    async () => fetchAttachments(type, key),
    ['cms-attachments', type, key],
    { tags: ['cms', cmsTag(type, key)] },
  )()
}
