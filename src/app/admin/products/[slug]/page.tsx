import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "./ProductForm"

export const metadata = {
  title: "Edit Product | Admin",
}

async function getProduct(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_tags (
        tag,
        priority,
        discount_percent
      ),
      product_media (
        id,
        type,
        url,
        storage_path,
        filename,
        file_size,
        mime_type,
        alt_text,
        is_primary,
        sort_order
      )
    `)
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    console.error("Error fetching product:", error)
    throw new Error("Failed to load product")
  }

  return data
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  // Transform tags for the form
  interface ProductTagItem { tag: string; priority: number | null; discount_percent: number | null }
  type ProductTagType = "featured" | "discount" | "new" | "bestseller" | "limited" | "bundle" | "out_of_stock"
  const productTags = (product.product_tags as unknown as ProductTagItem[] | null) || []
  const tags = productTags.map((t) => ({
    tag: t.tag as ProductTagType,
    priority: t.priority,
    discount_percent: t.discount_percent,
  }))

  // Transform media for the form
  interface ProductMediaItem {
    id: string
    type: string | null
    url: string
    storage_path: string | null
    filename: string
    file_size: number | null
    mime_type: string | null
    alt_text: string | null
    is_primary: boolean | null
    sort_order: number | null
  }
  const productMedia = (product.product_media as unknown as ProductMediaItem[] | null) || []
  const media = productMedia
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((m) => ({
      id: m.id,
      type: m.type as "image" | "video" | "3d_model" | "document",
      url: m.url,
      storage_path: m.storage_path ?? undefined,
      filename: m.filename,
      file_size: m.file_size ?? undefined,
      mime_type: m.mime_type ?? undefined,
      alt_text: m.alt_text ?? undefined,
      is_primary: m.is_primary ?? false,
      sort_order: m.sort_order ?? 0,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">Edit Product</h1>
        <p className="text-slate-600">Update product details</p>
      </div>
      <ProductForm product={product} initialTags={tags} initialMedia={media} />
    </div>
  )
}
