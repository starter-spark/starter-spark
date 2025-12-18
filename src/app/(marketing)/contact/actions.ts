"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"

export type Attachment = {
  name: string
  path: string
  size: number
  type: string
}

export type ContactFormData = {
  name: string
  email: string
  subject: string
  situation: string
  attachments?: Attachment[]
}

export type ContactFormResult = {
  success: boolean
  error?: string
}

export async function submitContactForm(
  data: ContactFormData
): Promise<ContactFormResult> {
  // Basic validation
  if (!data.name || data.name.trim().length < 2) {
    return { success: false, error: "Name must be at least 2 characters" }
  }

  if (!data.email || !data.email.includes("@")) {
    return { success: false, error: "Please enter a valid email address" }
  }

  if (!data.subject || data.subject.trim().length < 2) {
    return { success: false, error: "Subject must be at least 2 characters" }
  }

  if (!data.situation || data.situation.trim().length < 10) {
    return { success: false, error: "Please describe your situation in at least 10 characters" }
  }

  // Validate attachments if present
  if (data.attachments && data.attachments.length > 0) {
    if (data.attachments.length > 5) {
      return { success: false, error: "Maximum 5 attachments allowed" }
    }

    // Validate each attachment has required fields
    for (const attachment of data.attachments) {
      if (!attachment.name || !attachment.path || !attachment.type) {
        return { success: false, error: "Invalid attachment data" }
      }
    }
  }

  try {
    const { error } = await supabaseAdmin.from("contact_submissions").insert({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      subject: data.subject.trim(),
      message: data.situation.trim(), // stored as 'message' in DB
      attachments: data.attachments || [],
    })

    if (error) {
      console.error("Error submitting contact form:", error)
      return { success: false, error: "Failed to submit form. Please try again." }
    }

    // TODO: Send confirmation email to user
    // TODO: Send notification email to team

    return { success: true }
  } catch (err) {
    console.error("Error submitting contact form:", err)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}
