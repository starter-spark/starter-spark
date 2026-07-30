'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileDown, Loader2, Trash2, Upload } from 'lucide-react'
import {
  createCmsAttachmentUpload,
  deleteCmsAttachment,
  finalizeCmsAttachment,
} from '@/cms/attachment-actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { formatFileSize } from '@/lib/file-size'

export interface PanelAttachment {
  id: string
  filename: string
  fileSize: number | null
  url: string
}

interface CmsAttachmentsPanelProps {
  type: string
  typeKey: string
  bucket: string
  accept: string
  attachments: PanelAttachment[]
}

export function CmsAttachmentsPanel({
  type,
  typeKey,
  bucket,
  accept,
  attachments,
}: CmsAttachmentsPanelProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PanelAttachment | null>(null)

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setIsUploading(true)
    setError(null)
    try {
      const minted = await createCmsAttachmentUpload({
        type,
        key: typeKey,
        filename: file.name,
        fileSize: file.size,
        declaredMimeType: file.type,
      })
      if (!minted.success || !minted.path || !minted.token) {
        setError(minted.error ?? 'Failed to upload attachment')
        return
      }

      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(minted.path, minted.token, file, {
          contentType: minted.contentType,
        })
      if (uploadError) {
        setError(uploadError.message)
        return
      }

      const result = await finalizeCmsAttachment({
        type,
        key: typeKey,
        path: minted.path,
      })
      if (!result.success) {
        setError(result.error ?? 'Failed to upload attachment')
        return
      }

      router.refresh()
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    setError(null)

    const result = await deleteCmsAttachment({
      type,
      key: typeKey,
      attachmentId: target.id,
    })
    if (!result.success) {
      setError(result.error ?? 'Failed to delete attachment')
      return
    }
    router.refresh()
  }

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Attachments</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Downloadable files shown with the published entry (max 10MB).
            Uploads and deletes take effect immediately.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => void handleSelect(e)}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload file'}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        {attachments.length === 0 ? (
          <p className="text-sm text-slate-500">No attachments yet.</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 rounded border border-slate-200 p-3"
              >
                <FileDown className="h-5 w-5 shrink-0 text-cyan-700" />
                <div className="min-w-0 flex-1">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-mono text-sm text-slate-900 hover:text-cyan-700"
                  >
                    {attachment.filename}
                  </a>
                  {attachment.fileSize !== null && (
                    <p className="text-xs text-slate-500">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeleteTarget(attachment)
                  }}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{deleteTarget?.filename}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The file stops being downloadable immediately. Unlike content
              versions, deleted attachments cannot be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
