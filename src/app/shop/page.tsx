import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/commerce"
import { ShopFilters } from "./ShopFilters"

export default async function ShopPage() {
  const supabase = await createClient()

  // Fetch all products from database
  const { data: products, error } = await supabase
    .from("products")
    .select("id, slug, name, price_cents, specs")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching products:", error)
  }

  // Transform products for display
  const transformedProducts = (products || []).map((product) => {
    const specs = product.specs as {
      category?: string
      badge?: string | null
      inStock?: boolean
    } | null

    return {
      slug: product.slug,
      name: product.name,
      price: Math.round(product.price_cents / 100),
      inStock: specs?.inStock ?? true,
      badge: specs?.badge || undefined,
      category: specs?.category || "kit",
    }
  })

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-mono text-cyan-700 mb-2">Shop</p>
          <h1 className="font-mono text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Robotics Kits
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Everything you need to start building. Each kit includes components,
            tools, and full access to our learning platform.
          </p>
        </div>
      </section>

      {/* Visually hidden h2 for proper heading hierarchy - must be in server component for axe */}
      <h2 className="sr-only">Available Products</h2>

      {/* Client-side filters and product grid */}
      <ShopFilters products={transformedProducts} />

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
    </main>
  )
}
