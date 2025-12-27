'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Box,
  Star,
  Loader2,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { randomId } from '@/lib/random-id'
import { formatFileSize } from '@/lib/file-size'

export interface MediaItem {
  id?: string
  type: 'image' | 'video' | '3d_model' | 'document'
  url: string
  storage_path?: string
  filename: string
  file_size?: number
  mime_type?: string
  alt_text?: string
  is_primary?: boolean
  sort_order?: number
  isNew?: boolean // For tracking unsaved uploads
}

interface MediaUploaderProps {
  productId: string
  media: MediaItem[]
  onChange: (media: MediaItem[]) => void
  bucket?: string
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm'],
  '3d_model': [
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream',
  ],
  document: ['application/pdf'],
}

const MAX_FILE_SIZE_BYTES: Record<MediaItem['type'], number> = {
  image: 15 * 1024 * 1024, // 15MB
  video: 200 * 1024 * 1024, // 200MB
  '3d_model': 100 * 1024 * 1024, // 100MB
  document: 50 * 1024 * 1024, // 50MB
}

function getFileExtension(filename: string): string | null {
  const last = filename.split('.').pop()
  if (!last || last === filename) return null
  return last.toLowerCase()
}

function extensionFromMime(mimeType: string): string | null {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'video/mp4':
      return 'mp4'
    case 'video/webm':
      return 'webm'
    case 'application/pdf':
      return 'pdf'
    case 'model/gltf-binary':
      return 'glb'
    case 'model/gltf+json':
      return 'gltf'
    default:
      return null
  }
}

function detectMediaType(file: File): MediaItem['type'] | null {
  const ext = getFileExtension(file.name)
  if (ext === 'glb' || ext === 'gltf') return '3d_model'
  if (ACCEPTED_TYPES.image.includes(file.type)) return 'image'
  if (ACCEPTED_TYPES.video.includes(file.type)) return 'video'
  if (ACCEPTED_TYPES.document.includes(file.type)) return 'document'
  // Some browsers report .glb as application/octet-stream
  if (
    file.type === 'application/octet-stream' &&
    (ext === 'glb' || ext === 'gltf')
  ) {
    return '3d_model'
  }
  return null
}

function storageFolderFor(type: MediaItem['type']): string {
  if (type === 'image') return 'images'
  if (type === 'video') return 'videos'
  if (type === '3d_model') return 'models'
  return 'documents'
}

function maxFileSizeFor(type: MediaItem['type']): number {
  if (type === 'image') return MAX_FILE_SIZE_BYTES.image
  if (type === 'video') return MAX_FILE_SIZE_BYTES.video
  if (type === '3d_model') return MAX_FILE_SIZE_BYTES['3d_model']
  return MAX_FILE_SIZE_BYTES.document
}

export function MediaUploader({
  productId,
  media,
  onChange,
  bucket = 'products',
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const supabase = createClient()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const uploadFile = useCallback(
    async (file: File): Promise<MediaItem | null> => {
      setErrorMessage(null)

      if (!file || file.size <= 0) {
        setErrorMessage('Empty files are not allowed.')
        return null
      }

      const mediaType = detectMediaType(file)
      if (!mediaType) {
        setErrorMessage(`Unsupported file type for "${file.name}".`)
        return null
      }

      const maxSize = maxFileSizeFor(mediaType)
      if (file.size > maxSize) {
        setErrorMessage(
          `File "${file.name}" exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit.`,
        )
        return null
      }

      const fileId = `${file.name}-${randomId()}`
      setUploading((prev) => [...prev, fileId])

      try {
        const ext =
          getFileExtension(file.name) ??
          extensionFromMime(file.type) ??
          (mediaType === '3d_model' ? 'glb' : null)

        if (!ext) {
          setErrorMessage(
            `Could not determine file extension for "${file.name}".`,
          )
          return null
        }

        const folder = storageFolderFor(mediaType)
        const filename = `${randomId()}.${ext}`
        const storagePath = `${productId}/${folder}/${filename}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (error) {
          console.error('Upload error:', error)
          return null
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(storagePath)

        return {
          type: mediaType,
          url: urlData.publicUrl,
          storage_path: data.path,
          filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          is_primary: false,
          sort_order: media.length,
          isNew: true,
        }
      } catch (err) {
        console.error('Upload failed:', err)
        setErrorMessage('Upload failed. Please try again.')
        return null
      } finally {
        setUploading((prev) => prev.filter((id) => id !== fileId))
      }
    },
    [productId, bucket, supabase.storage, media.length],
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      const uploadPromises = files.map(uploadFile)
      const results = await Promise.all(uploadPromises)
      const newMedia = results.filter((m): m is MediaItem => m !== null)

      if (newMedia.length > 0) {
        const orderedNewMedia = newMedia.map((item, idx) => ({
          ...item,
          sort_order: media.length + idx,
        }))

        // Set first image as primary if no primary exists
        const hasImage = orderedNewMedia.some((m) => m.type === 'image')
        const hasPrimaryImage = media.some(
          (m) => m.type === 'image' && m.is_primary,
        )
        if (hasImage && !hasPrimaryImage) {
          const firstImage = orderedNewMedia.find((m) => m.type === 'image')
          if (firstImage) firstImage.is_primary = true
        }
        onChange([...media, ...orderedNewMedia])
      }
    },
    [media, onChange, uploadFile],
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const uploadPromises = files.map(uploadFile)
    const results = await Promise.all(uploadPromises)
    const newMedia = results.filter((m): m is MediaItem => m !== null)

    if (newMedia.length > 0) {
      const orderedNewMedia = newMedia.map((item, idx) => ({
        ...item,
        sort_order: media.length + idx,
      }))

      const hasImage = orderedNewMedia.some((m) => m.type === 'image')
      const hasPrimaryImage = media.some(
        (m) => m.type === 'image' && m.is_primary,
      )
      if (hasImage && !hasPrimaryImage) {
        const firstImage = orderedNewMedia.find((m) => m.type === 'image')
        if (firstImage) firstImage.is_primary = true
      }
      onChange([...media, ...orderedNewMedia])
    }

    // Reset input
    e.target.value = ''
  }

  const handleRemove = async (index: number) => {
    const item = media.at(index)
    if (!item) return

    // If it was uploaded to storage, delete it
    if (item.storage_path) {
      await supabase.storage.from(bucket).remove([item.storage_path])
    }

    const newMedia = media.filter((_, i) => i !== index)

    // If we removed the primary image, set a new one
    if (item.is_primary && item.type === 'image') {
      const firstImageIndex = newMedia.findIndex((m) => m.type === 'image')
      if (firstImageIndex !== -1) {
        onChange(
          newMedia.map((m, i) =>
            i === firstImageIndex ? { ...m, is_primary: true } : m,
          ),
        )
        return
      }
    }

    onChange(newMedia)
  }

  const handleSetPrimary = (index: number) => {
    const item = media.at(index)
    if (!item) return
    if (item.type !== 'image') return

    const newMedia = media.map((m, i) => ({
      ...m,
      is_primary: m.type === 'image' ? i === index : m.is_primary,
    }))
    onChange(newMedia)
  }

  const handleAltTextChange = (index: number, altText: string) => {
    onChange(
      media.map((m, i) => (i === index ? { ...m, alt_text: altText } : m)),
    )
  }

  const images = media.filter((m) => m.type === 'image')
  const videos = media.filter((m) => m.type === 'video')
  const models = media.filter((m) => m.type === '3d_model')
  const documents = media.filter((m) => m.type === 'document')

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => void handleDrop(e)}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-cyan-500 bg-cyan-50'
            : 'border-slate-300 hover:border-slate-400',
        )}
      >
        <input
          type="file"
          multiple
          accept={[
            ...ACCEPTED_TYPES.image,
            ...ACCEPTED_TYPES.video,
            '.glb',
            '.gltf',
            ...ACCEPTED_TYPES.document,
          ].join(',')}
          onChange={(e) => void handleFileSelect(e)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <Upload className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-2 text-sm font-medium text-slate-700">
          Drop files here or click to upload
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Images, videos, 3D models (.glb), and PDFs
        </p>

        {/* Upload Progress */}
        {uploading.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-cyan-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading {uploading.length} file(s)...
          </div>
        )}

        {errorMessage && (
          <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>

      {/* Images Section */}
      {images.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            Images ({images.length})
          </Label>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {images.map((item) => {
              const originalIndex = media.indexOf(item)
              return (
                <Card key={item.url} className="group relative overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.alt_text || item.filename}
                        className="h-full w-full object-cover"
                      />
                      {item.is_primary && (
                        <div className="absolute left-2 top-2 rounded bg-cyan-600 px-2 py-0.5 text-xs font-medium text-white">
                          Primary
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        {!item.is_primary && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              handleSetPrimary(originalIndex)
                            }}
                          >
                            <Star className="mr-1 h-3 w-3" />
                            Primary
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => void handleRemove(originalIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-2">
                      <Input
                        placeholder="Alt text..."
                        value={item.alt_text || ''}
                        onChange={(e) => {
                          handleAltTextChange(originalIndex, e.target.value)
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Videos Section */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            Videos ({videos.length})
          </Label>
          <div className="grid gap-4 sm:grid-cols-2">
            {videos.map((item) => {
              const originalIndex = media.indexOf(item)
              return (
                <Card key={item.url} className="group">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-16 w-24 items-center justify-center rounded bg-slate-100">
                        <Video className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.filename}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(item.file_size, {
                            unknownLabel: 'Size unknown',
                            bytesLabel: 'bytes',
                            precisionKb: 0,
                          })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleRemove(originalIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 3D Models Section */}
      {models.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            3D Models ({models.length})
          </Label>
          <div className="grid gap-4 sm:grid-cols-2">
            {models.map((item) => {
              const originalIndex = media.indexOf(item)
              return (
                <Card key={item.url} className="group">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-16 w-24 items-center justify-center rounded bg-slate-100">
                        <Box className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.filename}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(item.file_size, {
                            unknownLabel: 'Size unknown',
                            bytesLabel: 'bytes',
                            precisionKb: 0,
                          })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleRemove(originalIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Documents Section */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Documents ({documents.length})
            </Label>
            <p className="text-xs text-slate-500 mt-0.5">
              Name PDFs with &ldquo;datasheet&rdquo; to show the download button
              on product pages
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {documents.map((item) => {
              const originalIndex = media.indexOf(item)
              return (
                <Card key={item.url} className="group">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-16 w-24 items-center justify-center rounded bg-slate-100">
                        <FileText className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.filename}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(item.file_size, {
                            unknownLabel: 'Size unknown',
                            bytesLabel: 'bytes',
                            precisionKb: 0,
                          })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleRemove(originalIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {media.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No media uploaded yet</p>
        </div>
      )}
    </div>
  )
}
