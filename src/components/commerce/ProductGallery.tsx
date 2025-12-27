'use client'

import { Button } from '@/components/ui/button'
import { Box, ChevronLeft, ChevronRight, ImageIcon, ZoomIn } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useMemo, useState, useCallback } from 'react'
import { ProductImage, ThumbnailImage } from '@/components/ui/optimized-image'
import { cn } from '@/lib/utils'
import { ProductImageLightbox } from '@/components/commerce/ProductImageLightbox'

// Lazy load the 3D component
const ProductViewer3D = dynamic(() => import('./ProductViewer3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-50" />,
})

interface ProductGalleryProps {
  images?: string[]
  modelPath?: string
  modelPreviewUrl?: string // Preview image shown while 3D model loads
  productName: string
}

const navButtonBaseClass =
  'absolute top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white border border-slate-200 shadow-sm text-slate-800 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'
const thumbBaseClass =
  'shrink-0 size-20 rounded border overflow-hidden transition-all cursor-pointer'
const thumbActiveClass = 'border-cyan-700 ring-2 ring-cyan-700/20'
const thumbInactiveClass = 'border-slate-200 hover:border-slate-300'

function ImageFallback({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
      <div className="w-24 h-24 mb-4 rounded-full bg-slate-200 flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-slate-600" aria-hidden="true" />
      </div>
      <p className="text-slate-600 font-mono text-sm">{label}</p>
    </div>
  )
}

export function ProductGallery({
  images = [],
  modelPath,
  productName,
}: ProductGalleryProps) {
  const [view, setView] = useState<'3d' | 'images'>(
    modelPath && images.length === 0 ? '3d' : 'images',
  )
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const hasImages = images.length > 0
  const imageCount = images.length
  const displayImageIndex = useMemo(() => {
    if (!hasImages) return 0
    return ((selectedImage % imageCount) + imageCount) % imageCount
  }, [hasImages, imageCount, selectedImage])
  const displayImageSrc = useMemo(() => {
    if (!hasImages) return null
    return images.at(displayImageIndex) ?? images.at(0) ?? null
  }, [displayImageIndex, hasImages, images])

  // Handle image selection from thumbnail
  const handleSelectImage = useCallback((idx: number) => {
    setSelectedImage(idx)
    setView('images')
  }, [])

  const handleHoverImage = useCallback(
    (idx: number) => {
      if (view !== 'images') return
      setSelectedImage(idx)
    },
    [view],
  )

  const handleOpenLightbox = useCallback(() => {
    if (!hasImages) return
    setView('images')
    setLightboxOpen(true)
  }, [hasImages])

  const handlePrevImage = useCallback(() => {
    if (!hasImages) return
    setView('images')
    setSelectedImage((idx) => (idx - 1 + images.length) % images.length)
  }, [hasImages, images.length])

  const handleNextImage = useCallback(() => {
    if (!hasImages) return
    setView('images')
    setSelectedImage((idx) => (idx + 1) % images.length)
  }, [hasImages, images.length])

  return (
    <div className="space-y-4">
      {/* Main Display (fixed 1:1 to prevent layout shift) */}
      <div className="relative aspect-square bg-white rounded border border-slate-200 shadow-sm overflow-hidden group">
        {/* Content */}
        {view === '3d' && modelPath ? (
          <ProductViewer3D modelPath={modelPath} />
        ) : hasImages && displayImageSrc ? (
          <button
            type="button"
            onClick={handleOpenLightbox}
            className="absolute inset-0 cursor-zoom-in"
            aria-label="Open image viewer"
          >
            <div className="relative h-full w-full">
              {/* Soft backdrop so letterboxing feels intentional */}
              <Image
                src={displayImageSrc}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                quality={20}
                loading="lazy"
                fetchPriority="low"
                className="object-cover blur-2xl scale-110 opacity-25 pointer-events-none"
                aria-hidden={true}
              />
              <div
                className="absolute inset-0 bg-white/55"
                aria-hidden="true"
              />
              <ProductImage
                src={displayImageSrc}
                alt={`${productName} - Image ${displayImageIndex + 1}`}
                sizes="(max-width: 1024px) 100vw, 60vw"
                quality={95}
                wrapperClassName="absolute inset-0"
                fallback={
                  <ImageFallback label="Image unavailable" />
                }
              />
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"
                aria-hidden="true"
              />
              {images.length > 0 && (
                <div
                  className="absolute bottom-3 right-3 rounded-full bg-black/60 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                >
                  <ZoomIn className="size-4" aria-hidden="true" />
                </div>
              )}
            </div>
          </button>
        ) : (
          <ImageFallback label={productName} />
        )}

        {/* On-page navigation (image view only) */}
        {view === 'images' && images.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={handlePrevImage}
              className={cn(navButtonBaseClass, 'left-3')}
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={handleNextImage}
              className={cn(navButtonBaseClass, 'right-3')}
              aria-label="Next image"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </Button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/60 text-white px-2 py-1 font-mono text-xs">
              {displayImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {(modelPath || images.length > 1) && (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {modelPath && (
            <button
              type="button"
              onClick={() => {
                setView('3d')
              }}
              className={cn(
                `${thumbBaseClass} bg-slate-50`,
                view === '3d'
                  ? thumbActiveClass
                  : thumbInactiveClass,
              )}
              aria-label="View 3D model"
            >
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Box
                  className={cn(
                    'w-4 h-4 mb-0.5',
                    view === '3d' ? 'text-cyan-700' : 'text-slate-600',
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'text-[10px] font-mono',
                    view === '3d' ? 'text-cyan-700' : 'text-slate-600',
                  )}
                >
                  3D
                </span>
              </div>
            </button>
          )}
          {images.map((imageUrl, idx) => (
            <button
              key={imageUrl + idx}
              type="button"
              onMouseEnter={() => {
                handleHoverImage(idx)
              }}
              onFocus={() => {
                handleHoverImage(idx)
              }}
              onClick={() => {
                handleSelectImage(idx)
              }}
              className={cn(
                `${thumbBaseClass} relative`,
                view === 'images' && displayImageIndex === idx
                  ? thumbActiveClass
                  : thumbInactiveClass,
              )}
              aria-label={`View image ${idx + 1}`}
            >
              <ThumbnailImage
                src={imageUrl}
                alt={`${productName} thumbnail ${idx + 1}`}
                size={80}
                wrapperClassName="absolute inset-0"
              />
            </button>
          ))}
        </div>
      )}

      <ProductImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={images}
        productName={productName}
        activeIndex={displayImageIndex}
        onActiveIndexChange={handleSelectImage}
      />
    </div>
  )
}
