'use server'

import { randomUUID } from 'crypto'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdminOrStaff } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { cmsDb } from './db'
import { cmsTag } from './content'
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  ATTACHMENT_MIME_TYPES_BY_EXTENSION,
  ATTACHMENTS_BUCKET,
  MAX_ATTACHMENT_SIZE_BYTES,
  sanitizeAttachmentFilename,
} from './attachments'
import { isCmsType, typeDefOf, type CmsType } from './registry'

/**
 * Attachment writes. Uploads use signed upload URLs so the file bytes never
 * pass through a server action (their request body is capped at 1MB):
 * createCmsAttachmentUpload mints a token, the client uploads directly to
 * storage, finalizeCmsAttachment verifies the object and inserts the row.
 */

interface AttachmentActionResult {
  success: boolean
  error?: string
  path?: string
  token?: string
  contentType?: string
}

async function guardedDocument(
  type: string,
  key: string,
): Promise<
  { userId: string; type: CmsType; documentId: string } | { error: string }
> {
  const supabase = await createClient()
  const auth = await requireAdminOrStaff(supabase)
  if (!auth.ok) return { error: auth.error }

  if (!isCmsType(type)) return { error: `Unknown content type: ${type}` }
  if (!typeDefOf(type).attachments) {
    return { error: `${type} does not support attachments` }
  }

  const { data: doc, error } = await cmsDb
    .from('cms_documents')
    .select('id')
    .eq('type', type)
    .eq('key', key)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) return { error: error.message }
  if (!doc) return { error: 'Entry not found' }

  return { userId: auth.user.id, type, documentId: doc.id }
}

function revalidate(type: CmsType, key: string) {
  revalidateTag(cmsTag(type), 'max')
  revalidateTag(cmsTag(type, key), 'max')
}

export async function createCmsAttachmentUpload(input: {
  type: string
  key: string
  filename: string
  fileSize: number
  declaredMimeType: string
}): Promise<AttachmentActionResult> {
  const guarded = await guardedDocument(input.type, input.key)
  if ('error' in guarded) return { success: false, error: guarded.error }

  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
    return { success: false, error: 'Empty files are not allowed' }
  }
  if (input.fileSize > MAX_ATTACHMENT_SIZE_BYTES) {
    return { success: false, error: 'File exceeds the 10MB limit' }
  }

  const sanitizedFilename = sanitizeAttachmentFilename(input.filename)
  const extension = sanitizedFilename.includes('.')
    ? sanitizedFilename.split('.').pop()?.toLowerCase()
    : undefined
  const allowedMimeTypes = extension
    ? ATTACHMENT_MIME_TYPES_BY_EXTENSION.get(extension)
    : undefined

  if (!allowedMimeTypes) {
    return {
      success: false,
      error: `File type not allowed. Allowed: ${[...ATTACHMENT_MIME_TYPES_BY_EXTENSION.keys()].join(', ')}`,
    }
  }

  // Browsers report inconsistent MIME types (empty, octet-stream, or
  // platform-specific variants), so the extension decides the canonical type.
  if (
    input.declaredMimeType &&
    input.declaredMimeType !== 'application/octet-stream' &&
    !allowedMimeTypes.includes(input.declaredMimeType)
  ) {
    return {
      success: false,
      error: 'File content type does not match its extension',
    }
  }

  const storagePath = `${guarded.documentId}/${randomUUID()}-${sanitizedFilename}`

  const { data: signed, error: signError } = await cmsDb.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUploadUrl(storagePath)

  if (signError || !signed) {
    return {
      success: false,
      error: signError?.message || 'Failed to create upload URL',
    }
  }

  return {
    success: true,
    path: signed.path,
    token: signed.token,
    contentType: allowedMimeTypes[0],
  }
}

export async function finalizeCmsAttachment(input: {
  type: string
  key: string
  path: string
}): Promise<AttachmentActionResult> {
  const guarded = await guardedDocument(input.type, input.key)
  if ('error' in guarded) return { success: false, error: guarded.error }

  // Only accept paths minted by createCmsAttachmentUpload for this document:
  // {documentId}/{uuid}-{filename}, no traversal.
  const objectName = input.path.startsWith(`${guarded.documentId}/`)
    ? input.path.slice(guarded.documentId.length + 1)
    : null
  if (!objectName || objectName.includes('/') || input.path.includes('..')) {
    return { success: false, error: 'Invalid attachment path' }
  }

  // The object name is a 36-char UUID, a dash, then the sanitized filename
  const originalFilename = objectName.slice(37)
  if (!originalFilename) {
    return { success: false, error: 'Invalid attachment path' }
  }

  const { data: info, error: infoError } = await cmsDb.storage
    .from(ATTACHMENTS_BUCKET)
    .info(input.path)

  if (infoError || !info) {
    return { success: false, error: 'Uploaded file not found in storage' }
  }

  const fileSize = info.size ?? null
  const mimeType = info.contentType ?? null

  if (
    (fileSize !== null && fileSize > MAX_ATTACHMENT_SIZE_BYTES) ||
    (mimeType !== null && !ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType))
  ) {
    await cmsDb.storage.from(ATTACHMENTS_BUCKET).remove([input.path])
    return { success: false, error: 'Uploaded file failed validation' }
  }

  const { data, error } = await cmsDb
    .from('doc_attachments')
    .insert({
      document_id: guarded.documentId,
      filename: originalFilename,
      storage_path: input.path,
      file_size: fileSize,
      mime_type: mimeType,
    })
    .select('id, filename')
    .maybeSingle()

  if (error || !data) {
    await cmsDb.storage.from(ATTACHMENTS_BUCKET).remove([input.path])
    return {
      success: false,
      error: error?.message || 'Failed to save attachment',
    }
  }

  revalidate(guarded.type, input.key)
  await logAuditEvent({
    userId: guarded.userId,
    action: 'cms.attachment_uploaded',
    resourceType: 'cms_document',
    resourceId: `${guarded.type}/${input.key}`,
    details: {
      filename: data.filename,
      file_size: fileSize,
      mime_type: mimeType,
    },
  })

  return { success: true }
}

export async function deleteCmsAttachment(input: {
  type: string
  key: string
  attachmentId: string
}): Promise<AttachmentActionResult> {
  const guarded = await guardedDocument(input.type, input.key)
  if ('error' in guarded) return { success: false, error: guarded.error }

  const { data: attachment, error: fetchError } = await cmsDb
    .from('doc_attachments')
    .select('id, document_id, filename, storage_path')
    .eq('id', input.attachmentId)
    .eq('document_id', guarded.documentId)
    .maybeSingle()

  if (fetchError) return { success: false, error: fetchError.message }
  if (!attachment) return { success: false, error: 'Attachment not found' }

  // Storage object first: an orphaned row still renders (broken link),
  // while an orphaned object is invisible and unrecoverable from the UI.
  const { error: storageError } = await cmsDb.storage
    .from(ATTACHMENTS_BUCKET)
    .remove([attachment.storage_path])

  if (storageError) return { success: false, error: storageError.message }

  const { error: deleteError } = await cmsDb
    .from('doc_attachments')
    .delete()
    .eq('id', attachment.id)

  if (deleteError) return { success: false, error: deleteError.message }

  revalidate(guarded.type, input.key)
  await logAuditEvent({
    userId: guarded.userId,
    action: 'cms.attachment_deleted',
    resourceType: 'cms_document',
    resourceId: `${guarded.type}/${input.key}`,
    details: { filename: attachment.filename },
  })

  return { success: true }
}
