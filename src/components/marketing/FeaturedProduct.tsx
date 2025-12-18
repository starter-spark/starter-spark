import { createClient } from "@/lib/supabase/server"
import { ProductSpotlightSection } from "./ProductSpotlight"
import { getProductSchema } from "@/lib/structured-data"

/**
 * Server component that fetches the featured product and renders ProductSpotlight
 * Uses the product with the highest-priority "featured" tag
 * Also generates Product schema JSON-LD for SEO
 */
export async function FeaturedProduct() {
  const supabase = await createClient()

  // Get products with "featured" tag, sorted by priority (highest first)
  const { data: featuredTags, error: tagsError } = await supabase
    .from("product_tags")
    .select(`
      priority,
      products (
        id, name, slug, description, price_cents, specs,
        product_media (
          type,
          url,
          is_primary,
          image_type,
          sort_order
        )
      )
    `)
    .eq("tag", "featured")
    .order("priority", { ascending: false, nullsFirst: false })
    .limit(1)
    .single()

  if (tagsError || !featuredTags?.products) {
    console.error("Failed to fetch featured product:", tagsError?.message)
    return null
  }

  const product = featuredTags.products as unknown as {
    id: string
    name: string
    slug: string
    description: string | null
    price_cents: number
    specs: Record<string, string> | null
    product_media: Array<{
      type: string
      url: string
      is_primary: boolean | null
      image_type: string | null
      sort_order: number | null
    }>
  }

  // Extract only images from product_media (filter out 3D models, videos, documents)
  const images = (product.product_media || [])
    .filter((m) => m.type === 'image')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(m => m.url)

  const productSchema = getProductSchema({
    name: product.name,
    description: product.description || "",
    price: product.price_cents / 100,
    slug: product.slug,
    sku: product.slug,
    inStock: true,
  })

	  return (
	    <>
	      {/* Product Schema JSON-LD for SEO */}
	      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
	      <ProductSpotlightSection
	        product={{
	          name: product.name,
	          slug: product.slug,
          description: product.description,
          priceCents: product.price_cents,
          specs: product.specs,
          images,
        }}
      />
    </>
  )
}
