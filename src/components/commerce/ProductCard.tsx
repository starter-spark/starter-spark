'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'motion/react'
import Link from 'next/link'
import { Star, ImageIcon } from 'lucide-react'
import { type Database } from '@/lib/supabase/database.types'
import { ProductImage } from '@/components/ui/optimized-image'

type ProductTagType = Database['public']['Enums']['product_tag_type']

export interface ProductTag {
  tag: ProductTagType
  priority: number | null
  discount_percent?: number | null
}

interface ProductCardProps {
  slug: string
  name: string
  price: number
  image?: string
  inStock: boolean
  badge?: string // Legacy support
  tags?: ProductTag[]
  status?: 'active' | 'coming_soon' | 'draft'
  // Discount fields
  originalPrice?: number | null
  discountPercent?: number | null
  discountExpiresAt?: string | null
}

// Tag styling configuration
const tagStyles: Record<
  ProductTagType,
  { bg: string; text: string; label: string }
> = {
  featured: { bg: 'bg-cyan-700', text: 'text-white', label: 'Featured' },
  discount: { bg: 'bg-amber-700', text: 'text-white', label: 'Sale' },
  new: { bg: 'bg-green-700', text: 'text-white', label: 'New' },
  bestseller: { bg: 'bg-purple-700', text: 'text-white', label: 'Bestseller' },
  limited: { bg: 'bg-red-700', text: 'text-white', label: 'Limited' },
  bundle: { bg: 'bg-blue-700', text: 'text-white', label: 'Bundle' },
  out_of_stock: {
    bg: 'bg-slate-600',
    text: 'text-white',
    label: 'Out of Stock',
  },
}

export function ProductCard({
  slug,
  name,
  price,
  image,
  inStock,
  badge,
  tags = [],
  status = 'active',
  originalPrice,
  discountPercent,
  discountExpiresAt,
}: ProductCardProps) {
  const isComingSoon = status === 'coming_soon'

  // Check if discount is active (exists and not expired)
  const hasActiveDiscount =
    discountPercent &&
    originalPrice &&
    (!discountExpiresAt || new Date(discountExpiresAt) > new Date())

  // Sort tags by priority (higher = first) and limit to 3
  const sortedTags = [...tags]
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .slice(0, 3)

  // Check if out of stock via tags
  const hasOutOfStockTag = tags.some((t) => t.tag === 'out_of_stock')
  const effectiveInStock = !hasOutOfStockTag && inStock

  // Check if featured
  const isFeatured = tags.some((t) => t.tag === 'featured')

  const cardContent = (
    <motion.div
      whileHover={isComingSoon || hasOutOfStockTag ? undefined : { y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card
        className={`h-full bg-white border-slate-200 shadow-sm transition-all cursor-pointer ${
          isComingSoon || hasOutOfStockTag
            ? 'opacity-75'
            : 'hover:shadow-md hover:border-cyan-200'
        }`}
      >
        <CardContent className="p-0">
          {/* Image Area */}
          <div className="relative aspect-square bg-slate-50 overflow-hidden">
            {/* Product Image with loading skeleton, or Placeholder */}
            {image ? (
              <ProductImage
                src={image}
                alt={name}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                quality={90}
                wrapperClassName="absolute inset-0"
                fallback={
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                    <div className="w-16 h-16 mb-3 rounded-full bg-slate-200 flex items-center justify-center">
                      <ImageIcon
                        className="w-8 h-8 text-slate-400"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-slate-600 font-mono text-xs">
                      Image unavailable
                    </p>
                  </div>
                }
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-16 h-16 mb-3 rounded-full bg-slate-200 flex items-center justify-center">
                  <ImageIcon
                    className="w-8 h-8 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-slate-600 font-mono text-xs">
                  Image coming soon
                </p>
              </div>
            )}

            {/* Product Tags (top left) */}
            {sortedTags.length > 0 && (
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {sortedTags.map((tagData) => {
                  const style = tagStyles[tagData.tag]
                  const label =
                    tagData.tag === 'discount' && tagData.discount_percent
                      ? `${tagData.discount_percent}% Off`
                      : style.label
                  return (
                    <Badge
                      key={tagData.tag}
                      variant="secondary"
                      className={`${style.bg} ${style.text} font-mono text-xs`}
                    >
                      {label}
                    </Badge>
                  )
                })}
              </div>
            )}

            {/* Legacy badge support (if no tags) */}
            {badge && sortedTags.length === 0 && (
              <div className="absolute top-3 left-3">
                <Badge
                  variant="secondary"
                  className="bg-cyan-700 text-white font-mono text-xs"
                >
                  {badge}
                </Badge>
              </div>
            )}

            {/* Status Badge (top right) */}
            <div className="absolute top-3 right-3">
              {isComingSoon ? (
                <Badge
                  variant="outline"
                  className="bg-slate-100 text-slate-600 border-slate-300 font-mono text-xs"
                >
                  Coming Soon
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className={`font-mono text-xs ${
                    effectiveInStock
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {effectiveInStock ? 'In Stock' : 'Pre-Order'}
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start gap-2 mb-2">
              <h3 className="font-mono text-lg text-slate-900 line-clamp-2 flex-1">
                {name}
              </h3>
              {isFeatured && (
                <Star
                  className="h-5 w-5 fill-amber-400 text-amber-400 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}
            </div>
            {isComingSoon ? (
              <p className="text-lg font-mono text-slate-600">Price TBD</p>
            ) : hasActiveDiscount ? (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-2xl font-mono text-amber-600">
                  ${price.toFixed(2)}
                </p>
                <p className="text-lg font-mono text-slate-600 line-through">
                  ${originalPrice.toFixed(2)}
                </p>
                <span className="px-1.5 py-0.5 bg-red-700 text-white text-xs font-mono rounded">
                  {discountPercent}% OFF
                </span>
              </div>
            ) : (
              <p className="text-2xl font-mono text-amber-600">
                ${price.toFixed(2)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <Link
      href={`/shop/${slug}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700/20 focus-visible:ring-offset-2 rounded"
    >
      {cardContent}
    </Link>
  )
}
