"use client"

import Image, { ImageProps } from "next/image"
import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  /** Class for the wrapper container */
  wrapperClassName?: string
  /** Show skeleton shimmer while loading */
  showSkeleton?: boolean
  /** Fallback content when image fails to load */
  fallback?: React.ReactNode
  /** Callback when image finishes loading */
  onLoadComplete?: () => void
  /** Duration of fade-in transition in ms */
  fadeInDuration?: number
}

/**
 * OptimizedImage - Next.js Image with skeleton loading, error handling, and smooth transitions
 */
export function OptimizedImage({
  src,
  alt,
  className,
  wrapperClassName,
  showSkeleton = true,
  fallback,
  onLoadComplete,
  fadeInDuration = 300,
  fill,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    onLoadComplete?.()
  }, [onLoadComplete])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  // Default fallback content
  const defaultFallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-12 h-12 mb-2 rounded-full bg-slate-200 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <span className="text-xs text-slate-400 font-mono">Image unavailable</span>
    </div>
  )

  // Render error fallback
  if (hasError) {
    return (
      <div className={cn("relative overflow-hidden", wrapperClassName)}>
        {fallback || defaultFallback}
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {/* Skeleton shimmer - shown while loading */}
      {showSkeleton && isLoading && (
        <div
          className="absolute inset-0 z-10 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-shimmer bg-[length:200%_100%]"
          aria-hidden="true"
        />
      )}

      {/* Actual image - className goes HERE for object-fit */}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={cn(
          "transition-opacity",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        style={{ transitionDuration: `${fadeInDuration}ms` }}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  )
}

/**
 * ProductImage - For product displays with object-cover
 */
export function ProductImage({
  src,
  alt,
  wrapperClassName,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 85,
  ...props
}: Omit<OptimizedImageProps, "fill" | "showSkeleton" | "className"> & {
  priority?: boolean
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className="object-cover"
      wrapperClassName={wrapperClassName}
      sizes={sizes}
      quality={quality}
      priority={priority}
      showSkeleton
      {...props}
    />
  )
}

/**
 * ThumbnailImage - Small preview thumbnails
 */
export function ThumbnailImage({
  src,
  alt,
  wrapperClassName,
  size = 80,
  ...props
}: Omit<OptimizedImageProps, "fill" | "width" | "height" | "sizes" | "className"> & {
  size?: number
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className="object-cover"
      wrapperClassName={wrapperClassName}
      sizes={`${size}px`}
      quality={75}
      showSkeleton
      fadeInDuration={200}
      {...props}
    />
  )
}
