import { createClient } from "@/lib/supabase/server"
import { ProductSpotlightSection } from "./ProductSpotlight"
import { getProductSchema } from "@/lib/structured-data"

/**
 * Server component that fetches the featured product and renders ProductSpotlight
 * Also generates Product schema JSON-LD for SEO
 */
export async function FeaturedProduct() {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, slug, description, price_cents, specs, is_featured")
    .eq("is_featured", true)
    .single()

  if (error || !product) {
    console.error("Failed to fetch featured product:", error?.message)
    return null
  }

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductSpotlightSection
        product={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          priceCents: product.price_cents,
          specs: product.specs as Record<string, string> | null,
        }}
      />
    </>
  )
}
