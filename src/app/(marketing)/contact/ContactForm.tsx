'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { submitContactForm, type ContactFormData } from './actions'
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  X,
  FileVideo,
} from 'lucide-react'
import Link from 'next/link'
import { formatFileSize } from '@/lib/file-size'

// Max file sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_TOTAL_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_FILES = 5

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

interface UploadedFile {
  name: string
  path: string
  size: number
  type: string
}

interface FilePreview {
  file: File
  preview: string
  isVideo: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUploadedFile(value: unknown): value is UploadedFile {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.path === 'string' &&
    typeof value.size === 'number' &&
    typeof value.type === 'string'
  )
}

export function ContactForm() {
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    error?: string
  } | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    situation: '',
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadError(null)

    if (files.length === 0) return

    // Check total file count
    if (filePreviews.length + files.length > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    // Validate each file
    const newPreviews: FilePreview[] = []
    let totalSize = filePreviews.reduce((sum, f) => sum + f.file.size, 0)

    for (const file of files) {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(
          `"${file.name}" is not allowed. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) are accepted.`,
        )
        return
      }

      // Check individual file size
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE

      if (file.size > maxSize) {
        const maxMB = maxSize / (1024 * 1024)
        setUploadError(
          `"${file.name}" exceeds ${maxMB}MB limit for ${isVideo ? 'videos' : 'images'}`,
        )
        return
      }

      totalSize += file.size
      if (totalSize > MAX_TOTAL_SIZE) {
        setUploadError('Total file size exceeds 100MB limit')
        return
      }

      // Create preview
      const preview = URL.createObjectURL(file)
      newPreviews.push({ file, preview, isVideo })
    }

    setFilePreviews([...filePreviews, ...newPreviews])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    const preview = filePreviews.at(index)
    if (!preview) return
    URL.revokeObjectURL(preview.preview)
    setFilePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (): Promise<UploadedFile[] | null> => {
    if (filePreviews.length === 0) return []

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      for (const preview of filePreviews) {
        formData.append('files', preview.file)
      }

      const response = await fetch('/api/contact/upload', {
        method: 'POST',
        body: formData,
      })

      const data: unknown = await response.json()

      if (!response.ok) {
        const message =
          isRecord(data) && typeof data.error === 'string'
            ? data.error
            : 'Upload failed'
        setUploadError(message)
        return null
      }

      if (
        !isRecord(data) ||
        !Array.isArray(data.files) ||
        !data.files.every(isUploadedFile)
      ) {
        setUploadError('Upload failed')
        return null
      }

      return data.files
    } catch {
      setUploadError('Failed to upload files. Please try again.')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    setUploadError(null)

    if (!acceptedTerms) {
      setResult({
        success: false,
        error: 'Please accept the Privacy Policy and Terms of Service',
      })
      return
    }

    // Upload files first
    const uploaded = await uploadFiles()
    if (uploaded === null) return // Upload error already set

    startTransition(async () => {
      const submitData: ContactFormData = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        situation: formData.situation,
        attachments: uploaded,
      }

      const response = await submitContactForm(submitData)
      setResult(response)

      if (response.success) {
        // Clean up previews
        for (const p of filePreviews) {
          URL.revokeObjectURL(p.preview)
        }
        setFilePreviews([])
        setAcceptedTerms(false)
        setFormData({
          name: '',
          email: '',
          subject: '',
          situation: '',
        })
      }
    })
  }

  if (result?.success) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Message Sent
        </h3>
        <p className="text-slate-600 mb-6">
          Thank you for reaching out. We typically respond within 24-48 hours.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setResult(null)
          }}
        >
          Send Another Message
        </Button>
      </div>
    )
  }

  const isSubmitting = isPending || isUploading

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="bg-white border border-slate-200 rounded-lg p-6 md:p-8 space-y-6"
    >
      {(result?.error || uploadError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{result?.error || uploadError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
            }}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value })
            }}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          type="text"
          placeholder="What is this regarding?"
          value={formData.subject}
          onChange={(e) => {
            setFormData({ ...formData, subject: e.target.value })
          }}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="situation">Describe Your Situation *</Label>
        <Textarea
          id="situation"
          placeholder="Please provide as much detail as possible about your question, issue, or request..."
          value={formData.situation}
          onChange={(e) => {
            setFormData({ ...formData, situation: e.target.value })
          }}
          required
          disabled={isSubmitting}
          rows={6}
          className="resize-none"
        />
        <p className="text-xs text-slate-500">Minimum 10 characters</p>
      </div>

      {/* File Upload */}
      <div className="space-y-3">
        <Label>Attachments (Optional)</Label>
        <p className="text-xs text-slate-500 -mt-1">
          Upload images (JPEG, PNG, GIF, WebP - max 10MB each) or videos (MP4,
          WebM, MOV - max 50MB each). Maximum 5 files, 100MB total.
        </p>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isSubmitting
              ? 'bg-slate-50 border-slate-200'
              : 'border-slate-300 hover:border-cyan-500 cursor-pointer'
          }`}
          onClick={() => !isSubmitting && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isSubmitting}
          />
          <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-600">
            {isSubmitting
              ? 'Please wait...'
              : 'Click to upload or drag and drop'}
          </p>
        </div>

        {/* File Previews */}
        {filePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            {filePreviews.map((preview, index) => (
              <div
                key={index}
                className="relative group bg-slate-50 rounded-lg overflow-hidden border border-slate-200"
              >
                {preview.isVideo ? (
                  <div className="aspect-video flex items-center justify-center bg-slate-100">
                    <FileVideo className="w-12 h-12 text-slate-400" />
                  </div>
                ) : (
                  <div className="aspect-video relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview.preview}
                      alt={preview.file.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs text-slate-600 truncate">
                    {preview.file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(preview.file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isSubmitting}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => {
            setAcceptedTerms(checked === true)
          }}
          disabled={isSubmitting}
          className="mt-0.5"
        />
        <Label
          htmlFor="terms"
          className="text-sm text-slate-600 font-normal cursor-pointer"
        >
          I confirm that I have read and accept the{' '}
          <Link
            href="/privacy"
            className="text-cyan-700 hover:underline"
            target="_blank"
          >
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link
            href="/terms"
            className="text-cyan-700 hover:underline"
            target="_blank"
          >
            Terms of Service
          </Link>
          . *
        </Label>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !acceptedTerms}
        className="w-full md:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isUploading ? 'Uploading files...' : 'Sending...'}
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </>
        )}
      </Button>
    </form>
  )
}
