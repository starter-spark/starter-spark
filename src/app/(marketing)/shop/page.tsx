import { createClient } from "@/lib/supabase/server"
import { ShopFilters } from "./ShopFilters"
import { Package } from "lucide-react"
import Link from "next/link"
import { ProductTag } from "@/components/commerce"
import { getContents } from "@/lib/content"
import type { Metadata } from "next"
import { siteConfig } from "@/config/site"

const pageTitle = "Robotics Kits"
const pageDescription = "Precision robotics kits for the next generation of engineers. Each kit includes components, tools, and full access to our learning platform."

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: `${siteConfig.url}/shop`,
    siteName: siteConfig.name,
    images: [
      {
        url: `/api/og?title=${encodeURIComponent(pageTitle)}&subtitle=${encodeURIComponent(pageDescription)}`,
        width: 1200,
        height: 630,
        alt: pageTitle,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [`/api/og?title=${encodeURIComponent(pageTitle)}&subtitle=${encodeURIComponent(pageDescription)}`],
  },
}

export default async function ShopPage() {
  const supabase = await createClient()

  // Fetch dynamic content
  const content = await getContents(
    ["shop.header.title", "shop.header.description", "shop.empty"],
    {
      "shop.header.title": "Robotics Kits",
      "shop.header.description": "Everything you need to start building. Each kit includes components, tools, and full access to our learning platform.",
      "shop.empty": "No products available at this time.",
    }
  )

  // Fetch active and coming_soon products with their tags and media
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      slug,
      name,
      price_cents,
      original_price_cents,
      discount_percent,
      discount_expires_at,
      specs,
      status,
      created_at,
      product_tags (
        tag,
        priority,
        discount_percent,
        expires_at
      ),
      product_media (
        type,
        url,
        is_primary,
        image_type,
        sort_order
      )
    `)
    .in("status", ["active", "coming_soon"])

  if (error) {
    console.error("Error fetching products:", error)
  }

  // Transform and sort products for display
  const transformedProducts = (products || []).map((product) => {
    const specs = product.specs as {
      category?: string
      badge?: string | null
      inStock?: boolean
    } | null

    // Filter out expired tags
    const now = new Date()
    const validTags = (product.product_tags || []).filter((t) => {
      if (!t.expires_at) return true // No expiration = always valid
      return new Date(t.expires_at) > now
    })

    const tags: ProductTag[] = validTags.map((t) => ({
      tag: t.tag,
      priority: t.priority,
      discount_percent: t.discount_percent,
    }))

    // Get primary image or first hero image or first image (filter out 3D models)
    const media = (product.product_media || []).filter((m) => m.type === 'image' || !m.type)
    const primaryImage = media.find((m) => m.is_primary)
    const heroImage = media.find((m) => m.image_type === "hero")
    const sortedMedia = [...media].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const firstImage = sortedMedia[0]
    const image = primaryImage?.url || heroImage?.url || firstImage?.url || undefined

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price_cents / 100,
      inStock: specs?.inStock ?? true,
      badge: specs?.badge || undefined,
      category: specs?.category || "kit",
      status: (product.status || "active"),
      tags,
      createdAt: product.created_at,
      image,
      // Discount fields (Phase 14.3)
      originalPrice: product.original_price_cents ? product.original_price_cents / 100 : null,
      discountPercent: product.discount_percent,
      discountExpiresAt: product.discount_expires_at,
    }
  })

  // Sort products according to PLAN.md algorithm:
  // 1. Out of stock products always last
  // 2. Featured products first
  // 3. Then by tag priority sum
  // 4. Then by created date (newest first)
  const sortedProducts = transformedProducts.sort((a, b) => {
    const aHasOutOfStock = a.tags.some(t => t.tag === "out_of_stock")
    const bHasOutOfStock = b.tags.some(t => t.tag === "out_of_stock")
    const aHasFeatured = a.tags.some(t => t.tag === "featured")
    const bHasFeatured = b.tags.some(t => t.tag === "featured")

    // Out of stock last
    if (aHasOutOfStock && !bHasOutOfStock) return 1
    if (!aHasOutOfStock && bHasOutOfStock) return -1

    // Featured first
    if (aHasFeatured && !bHasFeatured) return -1
    if (!aHasFeatured && bHasFeatured) return 1

    // By priority sum
    const aPriority = a.tags.reduce((sum, t) => sum + (t.priority ?? 0), 0)
    const bPriority = b.tags.reduce((sum, t) => sum + (t.priority ?? 0), 0)
    if (aPriority !== bPriority) return bPriority - aPriority

    // By date (newest first)
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bDate - aDate
  })

  const hasProducts = sortedProducts.length > 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-mono text-cyan-700 mb-2">Shop</p>
          <h1 className="font-mono text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            {content["shop.header.title"]}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            {content["shop.header.description"]}
          </p>
        </div>
      </section>

      {/* Visually hidden h2 for proper heading hierarchy - must be in server component for axe */}
      <h2 className="sr-only">Available Products</h2>

      {hasProducts ? (
        /* Client-side filters and product grid */
        <ShopFilters products={sortedProducts} />
      ) : (
        /* Empty state when no products exist */
        <section className="py-16 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded border border-slate-200 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-mono text-xl text-slate-900 mb-3">
                Products Coming Soon
              </h3>
              <p className="text-slate-600 max-w-md mb-6">
                {content["shop.empty"]}
              </p>
              <Link
                href="/#newsletter"
                className="inline-block px-6 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-mono rounded transition-colors"
              >
                Get Notified
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Educator CTA */}
      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="p-8 bg-white rounded border border-slate-200 text-center">
            <h2 className="font-mono text-2xl text-slate-900 mb-3">
              Educator or School?
            </h2>
            <p className="text-slate-600 mb-6 max-w-xl mx-auto">
              We offer special pricing and curriculum support for classrooms.
              Contact us to learn about our education program.
            </p>
            <a
              href="mailto:education@starterspark.com"
              className="inline-block px-6 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-mono rounded transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
