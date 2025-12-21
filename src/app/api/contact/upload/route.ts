import { type NextRequest, NextResponse } from "next/server"
import { fileTypeFromBuffer } from "file-type"
import { supabaseAdmin } from "@/lib/supabase/admin"
import crypto from "node:crypto"
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit"

// Allowed file types with their magic byte signatures
const ALLOWED_TYPES = {
  // Images
  "image/jpeg": { maxSize: 10 * 1024 * 1024 }, // 10MB
  "image/png": { maxSize: 10 * 1024 * 1024 },
  "image/gif": { maxSize: 10 * 1024 * 1024 },
  "image/webp": { maxSize: 10 * 1024 * 1024 },
  // Videos
  "video/mp4": { maxSize: 50 * 1024 * 1024 }, // 50MB
  "video/webm": { maxSize: 50 * 1024 * 1024 },
  "video/quicktime": { maxSize: 50 * 1024 * 1024 },
} as const

type AllowedMimeType = keyof typeof ALLOWED_TYPES

// Maximum total upload size per submission (100MB)
const MAX_TOTAL_SIZE = 100 * 1024 * 1024

// Maximum number of files per submission
const MAX_FILES = 5

// Sanitize filename - remove dangerous characters, limit length
function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const basename = filename.split(/[\\/]/).pop() || "file"

  // Remove dangerous characters, keep only alphanumeric, dash, underscore, dot
  const sanitized = basename
    .replaceAll(/[^a-zA-Z0-9._-]/g, "_")
    .replaceAll(/\.{2,}/g, ".") // Remove multiple dots
    .slice(0, 100) // Limit length

  // Ensure it has an extension
  if (!sanitized.includes(".")) {
    return `${sanitized}.bin`
  }

  return sanitized
}

// Generate a secure random path to prevent enumeration
function getExtensionForMimeType(mimeType: AllowedMimeType): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/gif":
      return "gif"
    case "image/webp":
      return "webp"
    case "video/mp4":
      return "mp4"
    case "video/webm":
      return "webm"
    case "video/quicktime":
      return "mov"
  }
}

function getAllowedTypeConfig(mimeType: AllowedMimeType): { maxSize: number } {
  switch (mimeType) {
    case "image/jpeg":
      return ALLOWED_TYPES["image/jpeg"]
    case "image/png":
      return ALLOWED_TYPES["image/png"]
    case "image/gif":
      return ALLOWED_TYPES["image/gif"]
    case "image/webp":
      return ALLOWED_TYPES["image/webp"]
    case "video/mp4":
      return ALLOWED_TYPES["video/mp4"]
    case "video/webm":
      return ALLOWED_TYPES["video/webm"]
    case "video/quicktime":
      return ALLOWED_TYPES["video/quicktime"]
  }
}

function generateSecurePath(
  originalFilename: string,
  mimeType: AllowedMimeType,
  uploadSession: string
): string {
  const timestamp = Date.now()
  const randomId = crypto.randomBytes(16).toString("hex")
  const sanitizedName = sanitizeFilename(originalFilename)

  const ext = getExtensionForMimeType(mimeType) || sanitizedName.split(".").pop() || "bin"

  // Path format: contact/<session>/YYYY/MM/DD/randomId_timestamp.ext
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `contact/${uploadSession}/${year}/${month}/${day}/${randomId}_${timestamp}.${ext}`
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, "contactUpload")
  if (rateLimitResponse) return rateLimitResponse

  try {
    const uploadSession = crypto.randomBytes(16).toString("hex")

    // Parse multipart form data
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    // Validate number of files
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      )
    }

    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: "Total file size exceeds 100MB limit" },
        { status: 400 }
      )
    }

    const uploadedPaths: string[] = []
    const uploadedFiles: {
      name: string
      path: string
      size: number
      type: string
    }[] = []

    const cleanupUploadedFiles = async () => {
      if (uploadedPaths.length === 0) return
      try {
        const { error: cleanupError } = await supabaseAdmin.storage
          .from("contact-attachments")
          .remove(uploadedPaths)
        if (cleanupError) {
          console.error("Failed to cleanup uploaded files:", cleanupError)
        }
      } catch (err) {
        console.error("Unexpected error cleaning up uploaded files:", err)
      }
    }

    try {
      for (const file of files) {
        // Basic size check before reading
        if (file.size === 0) {
          await cleanupUploadedFiles()
          return NextResponse.json(
            { error: "Empty files are not allowed" },
            { status: 400 }
          )
        }

        // Read file buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // SECURITY: Detect actual file type from magic bytes, not from header
        const detectedType = await fileTypeFromBuffer(buffer)

        if (!detectedType) {
          await cleanupUploadedFiles()
          return NextResponse.json(
            { error: `Could not determine file type for: ${file.name}. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) are allowed.` },
            { status: 400 }
          )
        }

        // Check if detected type is allowed
        if (!(detectedType.mime in ALLOWED_TYPES)) {
          await cleanupUploadedFiles()
          return NextResponse.json(
            { error: `File type "${detectedType.mime}" is not allowed for: ${file.name}. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) are allowed.` },
            { status: 400 }
          )
        }

        const mimeType = detectedType.mime as AllowedMimeType
        const typeConfig = getAllowedTypeConfig(mimeType)

        // Check individual file size limit
        if (file.size > typeConfig.maxSize) {
          const maxMB = typeConfig.maxSize / (1024 * 1024)
          await cleanupUploadedFiles()
          return NextResponse.json(
            { error: `File "${file.name}" exceeds ${maxMB}MB limit for ${mimeType.startsWith("video") ? "videos" : "images"}` },
            { status: 400 }
          )
        }

        // SECURITY: Additional validation for images - check for embedded scripts
        if (mimeType.startsWith("image/")) {
          const bufferString = buffer.toString("utf8", 0, Math.min(buffer.length, 1000))
          const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i, // onclick=, onerror=, etc.
            /<\?php/i,
            /<%/i, // ASP tags
          ]

          for (const pattern of dangerousPatterns) {
            if (pattern.test(bufferString)) {
              await cleanupUploadedFiles()
              return NextResponse.json(
                { error: `File "${file.name}" contains potentially malicious content` },
                { status: 400 }
              )
            }
          }
        }

        // Generate secure storage path
        const storagePath = generateSecurePath(file.name, mimeType, uploadSession)

        // Upload to Supabase Storage using service role
        const { error: uploadError } = await supabaseAdmin.storage
          .from("contact-attachments")
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: false, // Never overwrite existing files
          })

        if (uploadError) {
          console.error("Storage upload error:", uploadError)
          await cleanupUploadedFiles()
          return NextResponse.json(
            { error: "Failed to upload file. Please try again." },
            { status: 500 }
          )
        }

        uploadedPaths.push(storagePath)
        uploadedFiles.push({
          name: sanitizeFilename(file.name),
          path: storagePath,
          size: file.size,
          type: mimeType,
        })
      }
    } catch (err) {
      await cleanupUploadedFiles()
      console.error("Unexpected error processing uploads:", err)
      return NextResponse.json(
        { error: "An unexpected error occurred during upload" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        uploadSession,
        files: uploadedFiles,
      },
      { headers: rateLimitHeaders("contactUpload") }
    )

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred during upload" },
      { status: 500 }
    )
  }
}

// Only allow POST
export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
