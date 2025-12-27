'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Camera, Loader2, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import { uploadAvatar, removeCustomAvatar } from './actions'

interface AvatarUploadProps {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    avatar_seed: string | null
  }
  onUpdate: () => void
  onMessage: (message: { type: 'success' | 'error'; text: string }) => void
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function AvatarUpload({ user, onUpdate, onMessage }: AvatarUploadProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()
  const [scale, setScale] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  const hasCustomAvatar = user.avatar_url?.includes('/avatars/')

  // Generate preview when crop changes
  useEffect(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) return

    const image = imgRef.current
    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const previewSize = 96
    canvas.width = previewSize
    canvas.height = previewSize

    ctx.imageSmoothingQuality = 'high'

    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY

    // Clear canvas
    ctx.clearRect(0, 0, previewSize, previewSize)

    // Draw circular clip
    ctx.beginPath()
    ctx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      previewSize,
      previewSize,
    )

    setPreviewUrl(canvas.toDataURL())
  }, [completedCrop])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      onMessage({
        type: 'error',
        text: 'Please upload a JPEG, PNG, WebP, or GIF image.',
      })
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      onMessage({ type: 'error', text: 'Image must be less than 2MB.' })
      return
    }

    // Create image preview for cropping
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setScale(1)
      setShowCropDialog(true)
    }
    reader.readAsDataURL(file)

    // Reset the input so the same file can be selected again
    e.target.value = ''
  }

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, 1))
    },
    [],
  )

  const getCroppedImage = async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    // Set canvas size to desired output size (256x256 for avatars)
    const outputSize = 256
    canvas.width = outputSize
    canvas.height = outputSize

    ctx.imageSmoothingQuality = 'high'

    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputSize,
      outputSize,
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    })
  }

  const handleUpload = async () => {
    setIsUploading(true)

    try {
      const croppedBlob = await getCroppedImage()
      if (!croppedBlob) {
        onMessage({
          type: 'error',
          text: 'Failed to crop image. Please try again.',
        })
        setIsUploading(false)
        return
      }

      const formData = new FormData()
      formData.append('avatar', croppedBlob, 'avatar.jpg')

      const result = await uploadAvatar(formData)

      if (result.error) {
        onMessage({ type: 'error', text: result.error })
      } else {
        onMessage({ type: 'success', text: 'Avatar uploaded successfully!' })
        onUpdate()
      }
    } catch {
      onMessage({
        type: 'error',
        text: 'Failed to upload avatar. Please try again.',
      })
    }

    setIsUploading(false)
    setShowCropDialog(false)
    setImageSrc(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setPreviewUrl(null)
    setScale(1)
  }

  const handleRemove = async () => {
    setIsRemoving(true)

    const result = await removeCustomAvatar()

    if (result.error) {
      onMessage({ type: 'error', text: result.error })
    } else {
      onMessage({
        type: 'success',
        text: 'Custom avatar removed. Using generated avatar.',
      })
      onUpdate()
    }

    setIsRemoving(false)
    setShowRemoveDialog(false)
  }

  const handleCancel = () => {
    setShowCropDialog(false)
    setImageSrc(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setPreviewUrl(null)
    setScale(1)
  }

  return (
    <>
      <div className="flex items-center gap-6">
        {/* Avatar with hover overlay */}
        <div
          className="relative cursor-pointer group"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload profile picture"
        >
          <UserAvatar
            user={{
              id: user.id,
              full_name: user.full_name,
              email: user.email,
              avatar_url: user.avatar_url,
              avatar_seed: user.avatar_seed,
            }}
            size="xl"
          />
          {/* Hover overlay */}
          <div
            className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Profile Picture</p>
          <p className="text-xs text-slate-500">
            {hasCustomAvatar
              ? 'Click to change or remove your custom photo.'
              : 'Click to upload a custom photo.'}
          </p>
          {hasCustomAvatar && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRemoveDialog(true)}
              disabled={isRemoving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              {isRemoving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove
            </Button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Hidden preview canvas */}
      <canvas ref={previewCanvasRef} className="hidden" />

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="sm:max-w-lg md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Crop your photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Main crop area */}
            <div className="relative bg-slate-900 rounded-lg overflow-hidden">
              <div className="flex items-center justify-center min-h-[300px] max-h-[400px] p-4">
                {imageSrc && (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                    className="max-h-[368px]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URL from FileReader */}
                    <img
                      ref={imgRef}
                      src={imageSrc}
                      alt="Crop preview"
                      onLoad={onImageLoad}
                      style={{
                        transform: `scale(${scale})`,
                        maxHeight: '368px',
                        minHeight: '200px',
                        minWidth: '200px',
                        objectFit: 'contain',
                      }}
                    />
                  </ReactCrop>
                )}
              </div>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                disabled={scale <= 0.5}
                className="h-9 w-9"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-[120px] justify-center">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-24 accent-cyan-700"
                />
                <span className="text-xs text-slate-500 w-10 text-right font-mono">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setScale(Math.min(2, scale + 0.1))}
                disabled={scale >= 2}
                className="h-9 w-9"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-2">Preview</p>
                <div className="relative">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- data URL from canvas
                    <img
                      src={previewUrl}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full border-2 border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                      <span className="text-xs text-slate-400">
                        Drag to crop
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleUpload()}
              disabled={isUploading || !completedCrop}
              className="bg-cyan-700 hover:bg-cyan-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove custom photo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Your profile will use an auto-generated avatar instead.
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleRemove()}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
