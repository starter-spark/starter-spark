'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimitAction } from '@/lib/rate-limit'
import { checkBotId } from '@/lib/botid'
import { sendContactConfirmation, sendContactNotification } from '@/lib/email/send'
import { headers } from 'next/headers'
import type { Json } from '@/lib/supabase/database.types'

export interface Attachment {
  name: string
  path: string
  size: number
  type: string
}

const ALLOWED_ATTACHMENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

const MAX_TOTAL_ATTACHMENT_BYTES = 100 * 1024 * 1024
const MAX_IMAGE_ATTACHMENT_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_ATTACHMENT_BYTES = 50 * 1024 * 1024
const LEGACY_ATTACHMENT_PATH_RE =
  /^\d{4}\/\d{2}\/\d{2}\/[a-f0-9]{32}_\d+\.(?:jpg|png|gif|webp|mp4|webm|mov)$/i
const SESSION_ATTACHMENT_PATH_RE =
  /^contact\/[a-f0-9]{32}\/\d{4}\/\d{2}\/\d{2}\/[a-f0-9]{32}_\d+\.(?:jpg|png|gif|webp|mp4|webm|mov)$/i

function getUploadSessionFromPath(path: string): string | null {
  const match = /^contact\/([a-f0-9]{32})\//i.exec(path)
  return match ? match[1].toLowerCase() : null
}

function isValidAttachmentPath(path: string): boolean {
  if (!path || path.length > 500) return false
  if (path.startsWith('/') || path.includes('..') || path.includes('\\'))
    return false

  return (
    LEGACY_ATTACHMENT_PATH_RE.test(path) ||
    SESSION_ATTACHMENT_PATH_RE.test(path)
  )
}

export interface ContactFormData {
  name: string
  email: string
  subject: string
  situation: string
  attachments?: Attachment[]
}

export interface ContactFormResult {
  success: boolean
  error?: string
}

export async function submitContactForm(
  data: ContactFormData,
): Promise<ContactFormResult> {
  // Basic validation
  if (!data.name || data.name.trim().length < 2) {
    return { success: false, error: 'Name must be at least 2 characters' }
  }

  if (!data.email?.includes('@')) {
    return { success: false, error: 'Please enter a valid email address' }
  }

  if (!data.subject || data.subject.trim().length < 2) {
    return { success: false, error: 'Subject must be at least 2 characters' }
  }

  if (!data.situation || data.situation.trim().length < 10) {
    return {
      success: false,
      error: 'Please describe your situation in at least 10 characters',
    }
  }

  // Validate attachments if present
  if (data.attachments && data.attachments.length > 0) {
    if (data.attachments.length > 5) {
      return { success: false, error: 'Maximum 5 attachments allowed' }
    }

    const sessionIds = new Set<string>()
    let totalBytes = 0

    // Validate each attachment has required fields
    for (const attachment of data.attachments) {
      if (
        !attachment.name ||
        attachment.name.length > 120 ||
        attachment.name.includes('/') ||
        attachment.name.includes('\\') ||
        !attachment.path ||
        !attachment.type ||
        typeof attachment.size !== 'number'
      ) {
        return { success: false, error: 'Invalid attachment data' }
      }

      if (!ALLOWED_ATTACHMENT_TYPES.has(attachment.type)) {
        return { success: false, error: 'Invalid attachment type' }
      }

      if (!isValidAttachmentPath(attachment.path)) {
        return { success: false, error: 'Invalid attachment path' }
      }

      if (
        attachment.size <= 0 ||
        attachment.size > MAX_TOTAL_ATTACHMENT_BYTES
      ) {
        return { success: false, error: 'Invalid attachment size' }
      }

      totalBytes += attachment.size

      const isVideo = attachment.type.startsWith('video/')
      const maxPerFile = isVideo
        ? MAX_VIDEO_ATTACHMENT_BYTES
        : MAX_IMAGE_ATTACHMENT_BYTES
      if (attachment.size > maxPerFile) {
        return { success: false, error: 'Attachment exceeds size limit' }
      }

      const sessionId = getUploadSessionFromPath(attachment.path)
      if (sessionId) sessionIds.add(sessionId)
    }

    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      return { success: false, error: 'Total attachment size exceeds limit' }
    }

    // If any attachment uses a session prefix, require all to match the same session.
    if (sessionIds.size > 1) {
      return { success: false, error: 'Invalid attachment session' }
    }
    if (sessionIds.size === 1) {
      const [sessionId] = sessionIds
      const expectedPrefix = `contact/${sessionId}/`
      const allMatch = data.attachments.every((a) =>
        a.path.startsWith(expectedPrefix),
      )
      if (!allMatch) {
        return { success: false, error: 'Invalid attachment session' }
      }
    }
  }

  try {
    const headersList = await headers()
    const ipAddress =
      headersList.get('cf-connecting-ip') ||
      headersList.get('x-real-ip') ||
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      null

    const identifier = ipAddress || data.email.trim().toLowerCase()
    const rate = await rateLimitAction(identifier, 'contactForm')
    if (!rate.success) {
      return {
        success: false,
        error: rate.error || 'Too many requests. Please try again later.',
      }
    }

    const botResult = await checkBotId()
    if (botResult.isBot && !botResult.isVerifiedBot) {
      return {
        success: false,
        error: 'Access denied. Automated requests are not allowed.',
      }
    }

    const { data: inserted, error } = await supabaseAdmin.from('contact_submissions').insert({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      subject: data.subject.trim(),
      message: data.situation.trim(), // stored as 'message' in DB
      attachments: (data.attachments || []) as unknown as Json,
    }).select('id').single()

    if (error) {
      console.error('Error submitting contact form:', error)
      return {
        success: false,
        error: 'Failed to submit form. Please try again.',
      }
    }

    const safeName = data.name.trim()
    const safeEmail = data.email.trim().toLowerCase()
    const safeSubject = data.subject.trim()
    const safeMessage = data.situation.trim()

    const attachmentsForEmail =
      data.attachments && data.attachments.length > 0
        ? data.attachments.map((a) => ({
            name: a.name,
            size: a.size,
            type: a.type,
          }))
        : undefined

    const results = await Promise.allSettled([
      sendContactConfirmation({
        to: safeEmail,
        name: safeName,
        subject: safeSubject,
      }),
      sendContactNotification({
        submissionId: inserted?.id,
        name: safeName,
        email: safeEmail,
        subject: safeSubject,
        message: safeMessage,
        attachments: attachmentsForEmail,
      }),
    ])

    for (const r of results) {
      if (r.status === 'rejected') {
        console.error('Contact email failed:', r.reason)
      }
    }

    return { success: true }
  } catch (err) {
    console.error('Error submitting contact form:', err)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
