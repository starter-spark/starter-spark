import { createPublicClient } from '@/lib/supabase/public'
import { ProductGallery, BuyBox, ProductTabs } from '@/components/commerce'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getProductSchema,
  getBreadcrumbSchema,
  jsonLdScript,
} from '@/lib/structured-data'
import { siteConfig } from '@/config/site'
import { getContent } from '@/lib/content'
import { resolveParams, type MaybePromise } from '@/lib/next-params'
import type { Json } from '@/lib/supabase/database.types'

// Type for product specs JSONB
interface ProductSpecs {
  modelPath?: string
  category?: string
  badge?: string | null
  inStock?: boolean
  learningOutcomes?: string[]
  includedItems?: {
    quantity: number
    name: string
    description: string
  }[]
  technicalSpecs?: { label: string; value: string }[]
}

type PageParams = MaybePromise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: PageParams
}): Promise<Metadata> {
  const { slug } = await resolveParams(params)
  const supabase = createPublicClient()
  let product: {
    name: string
    description: string | null
    product_media: { url: string; is_primary?: boolean | null; type?: string }[]
  } | null = null
  let productError: { message?: string } | null = null
  try {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        name,
        description,
        product_media (url, is_primary, type)
      `,
      )
      .eq('slug', slug)
      .maybeSingle()
    product = data
    if (error) productError = error
  } catch (error) {
    productError =
      error instanceof Error
        ? { message: error.message }
        : { message: 'Unknown error' }
  }

  if (productError) {
    console.error('Error generating product metadata:', productError)
    return { title: 'Product' }
  }

  if (!product) {
    return { title: 'Product Not Found' }
  }

  // Get primary image for OG
  interface MediaItem {
    url: string
    is_primary?: boolean | null
    type?: string
  }
  const media = (product.product_media as unknown as MediaItem[] | null) || []
  const primaryImage =
    media.find((m) => m.is_primary && m.type === 'image')?.url ||
    media.find((m) => m.type === 'image')?.url

  const title = product.name
  const description = product.description?.slice(0, 160) || ''

  // Build OG image URL with product info
  const ogParams = new URLSearchParams({
    title,
    subtitle: description,
    type: 'product',
  })
  if (primaryImage) {
    ogParams.set('image', primaryImage)
  }
  const ogImageUrl = `/api/og?${ogParams.toString()}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/shop/${slug}`,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: PageParams
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const { slug } = await resolveParams(params)
  let product: {
    id: string
    name: string
    slug: string
    description: string | null
    price_cents: number
    original_price_cents: number | null
    discount_percent: number | null
    discount_expires_at: string | null
    track_inventory: boolean | null
    stock_quantity: number | null
    low_stock_threshold: number | null
    max_quantity_per_order: number | null
    specs: Json | null
    product_media: {
      id?: string
      type?: string
      url: string
      storage_path?: string | null
      filename?: string
      alt_text?: string | null
      is_primary?: boolean | null
      sort_order?: number | null
    }[]
    product_tags: { tag: string }[]
  } | null = null

  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        product_tags (tag),
        product_media (
          id,
          type,
          url,
          storage_path,
          filename,
          alt_text,
          is_primary,
          sort_order
        )
      `,
      )
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      console.error('Error fetching product:', error)
    }
    product = data
  } catch (error) {
    console.error('Error fetching product:', error)
    throw new Error('Failed to load product')
  }

  if (!product) {
    notFound()
  }

  const specs = product.specs as ProductSpecs | null
  interface ProductTag {
    tag: string
  }
  const tags = new Set(
    ((product.product_tags as unknown as ProductTag[] | null) || []).map(
      (t) => t.tag,
    ),
  )

  // Determine stock status from inventory tracking or tags
  const hasOutOfStockTag = tags.has('out_of_stock')

  // In-stock: check inventory tracking first, then fall back to specs.
  const inStock = product.track_inventory
    ? (product.stock_quantity ?? 0) > 0
    : !hasOutOfStockTag && (specs?.inStock ?? true)

  // Extract data from specs with defaults (modelPath now handled after media extraction)
  const learningOutcomes = specs?.learningOutcomes || []
  const includedItems = specs?.includedItems || []
  const technicalSpecs = specs?.technicalSpecs || []
  const price = product.price_cents / 100
  const originalPrice = product.original_price_cents
    ? product.original_price_cents / 100
    : null
  const discountPercent = product.discount_percent
  const discountExpiresAt = product.discount_expires_at

  // Extract images and 3D models from product_media, sorted by sort_order
  interface FullMediaItem {
    url: string
    storage_path?: string | null
    filename?: string
    is_primary?: boolean | null
    type?: string
    sort_order?: number | null
  }
  const allMedia = (
    (product.product_media as unknown as FullMediaItem[] | null) || []
  ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  // Filter images only (exclude 3D models, videos, documents)
  const imageMedia = allMedia.filter((m) => m.type === 'image' || !m.type)
  const images = imageMedia.map((m) => m.url)
  const primaryImage = imageMedia.find((m) => m.is_primary)?.url || images[0]

  // Get 3D model if available (from product_media or specs)
  const modelMedia = allMedia.find((m) => m.type === '3d_model')
  const modelPathFromMedia = modelMedia
    ? await resolveMediaUrl(modelMedia)
    : undefined
  const modelPathFromSpecs = specs?.modelPath
  const finalModelPath = modelPathFromMedia || modelPathFromSpecs

  // Fetch charity percentage from site content
  const charityPercentage = await getContent('global.charity.percentage', '67%')

  // Get datasheet URL if available (document with "datasheet" in filename)
  const datasheetMedia = allMedia.find(
    (m) =>
      m.type === 'document' && m.filename?.toLowerCase().includes('datasheet'),
  )
  const datasheetUrl = datasheetMedia?.url

  // Generate structured data for SEO
  const productSchema = getProductSchema({
    name: product.name,
    description: product.description || '',
    price,
    slug,
    inStock,
  })

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: product.name, url: `/shop/${slug}` },
  ])

  return (
    <div className="bg-slate-50">
      {/* JSON-LD Structured Data for SEO */}
      <script nonce={nonce} type="application/ld+json">
        {jsonLdScript(productSchema)}
      </script>
      <script nonce={nonce} type="application/ld+json">
        {jsonLdScript(breadcrumbSchema)}
      </script>
      {/* Breadcrumb */}
      <section className="pt-24 pb-4 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-cyan-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Shop
          </Link>
        </div>
      </section>

      {/* Product hero (60/40) */}
      <section className="pb-16 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left (60%) */}
            <div className="w-full lg:w-3/5">
              <ProductGallery
                images={images}
                modelPath={finalModelPath}
                modelPreviewUrl={primaryImage}
                productName={product.name}
              />
            </div>

            {/* Right (40%) */}
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
                stockQuantity={
                  product.track_inventory ? product.stock_quantity : null
                }
                lowStockThreshold={
                  product.track_inventory ? product.low_stock_threshold : null
                }
                maxQuantityPerOrder={product.max_quantity_per_order}
                charityPercentage={charityPercentage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Product Tabs */}
      <section className="pb-24 px-6 lg:px-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto pt-12">
          <ProductTabs
            description={product.description || ''}
            learningOutcomes={learningOutcomes}
            includedItems={includedItems}
            specs={technicalSpecs}
            datasheetUrl={datasheetUrl}
          />
        </div>
      </section>
    </div>
  )
}

async function resolveMediaUrl(media: {
  url?: string
  storage_path?: string | null
}) {
  if (!media) return undefined

  const parsed = parseStorageUrl(media.url)
  const bucket = parsed?.bucket || 'products'
  const allowedBuckets = new Set(['products'])
  if (!allowedBuckets.has(bucket)) {
    return media.url
  }
  let storagePath = media.storage_path || parsed?.path || null

  if (!storagePath) return media.url
  storagePath = storagePath.replace(/^\/+/, '')
  if (storagePath.includes('..') || storagePath.includes('\\')) {
    return media.url
  }
  if (storagePath.startsWith(`${bucket}/`)) {
    storagePath = storagePath.slice(bucket.length + 1)
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const publicUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`
    : media.url

  try {
    const { supabaseAdmin } = await import('@/lib/supabase/admin')
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(storagePath, 60 * 60)
    if (!error && data?.signedUrl) return data.signedUrl
  } catch (error) {
    console.error('Failed to create signed URL for product media:', error)
  }

  return publicUrl || media.url
}

function parseStorageUrl(
  url?: string | null,
): { bucket: string; path: string } | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(
      /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/,
    )
    if (!match) return null
    const bucket = match[1]
    const rawPath = match[2]
    const path = decodeURIComponent(rawPath)
    return { bucket, path }
  } catch {
    return null
  }
}
