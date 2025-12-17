"use client"

import { Button } from "@/components/ui/button"
import { Box, ImageIcon } from "lucide-react"
import dynamic from "next/dynamic"
import { useState, useCallback } from "react"
import { ProductImage, ThumbnailImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"

// Lazy load the 3D component
const ProductViewer3D = dynamic(() => import("./ProductViewer3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-cyan-700 font-mono text-xs space-y-2">
      <div className="w-12 h-12 border border-cyan-700 border-t-cyan-400 animate-spin rounded-full" />
      <span>Loading 3D model...</span>
    </div>
  ),
})

interface ProductGalleryProps {
  images?: string[]
  modelPath?: string
  modelPreviewUrl?: string // Preview image shown while 3D model loads
  productName: string
}

export function ProductGallery({
  images = [],
  modelPath,
  modelPreviewUrl,
  productName,
}: ProductGalleryProps) {
  const [view, setView] = useState<"3d" | "images">(modelPath ? "3d" : "images")
  const [selectedImage, setSelectedImage] = useState(0)

  const hasImages = images.length > 0

  // Handle image selection from thumbnail
  const handleSelectImage = useCallback((idx: number) => {
    setSelectedImage(idx)
    setView("images")
  }, [])

  return (
    <div className="space-y-4">
      {/* Main Display */}
      <div className="relative aspect-square bg-white rounded border border-slate-200 overflow-hidden">
        {/* View Toggle - only show if we have both 3D model AND images */}
        {modelPath && hasImages && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant={view === "3d" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("3d")}
              className={`font-mono text-xs ${
                view === "3d"
                  ? "bg-cyan-700 text-white"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <Box className="w-4 h-4 mr-1" />
              3D
            </Button>
            <Button
              variant={view === "images" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("images")}
              className={`font-mono text-xs ${
                view === "images"
                  ? "bg-cyan-700 text-white"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Photos
            </Button>
          </div>
        )}

        {/* Content */}
        {view === "3d" && modelPath ? (
          <ProductViewer3D
            modelPath={modelPath}
            previewUrl={modelPreviewUrl || images[0]}
            previewAlt={`${productName} preview`}
          />
        ) : hasImages ? (
          <ProductImage
            src={images[selectedImage]}
            alt={`${productName} - Image ${selectedImage + 1}`}
            sizes="(max-width: 1024px) 100vw, 60vw"
            quality={90}
            priority
            wrapperClassName="absolute inset-0"
            fallback={
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="w-24 h-24 mb-4 rounded-full bg-slate-200 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-slate-400" />
                </div>
                <p className="text-slate-400 font-mono text-sm">Failed to load image</p>
              </div>
            }
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="w-24 h-24 mb-4 rounded-full bg-slate-200 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-slate-400 font-mono text-sm">{productName}</p>
          </div>
        )}
      </div>

      {/* Thumbnail Strip - only show if we have images or 3D model */}
      {(hasImages || modelPath) && (
        <div className="flex gap-2">
          {/* 3D Thumbnail (if model available) */}
          {modelPath && (
            <button
              onClick={() => setView("3d")}
              className={`flex-1 max-w-[80px] aspect-square rounded border overflow-hidden transition-all cursor-pointer ${
                view === "3d"
                  ? "border-cyan-700 ring-2 ring-cyan-700/20 bg-cyan-50"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50"
              }`}
            >
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Box className={`w-4 h-4 mb-0.5 ${view === "3d" ? "text-cyan-700" : "text-slate-500"}`} />
                <span className={`text-[10px] font-mono ${view === "3d" ? "text-cyan-700" : "text-slate-500"}`}>
                  3D
                </span>
              </div>
            </button>
          )}
          {/* Image Thumbnails */}
          {images.map((imageUrl, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectImage(idx)}
              className={cn(
                "flex-1 max-w-[80px] aspect-square rounded border overflow-hidden transition-all cursor-pointer relative",
                selectedImage === idx && view === "images"
                  ? "border-cyan-700 ring-2 ring-cyan-700/20"
                  : "border-slate-200 hover:border-slate-300"
              )}
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
    </div>
  )
}
