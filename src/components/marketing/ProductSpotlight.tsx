"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, ImageIcon, ZoomIn } from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { useMemo, useState, useCallback } from "react"
import { ProductImage, ThumbnailImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"
import { ProductImageLightbox } from "@/components/commerce/ProductImageLightbox"

// Default specs shown when product.specs is not available
const defaultSpecs = [
  { label: "Microcontroller", value: "Arduino Nano (ATmega328P)" },
  { label: "Servos", value: "2× SG90, 3× MG996R" },
  { label: "Degrees of Freedom", value: "4 (Base, Shoulder, Elbow, Gripper)" },
  { label: "Power", value: "4× AA Battery Pack" },
  { label: "Build Time", value: "~3 hours" },
  { label: "Skill Level", value: "Beginner friendly" },
]

interface ProductSpotlightProps {
  product: {
    name: string
    slug: string
    description: string | null
    priceCents: number
    specs: Record<string, string> | null
    images?: string[]
  }
}

export function ProductSpotlightSection({ product }: ProductSpotlightProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const images = useMemo(() => product.images ?? [], [product.images])
  const hasImages = images.length > 0
  const imageCount = images.length
  const displayImageIndex = useMemo(() => {
    if (imageCount === 0) return 0
    return ((selectedImage % imageCount) + imageCount) % imageCount
  }, [imageCount, selectedImage])
  const displayImageSrc = useMemo(() => {
    if (imageCount === 0) return null
    return images.at(displayImageIndex) ?? null
  }, [displayImageIndex, imageCount, images])

  const handleSelectImage = useCallback((idx: number) => {
    setSelectedImage(idx)
  }, [])

  // Convert specs object to array format, or use defaults
  const specs = product.specs
    ? Object.entries(product.specs).map(([label, value]) => ({ label, value }))
    : defaultSpecs

  const priceDisplay = (product.priceCents / 100).toFixed(2)

  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-mono text-cyan-700 mb-2">Featured Kit</p>
          <h2 className="font-mono text-3xl lg:text-4xl text-slate-900">
            {product.name}
          </h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Left - Image (60%) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-3/5"
          >
	            <div className="relative aspect-[4/3] bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
	              {hasImages && displayImageSrc ? (
	                <button
	                  type="button"
	                  onClick={() => { setLightboxOpen(true); }}
	                  className="absolute inset-0 cursor-zoom-in group"
	                  aria-label="Open image viewer"
	                >
	                  <ProductImage
	                    src={displayImageSrc}
	                    alt={`${product.name} - Image ${displayImageIndex + 1}`}
	                    sizes="(max-width: 1024px) 100vw, 800px"
	                    quality={95}
	                    priority
	                    wrapperClassName="absolute inset-0"
                    fallback={
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                        <div className="text-center p-8">
                          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-slate-400" />
                          </div>
                          <p className="text-slate-400 font-mono text-sm">
                            Failed to load image
                          </p>
                        </div>
                      </div>
                    }
                  />
                  <div
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute bottom-3 right-3 rounded-full bg-black/60 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  >
                    <ZoomIn className="size-4" />
                  </div>
                </button>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-cyan-50 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-cyan-700" />
                    </div>
                    <p className="text-slate-500 font-mono text-sm">
                      {product.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail strip - only show if we have multiple images */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((imageUrl, idx) => (
                  <button
                    key={imageUrl + idx}
                    type="button"
                    onClick={() => { handleSelectImage(idx); }}
                    className={cn(
                      "shrink-0 size-20 rounded border overflow-hidden transition-all cursor-pointer relative",
                      selectedImage === idx
                        ? "border-cyan-700 ring-2 ring-cyan-700/20"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <ThumbnailImage
                      src={imageUrl}
                      alt={`${product.name} thumbnail ${idx + 1}`}
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
	              productName={product.name}
	              activeIndex={displayImageIndex}
	              onActiveIndexChange={handleSelectImage}
	            />
          </motion.div>

          {/* Right - Content (40%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-2/5"
          >
            <h3 className="font-mono text-xl text-slate-900 mb-4">
              Your First Real Robot
            </h3>

            <div className="space-y-4 text-slate-600 mb-8">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <>
                  <p>
                    Build a fully functional robotic arm from scratch. Learn mechanical
                    assembly, electronics wiring, and Arduino programming—skills that
                    transfer directly to real engineering projects.
                  </p>
                  <p>
                    Each kit includes everything you need: pre-cut acrylic parts,
                    high-torque servos, an Arduino Nano, and our step-by-step digital
                    curriculum with interactive wiring diagrams.
                  </p>
                </>
              )}
            </div>

            {/* Specs Table */}
            <div className="bg-white rounded border border-slate-200 p-4 mb-8">
              <h4 className="font-mono text-sm text-slate-500 mb-3 uppercase tracking-wide">
                Specifications
              </h4>
              <div className="space-y-2">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-slate-500">{spec.label}</span>
                    <span className="text-slate-900 font-mono">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price and CTA */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Starting at</p>
                <p className="text-3xl font-mono text-amber-600">${priceDisplay}</p>
              </div>
              <Button asChild className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono">
                <Link href={`/shop/${product.slug}`}>
                  View Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
