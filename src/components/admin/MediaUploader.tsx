"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

export type ImageType = "hero" | "knolling" | "detail" | "action" | "packaging" | "other"

export interface MediaItem {
  id?: string
  type: "image" | "video" | "3d_model" | "document"
  url: string
  storage_path?: string
  filename: string
  file_size?: number
  mime_type?: string
  alt_text?: string
  is_primary?: boolean
  sort_order?: number
  image_type?: ImageType // Semantic type for images
  isNew?: boolean // For tracking unsaved uploads
}

const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  hero: "Hero (Main)",
  knolling: "Knolling (Flat Lay)",
  detail: "Detail (Close-up)",
  action: "Action (In Use)",
  packaging: "Packaging",
  other: "Other",
}

interface MediaUploaderProps {
  productId: string
  media: MediaItem[]
  onChange: (media: MediaItem[]) => void
  bucket?: string
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm"],
  "3d_model": ["model/gltf-binary", "model/gltf+json", "application/octet-stream"],
  document: ["application/pdf"],
}


function getMediaType(mimeType: string): MediaItem["type"] {
  if (ACCEPTED_TYPES.image.includes(mimeType)) return "image"
  if (ACCEPTED_TYPES.video.includes(mimeType)) return "video"
  if (ACCEPTED_TYPES["3d_model"].includes(mimeType)) return "3d_model"
  if (ACCEPTED_TYPES.document.includes(mimeType)) return "document"
  // Default based on extension for .glb files
  return "image"
}

function formatFileSize(bytes: number | undefined | null): string {
  if (!bytes || bytes <= 0) return "Size unknown"
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} bytes`
}

export function MediaUploader({ productId, media, onChange, bucket = "products" }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState<string[]>([])

  const supabase = createClient()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const uploadFile = useCallback(async (file: File): Promise<MediaItem | null> => {
    const fileId = `${file.name}-${Date.now()}`
    setUploading((prev) => [...prev, fileId])

    try {
      // Generate unique filename
      const ext = file.name.split(".").pop()
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const storagePath = `${productId}/${filename}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) {
        console.error("Upload error:", error)
        return null
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath)

      // Determine media type
      let mediaType = getMediaType(file.type)
      if (ext === "glb" || ext === "gltf") {
        mediaType = "3d_model"
      }

      return {
        type: mediaType,
        url: urlData.publicUrl,
        storage_path: data.path,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        is_primary: false,
        sort_order: media.length,
        image_type: mediaType === "image" ? "other" : undefined,
        isNew: true,
      }
    } catch (err) {
      console.error("Upload failed:", err)
      return null
    } finally {
      setUploading((prev) => prev.filter((id) => id !== fileId))
    }
  }, [productId, bucket, supabase.storage, media.length])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      const uploadPromises = files.map(uploadFile)
      const results = await Promise.all(uploadPromises)
      const newMedia = results.filter((m): m is MediaItem => m !== null)

      if (newMedia.length > 0) {
        // Set first image as primary if no primary exists
        const hasImage = newMedia.some((m) => m.type === "image")
        const hasPrimaryImage = media.some((m) => m.type === "image" && m.is_primary)
        if (hasImage && !hasPrimaryImage) {
          const firstImage = newMedia.find((m) => m.type === "image")
          if (firstImage) firstImage.is_primary = true
        }
        onChange([...media, ...newMedia])
      }
    },
    [media, onChange, uploadFile]
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const uploadPromises = files.map(uploadFile)
    const results = await Promise.all(uploadPromises)
    const newMedia = results.filter((m): m is MediaItem => m !== null)

    if (newMedia.length > 0) {
      const hasImage = newMedia.some((m) => m.type === "image")
      const hasPrimaryImage = media.some((m) => m.type === "image" && m.is_primary)
      if (hasImage && !hasPrimaryImage) {
        const firstImage = newMedia.find((m) => m.type === "image")
        if (firstImage) firstImage.is_primary = true
      }
      onChange([...media, ...newMedia])
    }

    // Reset input
    e.target.value = ""
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
    if (item.is_primary && item.type === "image") {
      const firstImageIndex = newMedia.findIndex((m) => m.type === "image")
      if (firstImageIndex >= 0) {
        onChange(
          newMedia.map((m, i) => (i === firstImageIndex ? { ...m, is_primary: true } : m))
        )
        return
      }
    }

    onChange(newMedia)
  }

  const handleSetPrimary = (index: number) => {
    const item = media.at(index)
    if (!item) return
    if (item.type !== "image") return

    const newMedia = media.map((m, i) => ({
      ...m,
      is_primary: m.type === "image" ? i === index : m.is_primary,
    }))
    onChange(newMedia)
  }

  const handleAltTextChange = (index: number, altText: string) => {
    onChange(media.map((m, i) => (i === index ? { ...m, alt_text: altText } : m)))
  }

  const handleImageTypeChange = (index: number, imageType: ImageType) => {
    onChange(media.map((m, i) => (i === index ? { ...m, image_type: imageType } : m)))
  }

  const images = media.filter((m) => m.type === "image")
  const videos = media.filter((m) => m.type === "video")
  const models = media.filter((m) => m.type === "3d_model")
  const documents = media.filter((m) => m.type === "document")

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => void handleDrop(e)}
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-cyan-500 bg-cyan-50"
            : "border-slate-300 hover:border-slate-400"
        )}
      >
        <input
          type="file"
          multiple
          accept={[
            ...ACCEPTED_TYPES.image,
            ...ACCEPTED_TYPES.video,
            ".glb",
            ".gltf",
            ...ACCEPTED_TYPES.document,
          ].join(",")}
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
                            onClick={() => handleSetPrimary(originalIndex)}
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
                    <div className="space-y-1.5 p-2">
                      <Input
                        placeholder="Alt text..."
                        value={item.alt_text || ""}
                        onChange={(e) => handleAltTextChange(originalIndex, e.target.value)}
                        className="h-7 text-xs"
                      />
                      <select
                        value={item.image_type || "other"}
                        onChange={(e) => handleImageTypeChange(originalIndex, e.target.value as ImageType)}
                        className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        {Object.entries(IMAGE_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
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
                          {formatFileSize(item.file_size)}
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
                          {formatFileSize(item.file_size)}
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
          <Label className="text-sm font-medium text-slate-700">
            Documents ({documents.length})
          </Label>
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
                          {formatFileSize(item.file_size)}
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
