import { createClient } from "@/lib/supabase/server"
import { ShopFilters } from "./ShopFilters"
import { Package } from "lucide-react"
import Link from "next/link"

export default async function ShopPage() {
  const supabase = await createClient()

  // Fetch active and coming_soon products (not drafts)
  const { data: products, error } = await supabase
    .from("products")
    .select("id, slug, name, price_cents, specs, status")
    .in("status", ["active", "coming_soon"])
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
      price: product.price_cents / 100,
      inStock: specs?.inStock ?? true,
      badge: specs?.badge || undefined,
      category: specs?.category || "kit",
      status: (product.status || "active") as "active" | "coming_soon" | "draft",
    }
  })

  const hasProducts = transformedProducts.length > 0

  return (
    <div className="min-h-screen bg-slate-50">
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

      {hasProducts ? (
        /* Client-side filters and product grid */
        <ShopFilters products={transformedProducts} />
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
                We&apos;re working on new robotics kits. Sign up for our newsletter
                to be the first to know when they&apos;re available.
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
