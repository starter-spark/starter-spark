"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import type PhotoSwipeLightboxType from "photoswipe/lightbox"

interface ProductImageLightboxProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: string[]
  productName: string
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  className?: string
}

interface Dimensions { width: number; height: number }

function wrapIndex(index: number, count: number) {
  if (count <= 0) return 0
  return ((index % count) + count) % count
}

export function ProductImageLightbox({
  open,
  onOpenChange,
  images,
  productName,
  activeIndex,
  onActiveIndexChange,
  className,
}: ProductImageLightboxProps) {
  const count = images.length
  const displayIndex = useMemo(() => wrapIndex(activeIndex, count), [activeIndex, count])

  const reactId = useId()
  const galleryId = useMemo(() => {
    const safe = reactId.replaceAll(/[:]/g, "")
    return `pswp-gallery-${safe}`
  }, [reactId])

  const [isReady, setIsReady] = useState(false)
  const [dimensions, setDimensions] = useState<(Dimensions | null)[]>(() =>
    Array.from({ length: count }, () => null)
  )

  const lightboxRef = useRef<PhotoSwipeLightboxType | null>(null)
  const dimensionsRef = useRef<(Dimensions | null)[]>(dimensions)
  const pendingRef = useRef<Map<number, Promise<Dimensions>>>(new Map())

  useEffect(() => {
    const next = Array.from({ length: images.length }, () => null as Dimensions | null)
    setDimensions(next)
    dimensionsRef.current = next
    pendingRef.current.clear()
  }, [images])

  const ensureDimensions = useCallback(
    (index: number) => {
      const idx = wrapIndex(index, images.length)
      const existing = dimensionsRef.current.at(idx)
      if (existing) return Promise.resolve(existing)

      const pending = pendingRef.current.get(idx)
      if (pending) return pending

      const promise = new Promise<Dimensions>((resolve) => {
        const src = images.at(idx)
        const img = new globalThis.Image()
        img.decoding = "async"

        const finalize = (nextDims: Dimensions) => {
          pendingRef.current.delete(idx)
          dimensionsRef.current.splice(idx, 1, nextDims)
          const galleryEl = document.getElementById(galleryId)
          const anchorEl = galleryEl?.querySelectorAll("a").item(idx) ?? null
          if (anchorEl) {
            anchorEl.dataset.pswpWidth = String(nextDims.width)
            anchorEl.dataset.pswpHeight = String(nextDims.height)
          }
          setDimensions((prev) => {
            const current = prev.at(idx)
            if (current?.width === nextDims.width && current?.height === nextDims.height) {
              return prev
            }
            const next = [...prev]
            next.splice(idx, 1, nextDims)
            return next
          })
          resolve(nextDims)
        }

        if (!src) {
          finalize({ width: 1600, height: 1600 })
          return
        }

        img.src = src
        img.addEventListener('load', () => {
          const width = img.naturalWidth || 1600
          const height = img.naturalHeight || 1600
          finalize({ width, height })
        })
        img.onerror = () => { finalize({ width: 1600, height: 1600 }); }
      })

      pendingRef.current.set(idx, promise)
      return promise
    },
    [galleryId, images]
  )

  useEffect(() => {
    if (count === 0) return

    let isCancelled = false

    void (async () => {
      const { default: PhotoSwipeLightbox } = await import("photoswipe/lightbox")
      if (isCancelled) return

      const lightbox = new PhotoSwipeLightbox({
        gallery: `#${galleryId}`,
        children: "a",
        pswpModule: () => import("photoswipe"),
      })

      lightbox.on("close", () => { onOpenChange(false); })
      lightbox.on("change", () => {
        const idx = lightbox.pswp?.currIndex
        if (typeof idx === "number") onActiveIndexChange(idx)
      })

      lightbox.init()
      lightboxRef.current = lightbox
      setIsReady(true)
    })()

    return () => {
      isCancelled = true
      setIsReady(false)
      lightboxRef.current?.destroy()
      lightboxRef.current = null
    }
  }, [count, galleryId, onActiveIndexChange, onOpenChange])

  useEffect(() => {
    const lightbox = lightboxRef.current
    if (!lightbox || !isReady || count === 0) return

    if (!open) {
      lightbox.pswp?.close()
      return
    }

    const preloadIndexes = new Set<number>([displayIndex])
    if (count > 1) {
      preloadIndexes.add(wrapIndex(displayIndex - 1, count))
      preloadIndexes.add(wrapIndex(displayIndex + 1, count))
    }

    void Promise.all(Array.from(preloadIndexes, ensureDimensions)).then(() => {
      if (!open) return
      if (!lightbox.pswp) {
        lightbox.loadAndOpen(displayIndex)
        return
      }

      if (lightbox.pswp.currIndex !== displayIndex) {
        lightbox.pswp.goTo(displayIndex)
      }
    })
  }, [count, displayIndex, ensureDimensions, isReady, open])

  if (count === 0) return null

  return (
    <div id={galleryId} className={className} data-pswp-product={productName} hidden>
      {images.map((src, idx) => {
        const itemDims = dimensions.at(idx) ?? { width: 1600, height: 1600 }
        return (
          <a
            key={`${src}-${idx}`}
            href={src}
            data-pswp-width={itemDims.width}
            data-pswp-height={itemDims.height}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${productName} image ${idx + 1}`}
          />
        )
      })}
    </div>
  )
}
