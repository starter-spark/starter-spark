'use server'

import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'

const DOC_ATTACHMENTS_BUCKET = 'doc-attachments'
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024
const MAX_ATTACHMENT_FILENAME_LENGTH = 100

// First entry per extension is the canonical content type sent to storage
// and stored on the row; later entries cover browser-reported variants.
const ATTACHMENT_MIME_TYPES_BY_EXTENSION = new Map<string, string[]>([
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

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set(
  [...ATTACHMENT_MIME_TYPES_BY_EXTENSION.values()].flat(),
)

function sanitizeAttachmentFilename(filename: string): string {
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
  // Truncation can leave a trailing '.' abutting the extension, and
  // finalizeDocAttachment rejects any path containing '..'.
  return truncated.replaceAll(/\.{2,}/g, '.')
}

// Deleting a page (or a category, via the page cascade) removes
// doc_attachments rows through ON DELETE CASCADE, but nothing in the
// database touches the storage objects — without this cleanup they stay
// publicly served forever with no row or UI left to find them. Objects go
// first so a failure leaves rows behind for a retry.
async function removeAttachmentObjectsForPages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pageIds: string[],
): Promise<{ error?: string }> {
  if (pageIds.length === 0) return {}

  const { data, error } = await supabase
    .from('doc_attachments')
    .select('storage_path')
    .in('page_id', pageIds)

  if (error) {
    return { error: error.message }
  }

  const paths = (data ?? []).map((row) => row.storage_path)
  if (paths.length === 0) return {}

  const { error: storageError } = await supabaseAdmin.storage
    .from(DOC_ATTACHMENTS_BUCKET)
    .remove(paths)

  if (storageError) {
    return { error: storageError.message }
  }

  return {}
}

// Doc Category Actions
export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string | null
  const icon = formData.get('icon') as string | null
  const parentId = formData.get('parent_id') as string | null
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0
  const isPublished = formData.get('is_published') === 'true'

  const { data, error } = await supabase
    .from('doc_categories')
    .insert({
      name,
      slug,
      description: description || null,
      icon: icon || null,
      parent_id: parentId || null,
      sort_order: sortOrder,
      is_published: isPublished,
    })
    .select('id, name, slug')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Failed to create category' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'doc_category.created',
    resourceType: 'doc_category',
    resourceId: data.id,
    details: {
      name: data.name,
      slug: data.slug,
      is_published: isPublished,
    },
  })

  revalidatePath('/admin/docs/categories')
  revalidatePath('/docs')
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient()
  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string | null
  const icon = formData.get('icon') as string | null
  const parentId = formData.get('parent_id') as string | null
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0
  const isPublished = formData.get('is_published') === 'true'

  const { data, error } = await supabase
    .from('doc_categories')
    .update({
      name,
      slug,
      description: description || null,
      icon: icon || null,
      parent_id: parentId || null,
      sort_order: sortOrder,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, name, slug')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Category not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'doc_category.updated',
    resourceType: 'doc_category',
    resourceId: data.id,
    details: {
      name: data.name,
      slug: data.slug,
      is_published: isPublished,
    },
  })

  revalidatePath('/admin/docs/categories')
  revalidatePath('/docs')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data: pages, error: pagesError } = await supabase
    .from('doc_pages')
    .select('id')
    .eq('category_id', id)

  if (pagesError) {
    return { error: pagesError.message }
  }

  const removed = await removeAttachmentObjectsForPages(
    supabase,
    (pages ?? []).map((page) => page.id),
  )
  if (removed.error) {
    return { error: removed.error }
  }

  const { data, error } = await supabase
    .from('doc_categories')
    .delete()
    .eq('id', id)
    .select('id, name, slug')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Category not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'doc_category.deleted',
    resourceType: 'doc_category',
    resourceId: data.id,
    details: {
      name: data.name,
      slug: data.slug,
    },
  })

  revalidatePath('/admin/docs/categories')
  revalidatePath('/docs')
  return { success: true }
}

// Doc Page Actions
export async function createDocPage(formData: FormData) {
  const supabase = await createClient()
  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const categoryId = formData.get('category_id') as string
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const content = formData.get('content') as string | null
  const excerpt = formData.get('excerpt') as string | null
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0
  const isPublished = formData.get('is_published') === 'true'

  const { data, error } = await supabase
    .from('doc_pages')
    .insert({
      category_id: categoryId,
      title,
      slug,
      content: content || null,
      excerpt: excerpt || null,
      sort_order: sortOrder,
      is_published: isPublished,
      created_by: user.id,
      updated_by: user.id,
    })
    .select('id, title, slug, is_published')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Failed to create doc page' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'doc_page.created',
    resourceType: 'doc_page',
    resourceId: data.id,
    details: {
      title: data.title,
      slug: data.slug,
      category_id: categoryId,
      is_published: data.is_published,
    },
  })

  revalidatePath('/admin/docs')
  revalidatePath('/docs')
  return { success: true, id: data.id }
}

export async function updateDocPage(id: string, formData: FormData) {
  const supabase = await createClient()
  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const categoryId = formData.get('category_id') as string
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const content = formData.get('content') as string | null
  const excerpt = formData.get('excerpt') as string | null
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0
  const isPublished = formData.get('is_published') === 'true'

  const { data, error } = await supabase
    .from('doc_pages')
    .update({
      category_id: categoryId,
      title,
      slug,
      content: content || null,
      excerpt: excerpt || null,
      sort_order: sortOrder,
      is_published: isPublished,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, title, slug, is_published')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Doc page not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'doc_page.updated',
    resourceType: 'doc_page',
    resourceId: data.id,
    details: {
      title: data.title,
      slug: data.slug,
      category_id: categoryId,
      is_published: data.is_published,
    },
  })

  revalidatePath('/admin/docs')
  revalidatePath('/docs')
  return { success: true }
}

export async function deleteDocPage(id: string) {
  const supabase = await createClient()
  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const removed = await removeAttachmentObjectsForPages(supabase, [id])
  if (removed.error) {
    return { error: removed.error }
  }

  const { data, error } = await supabase
    .from('doc_pages')
    .delete()
    .eq('id', id)
    .select('id, title, slug')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Doc page not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'doc_page.deleted',
    resourceType: 'doc_page',
    resourceId: data.id,
    details: {
      title: data.title,
      slug: data.slug,
    },
  })

  revalidatePath('/admin/docs')
  revalidatePath('/docs')
  return { success: true }
}

// Doc Attachment Actions
//
// Uploads use signed upload URLs so the file bytes never pass through a
// server action (their request body is capped at 1MB by default):
// createDocAttachmentUpload mints a token, the client uploads directly to
// storage, finalizeDocAttachment verifies the object and inserts the row.
export async function createDocAttachmentUpload(
  pageId: string,
  filename: string,
  fileSize: number,
  declaredMimeType: string,
) {
  const supabase = await createClient()
  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }

  const { data: page, error: pageError } = await supabase
    .from('doc_pages')
    .select('id')
    .eq('id', pageId)
    .maybeSingle()

  if (pageError) {
    return { error: pageError.message }
  }

  if (!page) {
    return { error: 'Doc page not found' }
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return { error: 'Empty files are not allowed' }
  }

  if (fileSize > MAX_ATTACHMENT_SIZE_BYTES) {
    return { error: 'File exceeds the 10MB limit' }
  }

  const sanitizedFilename = sanitizeAttachmentFilename(filename)
  const extension = sanitizedFilename.includes('.')
    ? sanitizedFilename.split('.').pop()?.toLowerCase()
    : undefined
  const allowedMimeTypes = extension
    ? ATTACHMENT_MIME_TYPES_BY_EXTENSION.get(extension)
    : undefined

  if (!allowedMimeTypes) {
    return {
      error: `File type not allowed. Allowed: ${[...ATTACHMENT_MIME_TYPES_BY_EXTENSION.keys()].join(', ')}`,
    }
  }

  // Browsers report inconsistent MIME types (empty, octet-stream, or
  // platform-specific variants), so the extension decides the canonical type.
  if (
    declaredMimeType &&
    declaredMimeType !== 'application/octet-stream' &&
    !allowedMimeTypes.includes(declaredMimeType)
  ) {
    return { error: 'File content type does not match its extension' }
  }

  const storagePath = `${pageId}/${randomUUID()}-${sanitizedFilename}`

  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from(DOC_ATTACHMENTS_BUCKET)
    .createSignedUploadUrl(storagePath)

  if (signError || !signed) {
    return { error: signError?.message || 'Failed to create upload URL' }
  }

  return {
    success: true,
    path: signed.path,
    token: signed.token,
    contentType: allowedMimeTypes[0],
  }
}

export async function finalizeDocAttachment(pageId: string, path: string) {
  const supabase = await createClient()
  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  // Only accept paths minted by createDocAttachmentUpload for this page:
  // {pageId}/{uuid}-{filename}, no traversal.
  const objectName = path.startsWith(`${pageId}/`)
    ? path.slice(pageId.length + 1)
    : null
  if (!objectName || objectName.includes('/') || path.includes('..')) {
    return { error: 'Invalid attachment path' }
  }

  // The object name is a 36-char UUID, a dash, then the sanitized filename
  const originalFilename = objectName.slice(37)
  if (!originalFilename) {
    return { error: 'Invalid attachment path' }
  }

  const { data: info, error: infoError } = await supabaseAdmin.storage
    .from(DOC_ATTACHMENTS_BUCKET)
    .info(path)

  if (infoError || !info) {
    return { error: 'Uploaded file not found in storage' }
  }

  const fileSize = info.size ?? null
  const mimeType = info.contentType ?? null

  if (
    (fileSize !== null && fileSize > MAX_ATTACHMENT_SIZE_BYTES) ||
    (mimeType !== null && !ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType))
  ) {
    await supabaseAdmin.storage.from(DOC_ATTACHMENTS_BUCKET).remove([path])
    return { error: 'Uploaded file failed validation' }
  }

  const { data, error } = await supabase
    .from('doc_attachments')
    .insert({
      page_id: pageId,
      filename: originalFilename,
      storage_path: path,
      file_size: fileSize,
      mime_type: mimeType,
    })
    .select('id, filename')
    .maybeSingle()

  if (error || !data) {
    await supabaseAdmin.storage.from(DOC_ATTACHMENTS_BUCKET).remove([path])
    return { error: error?.message || 'Failed to save attachment' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'doc_attachment.uploaded',
    resourceType: 'doc_attachment',
    resourceId: data.id,
    details: {
      filename: data.filename,
      page_id: pageId,
      file_size: fileSize,
      mime_type: mimeType,
    },
  })

  revalidatePath('/admin/docs')
  revalidatePath('/docs')
  return { success: true }
}

export async function deleteDocAttachment(id: string) {
  const supabase = await createClient()
  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data: attachment, error: fetchError } = await supabase
    .from('doc_attachments')
    .select('id, page_id, filename, storage_path')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!attachment) {
    return { error: 'Attachment not found' }
  }

  // Storage object first: an orphaned row still renders (broken link),
  // while an orphaned object is invisible and unrecoverable from the UI.
  const { error: storageError } = await supabaseAdmin.storage
    .from(DOC_ATTACHMENTS_BUCKET)
    .remove([attachment.storage_path])

  if (storageError) {
    return { error: storageError.message }
  }

  const { error: deleteError } = await supabase
    .from('doc_attachments')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return { error: deleteError.message }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'doc_attachment.deleted',
    resourceType: 'doc_attachment',
    resourceId: attachment.id,
    details: {
      filename: attachment.filename,
      page_id: attachment.page_id,
    },
  })

  revalidatePath('/admin/docs')
  revalidatePath('/docs')
  return { success: true }
}

export async function toggleDocPagePublished(id: string, isPublished: boolean) {
  const supabase = await createClient()
  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data, error } = await supabase
    .from('doc_pages')
    .update({
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, title, slug')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Doc page not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: isPublished ? 'doc_page.published' : 'doc_page.unpublished',
    resourceType: 'doc_page',
    resourceId: data.id,
    details: {
      title: data.title,
      slug: data.slug,
    },
  })

  revalidatePath('/admin/docs')
  revalidatePath('/docs')
  return { success: true }
}
