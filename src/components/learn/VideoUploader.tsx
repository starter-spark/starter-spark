"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Video, X, Loader2, CheckCircle2, AlertCircle, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveLearnAssetUrl, parseLearnAssetRef, toLearnAssetRef } from "@/lib/learn-assets"

interface VideoUploaderProps {
  lessonId: string
  value: string
  onChange: (url: string) => void
  className?: string
}

type UploadState = "idle" | "uploading" | "success" | "error"

export function VideoUploader({
  lessonId,
  value,
  onChange,
  className,
}: VideoUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLearnAsset =
    Boolean(parseLearnAssetRef(value)) ||
    value.startsWith("lessons/") ||
    (value.includes("/storage/v1/object/") && value.includes("/learn-assets/"))
  const isExternalUrl = value.startsWith("http") && !isLearnAsset

  const [showUrlInput, setShowUrlInput] = useState(
    Boolean(value) && isExternalUrl
  )
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current !== null) {
        globalThis.clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      if (resetTimeoutRef.current !== null) {
        globalThis.clearTimeout(resetTimeoutRef.current)
        resetTimeoutRef.current = null
      }
    }
  }, [])

  const isYouTubeOrExternal =
    Boolean(value) &&
    (value.includes("youtube.com") ||
      value.includes("youtu.be") ||
      value.includes("vimeo.com") ||
      isExternalUrl)

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)
    setUploadState("uploading")
    setProgress(0)

    // Validate file type client-side
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"]
    if (!allowedTypes.includes(file.type)) {
      setError("Only MP4, WebM, and MOV videos are supported")
      setUploadState("error")
      return
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      setError("Video must be under 100MB")
      setUploadState("error")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("lessonId", lessonId)
    formData.append("assetType", "video")

    try {
      // Simulate progress for better UX (actual upload doesn't provide progress)
      if (progressIntervalRef.current !== null) {
        globalThis.clearInterval(progressIntervalRef.current)
      }
      progressIntervalRef.current = globalThis.setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/learn/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error || "Upload failed")
      }

      const data = await response.json() as { url?: string; path?: string }

      setProgress(100)
      setUploadState("success")

      const videoRef =
        typeof (data as { ref?: unknown }).ref === "string"
          ? (data as { ref: string }).ref
          : typeof data.path === "string"
            ? toLearnAssetRef("learn-assets", data.path)
            : ""
      onChange(videoRef)
      setShowUrlInput(false)

      // Reset after a moment
      if (resetTimeoutRef.current !== null) {
        globalThis.clearTimeout(resetTimeoutRef.current)
      }
      resetTimeoutRef.current = globalThis.setTimeout(() => {
        setUploadState("idle")
        setProgress(0)
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed"
      setError(message)
      setUploadState("error")
    } finally {
      if (progressIntervalRef.current !== null) {
        globalThis.clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [lessonId, onChange])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("video/")) {
      void handleFileSelect(file)
    } else {
      setError("Please drop a video file (MP4, WebM, or MOV)")
      setUploadState("error")
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void handleFileSelect(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ""
  }

  const clearVideo = () => {
    onChange("")
    setUploadState("idle")
    setError(null)
    setShowUrlInput(false)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => { setShowUrlInput(false); }}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-mono transition-colors",
            showUrlInput ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-cyan-100 text-cyan-800"
          )}
        >
          <Upload className="w-3 h-3 inline mr-1" />
          Upload
        </button>
        <button
          type="button"
          onClick={() => { setShowUrlInput(true); }}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-mono transition-colors",
            showUrlInput ? "bg-cyan-100 text-cyan-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Link2 className="w-3 h-3 inline mr-1" />
          URL
        </button>
      </div>

      {showUrlInput ? (
        /* URL Input Mode */
        <div className="space-y-2">
          <Label className="text-xs">Video URL (YouTube, Vimeo, or direct link)</Label>
          <Input
            value={value}
            onChange={(e) => { onChange(e.target.value); }}
            placeholder="https://youtube.com/watch?v=... or https://..."
          />
        </div>
      ) : (
        /* Upload Mode */
        <>
          {/* Current Video Preview */}
          {value && !isYouTubeOrExternal && (
            <div className="relative rounded border border-slate-200 overflow-hidden bg-black">
              <video
                src={resolveLearnAssetUrl(value)}
                controls
                className="w-full max-h-[300px]"
              />
              <button
                type="button"
                onClick={clearVideo}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Drop Zone */}
          {!value && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                dragOver ? "border-cyan-500 bg-cyan-50" : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
                uploadState === "uploading" && "pointer-events-none opacity-70"
              )}
            >
              {uploadState === "idle" && (
                <>
                  <Video className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                  <p className="font-mono text-sm text-slate-700">
                    Drop video here or click to browse
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    MP4, WebM, or MOV up to 100MB
                  </p>
                </>
              )}

              {uploadState === "uploading" && (
                <>
                  <Loader2 className="w-10 h-10 mx-auto mb-3 text-cyan-600 animate-spin" />
                  <p className="font-mono text-sm text-slate-700">
                    Uploading... {progress}%
                  </p>
                  <div className="w-48 h-2 mx-auto mt-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              )}

              {uploadState === "success" && (
                <>
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-600" />
                  <p className="font-mono text-sm text-green-700">
                    Upload complete!
                  </p>
                </>
              )}

              {uploadState === "error" && (
                <>
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
                  <p className="font-mono text-sm text-red-700">
                    {error || "Upload failed"}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setUploadState("idle")
                      setError(null)
                    }}
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Upload Button when video exists */}
          {value && !isYouTubeOrExternal && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Replace Video
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </>
      )}
    </div>
  )
}
