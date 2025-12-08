import { createClient } from "@/lib/supabase/server"
import { ProductGallery, BuyBox, ProductTabs } from "@/components/commerce"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductSchema, getBreadcrumbSchema } from "@/lib/structured-data"

// Type for product specs JSONB
interface ProductSpecs {
  modelPath?: string
  category?: string
  badge?: string | null
  inStock?: boolean
  learningOutcomes?: string[]
  includedItems?: Array<{
    quantity: number
    name: string
    description: string
  }>
  technicalSpecs?: Array<{ label: string; value: string }>
}

type PageParams = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: PageParams
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("name, description")
    .eq("slug", slug)
    .single()

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: product.name,
    description: product.description?.slice(0, 160) || "",
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: PageParams
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch product from database with tags and media
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      product_tags (tag),
      product_media (
        id,
        type,
        url,
        alt_text,
        is_primary,
        image_type,
        sort_order
      )
    `)
    .eq("slug", slug)
    .single()

  if (error || !product) {
    notFound()
  }

  const specs = product.specs as ProductSpecs | null
  const tags = (product.product_tags || []).map((t: { tag: string }) => t.tag)

  // Determine stock status from inventory tracking or tags
  const hasOutOfStockTag = tags.includes("out_of_stock")
  const hasLimitedTag = tags.includes("limited")

  // inStock: check inventory tracking first, then fall back to specs
  const inStock = product.track_inventory
    ? (product.stock_quantity ?? 0) > 0
    : !hasOutOfStockTag && (specs?.inStock ?? true)

  // Extract data from specs with defaults (modelPath now handled after media extraction)
  const learningOutcomes = specs?.learningOutcomes || []
  const includedItems = specs?.includedItems || []
  const technicalSpecs = specs?.technicalSpecs || []
  const price = product.price_cents / 100
  const originalPrice = product.original_price_cents ? product.original_price_cents / 100 : null
  const discountPercent = product.discount_percent
  const discountExpiresAt = product.discount_expires_at

  // Extract images and 3D models from product_media, sorted by sort_order
  const allMedia = (product.product_media || [])
    .sort((a: { sort_order?: number | null }) => (a.sort_order ?? 0))

  // Filter images only (exclude 3D models, videos, documents)
  const imageMedia = allMedia.filter((m: { type?: string }) => m.type === 'image' || !m.type)
  const images = imageMedia.map((m: { url: string }) => m.url)
  const primaryImage = imageMedia.find((m: { is_primary?: boolean | null }) => m.is_primary)?.url || images[0]

  // Get 3D model if available (from product_media or specs)
  const modelMedia = allMedia.find((m: { type?: string }) => m.type === '3d_model')
  const modelPathFromMedia = modelMedia?.url
  const modelPathFromSpecs = specs?.modelPath
  const finalModelPath = modelPathFromMedia || modelPathFromSpecs

  // Generate structured data for SEO
  const productSchema = getProductSchema({
    name: product.name,
    description: product.description || "",
    price,
    slug,
    inStock,
  })

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: product.name, url: `/shop/${slug}` },
  ])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Breadcrumb */}
      <section className="pt-24 pb-4 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </section>

      {/* Product Hero - 60/40 Split */}
      <section className="pb-16 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left - Gallery (60%) */}
            <div className="w-full lg:w-3/5">
              <ProductGallery
                images={images}
                modelPath={finalModelPath}
                modelPreviewUrl={primaryImage}
                productName={product.name}
              />
            </div>

            {/* Right - Buy Box (40%) */}
            <div className="w-full lg:w-2/5">
              <BuyBox
                id={product.id}
                slug={slug}
                name={product.name}
                price={price}
                inStock={inStock}
                originalPrice={originalPrice}
                discountPercent={discountPercent}
                discountExpiresAt={discountExpiresAt}
                stockQuantity={product.track_inventory ? product.stock_quantity : null}
                isLimitedStock={hasLimitedTag}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Product Tabs */}
      <section className="pb-24 px-6 lg:px-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto pt-12">
          <ProductTabs
            description={product.description || ""}
            learningOutcomes={learningOutcomes}
            includedItems={includedItems}
            specs={technicalSpecs}
          />
        </div>
      </section>
    </div>
  )
}
