'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { ProductGallery } from '@/components/commerce/ProductGallery'
import { SectionIntro } from './SectionIntro'
import { ctaPrimaryCompact } from './cta-classes'
import { StarRating } from '@/features/reviews/components/StarRating'

interface ProductSpotlightProps {
  product: {
    name: string
    slug: string
    description: string | null
    priceCents: number
    images?: string[]
    videoUrl?: string
  }
  reviewSummary?: { average: number; total: number } | null
}

export function ProductSpotlightSection({
  product,
  reviewSummary,
}: ProductSpotlightProps) {
  const priceDisplay = (product.priceCents / 100).toFixed(2)

  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <SectionIntro
          eyebrow="Featured Kit"
          title={product.name}
          className="mb-16"
        />

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Left (60%) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-3/5"
          >
            <ProductGallery
              images={product.images}
              videoUrl={product.videoUrl}
              modelPreviewUrl={product.images?.[0]}
              productName={product.name}
            />
          </motion.div>

          {/* Right (40%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-2/5"
          >
            {reviewSummary && reviewSummary.total > 0 && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <StarRating
                  value={reviewSummary.average}
                  size="sm"
                  label={`${reviewSummary.average.toFixed(1)} out of 5 stars`}
                />
                <Link
                  href={`/shop/${product.slug}#reviews`}
                  className="text-sm text-cyan-700 hover:text-cyan-600 underline-offset-2 hover:underline"
                >
                  {reviewSummary.average.toFixed(1)} · {reviewSummary.total}{' '}
                  review{reviewSummary.total === 1 ? '' : 's'}
                </Link>
              </div>
            )}

            <h3 className="font-mono text-xl text-slate-900 mb-4">
              Your First Real Robot
            </h3>

            <div className="space-y-4 text-slate-600 mb-8">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <>
                  <p>
                    Build a fully functional robotic arm from scratch. Learn
                    mechanical assembly, electronics wiring, and Arduino
                    programming. These are skills that transfer directly to real
                    engineering projects.
                  </p>
                  <p>
                    Each kit includes everything you need: pre-cut acrylic
                    parts, high-torque servos, an Arduino Nano, and our
                    step-by-step digital curriculum with interactive wiring
                    diagrams.
                  </p>
                </>
              )}
            </div>

            {/* Price and CTA */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Starting at</p>
                <p className="text-3xl font-mono text-amber-600">
                  ${priceDisplay}
                </p>
              </div>
              <Button
                asChild
                className={ctaPrimaryCompact}
              >
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
