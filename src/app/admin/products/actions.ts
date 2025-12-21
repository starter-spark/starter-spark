"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { type Database } from "@/lib/supabase/database.types"
import { logAuditEvent } from "@/lib/audit"
import { requireAdmin, requireAdminOrStaff } from "@/lib/auth"

type ProductTagType = Database["public"]["Enums"]["product_tag_type"]

interface ProductData {
  name: string
  slug: string
  description: string | null
  price_cents: number
  stripe_price_id: string | null
  specs: Record<string, string> | null
  // Discount fields (Phase 14.3)
  discount_percent: number | null
  discount_expires_at: string | null
  original_price_cents: number | null
  // Inventory fields (Phase 14.4)
  track_inventory: boolean
  stock_quantity: number | null
  low_stock_threshold: number | null
}

interface TagData {
  tag: ProductTagType
  priority: number | null
  discount_percent: number | null
}

const AUTOMATED_TAGS: ProductTagType[] = ["out_of_stock", "limited", "new", "discount"]

function isDiscountActive({
  discountPercent,
  originalPriceCents,
  discountExpiresAt,
}: {
  discountPercent: number | null
  originalPriceCents: number | null
  discountExpiresAt: string | null
}): boolean {
  if (!discountPercent || discountPercent <= 0) return false
  if (!originalPriceCents || originalPriceCents <= 0) return false
  if (!discountExpiresAt) return true
  const expiresAt = new Date(discountExpiresAt)
  if (Number.isNaN(expiresAt.getTime())) return true
  return expiresAt.getTime() > Date.now()
}

async function syncDiscountTag(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  {
    discountPercent,
    originalPriceCents,
    discountExpiresAt,
  }: {
    discountPercent: number | null
    originalPriceCents: number | null
    discountExpiresAt: string | null
  }
): Promise<{ error: string | null }> {
  const active = isDiscountActive({
    discountPercent,
    originalPriceCents,
    discountExpiresAt,
  })

  if (!active) {
    const { error } = await supabase
      .from("product_tags")
      .delete()
      .eq("product_id", productId)
      .eq("tag", "discount")

    if (error) {
      console.error("Error removing discount tag:", error)
      return { error: error.message }
    }

    return { error: null }
  }

  const { error } = await supabase
    .from("product_tags")
    .upsert(
      {
        product_id: productId,
        tag: "discount",
        priority: 80,
        discount_percent: discountPercent,
      },
      { onConflict: "product_id,tag" }
    )

  if (error) {
    console.error("Error upserting discount tag:", error)
    return { error: error.message }
  }

  return { error: null }
}

export async function updateProduct(
  id: string,
  data: ProductData
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }

  const { data: updatedProduct, error } = await supabase
    .from("products")
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description,
      price_cents: data.price_cents,
      stripe_price_id: data.stripe_price_id,
      specs: data.specs,
      // Discount fields (Phase 14.3)
      discount_percent: data.discount_percent,
      discount_expires_at: data.discount_expires_at,
      original_price_cents: data.original_price_cents,
      // Inventory fields (Phase 14.4)
      track_inventory: data.track_inventory,
      stock_quantity: data.stock_quantity,
      low_stock_threshold: data.low_stock_threshold,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Error updating product:", error)
    return { error: error.message }
  }

  if (!updatedProduct) {
    return { error: "Product not found" }
  }

  const { error: discountTagError } = await syncDiscountTag(supabase, id, {
    discountPercent: data.discount_percent,
    originalPriceCents: data.original_price_cents,
    discountExpiresAt: data.discount_expires_at,
  })
  if (discountTagError) return { error: discountTagError }

  // Log audit event
  await logAuditEvent({
    userId: guard.user.id,
    action: 'product.updated',
    resourceType: 'product',
    resourceId: id,
    details: {
      name: data.name,
      slug: data.slug,
      priceCents: data.price_cents,
    },
  })

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${data.slug}`)
  revalidatePath("/shop")
  revalidatePath(`/shop/${data.slug}`)
  revalidatePath("/")

  return { error: null }
}

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdmin(supabase)
  if (!guard.ok) return { error: guard.error }

  // Check if product has any licenses
  const { count } = await supabase
    .from("licenses")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id)

  if (count && count > 0) {
    return { error: "Cannot delete product with existing licenses" }
  }

  const { data: deletedProduct, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id, name, slug")
    .maybeSingle()

  if (error) {
    console.error("Error deleting product:", error)
    return { error: error.message }
  }

  if (!deletedProduct) {
    return { error: "Product not found" }
  }

  // Log audit event
  await logAuditEvent({
    userId: guard.user.id,
    action: 'product.deleted',
    resourceType: 'product',
    resourceId: id,
    details: {
      name: deletedProduct.name,
      slug: deletedProduct.slug,
    },
  })

  revalidatePath("/admin/products")
  revalidatePath("/shop")
  revalidatePath("/")

  return { error: null }
}

export async function createProduct(
  data: ProductData
): Promise<{ error: string | null; id: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error, id: null }

  if (!data.name.trim()) {
    return { error: "Name is required", id: null }
  }
  if (!data.slug.trim()) {
    return { error: "Slug is required", id: null }
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description,
      price_cents: data.price_cents,
      stripe_price_id: data.stripe_price_id,
      specs: data.specs,
      // Discount fields (Phase 14.3)
      discount_percent: data.discount_percent,
      discount_expires_at: data.discount_expires_at,
      original_price_cents: data.original_price_cents,
      // Inventory fields (Phase 14.4)
      track_inventory: data.track_inventory,
      stock_quantity: data.stock_quantity,
      low_stock_threshold: data.low_stock_threshold,
    })
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Error creating product:", error)
    return { error: error.message, id: null }
  }

  if (!product) {
    return { error: "Failed to create product", id: null }
  }

  const { error: discountTagError } = await syncDiscountTag(supabase, product.id, {
    discountPercent: data.discount_percent,
    originalPriceCents: data.original_price_cents,
    discountExpiresAt: data.discount_expires_at,
  })
  if (discountTagError) return { error: discountTagError, id: null }

  // Log audit event
  await logAuditEvent({
    userId: guard.user.id,
    action: 'product.created',
    resourceType: 'product',
    resourceId: product.id,
    details: {
      name: data.name,
      slug: data.slug,
      priceCents: data.price_cents,
    },
  })

  revalidatePath("/admin/products")
  revalidatePath("/shop")
  revalidatePath("/")

  return { error: null, id: product.id }
}

export async function updateProductTags(
  productId: string,
  tags: TagData[]
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }

  const { data: productRow, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle()

  if (productError) {
    console.error("Error verifying product exists:", productError)
    return { error: productError.message }
  }
  if (!productRow) return { error: "Product not found" }

  const automatedInRequest = tags.filter((t) => AUTOMATED_TAGS.includes(t.tag))
  if (automatedInRequest.length > 0) {
    return { error: "Some tags are managed automatically and cannot be edited here" }
  }

  const seen = new Set<ProductTagType>()
  for (const t of tags) {
    if (seen.has(t.tag)) return { error: "Duplicate tags are not allowed" }
    seen.add(t.tag)
  }

  const { data: existingTags, error: existingError } = await supabase
    .from("product_tags")
    .select("tag")
    .eq("product_id", productId)

  if (existingError) {
    console.error("Error loading existing product tags:", existingError)
    return { error: existingError.message }
  }

  const desiredManualTags = tags.map((t) => t.tag)
  const desiredSet = new Set(desiredManualTags)

  const existingManualTags = (existingTags ?? [])
    .map((t) => t.tag)
    .filter((t): t is ProductTagType => Boolean(t) && !AUTOMATED_TAGS.includes(t))
  const toDelete = existingManualTags.filter((t) => !desiredSet.has(t))

  const upsertRows = tags.map((t) => ({
    product_id: productId,
    tag: t.tag,
    priority: t.priority,
    discount_percent: null,
  }))

  if (upsertRows.length > 0) {
    const { error: upsertError } = await supabase
      .from("product_tags")
      .upsert(upsertRows, { onConflict: "product_id,tag" })

    if (upsertError) {
      console.error("Error upserting tags:", upsertError)
      return { error: upsertError.message }
    }
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("product_tags")
      .delete()
      .eq("product_id", productId)
      .in("tag", toDelete)

    if (deleteError) {
      console.error("Error deleting removed tags:", deleteError)
      return { error: deleteError.message }
    }
  }

  // Log audit event
  await logAuditEvent({
    userId: guard.user.id,
    action: 'product.tags_updated',
    resourceType: 'product',
    resourceId: productId,
    details: {
      tags: tags.map(t => t.tag),
      tagCount: tags.length,
    },
  })

  revalidatePath("/admin/products")
  revalidatePath("/shop")
  revalidatePath("/")

  return { error: null }
}

interface MediaData {
  id?: string
  type: "image" | "video" | "3d_model" | "document"
  url: string
  storage_path?: string
  filename: string
  file_size?: number
  mime_type?: string
  alt_text?: string
  is_primary?: boolean
  sort_order?: number
  isNew?: boolean
}

export async function saveProductMedia(
  productId: string,
  media: MediaData[]
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }

  // Ensure only one primary media per type (DB enforces this; normalize to avoid errors)
  const primaryByType = new Set<MediaData["type"]>()
  const normalizedMedia = media.map((item) => {
    if (!item.is_primary) return item
    if (primaryByType.has(item.type)) {
      return { ...item, is_primary: false }
    }
    primaryByType.add(item.type)
    return item
  })

  // Get existing media for this product
  const { data: existingMedia, error: existingError } = await supabase
    .from("product_media")
    .select("id")
    .eq("product_id", productId)

  if (existingError) {
    console.error("Error loading existing media:", existingError)
    return { error: existingError.message }
  }

  const existingIds = new Set((existingMedia || []).map((m) => m.id))
  const currentIds = new Set(normalizedMedia.filter((m) => m.id).map((m) => m.id))

  // Delete media that's no longer in the list
  const toDelete = [...existingIds].filter((id) => !currentIds.has(id))
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("product_media")
      .delete()
      .in("id", toDelete)

    if (deleteError) {
      console.error("Error deleting media:", deleteError)
      return { error: deleteError.message }
    }
  }

  // Update existing media (alt_text, is_primary, sort_order)
  const existingUpdates = normalizedMedia
    .filter((m) => m.id && existingIds.has(m.id))
    // Ensure we clear old primaries before setting new ones to avoid transient unique violations.
    .sort((a, b) => (a.is_primary ? 1 : 0) - (b.is_primary ? 1 : 0))

  for (const item of existingUpdates) {
    if (!item.id) continue // TypeScript guard
    const { error: updateError } = await supabase
      .from("product_media")
      .update({
        alt_text: item.alt_text || null,
        is_primary: item.is_primary || false,
        sort_order: item.sort_order ?? 0,
      })
      .eq("id", item.id)
      .eq("product_id", productId)

    if (updateError) {
      console.error("Error updating media:", updateError)
      return { error: updateError.message }
    }
  }

  // Insert new media
  const newMedia = normalizedMedia.filter((m) => !m.id || m.isNew)
  if (newMedia.length > 0) {
    const { error: insertError } = await supabase.from("product_media").insert(
      newMedia.map((m) => ({
        product_id: productId,
        type: m.type,
        url: m.url,
        storage_path: m.storage_path || null,
        filename: m.filename,
        file_size: m.file_size || null,
        mime_type: m.mime_type || null,
        alt_text: m.alt_text || null,
        is_primary: m.is_primary || false,
        sort_order: m.sort_order ?? 0,
        created_by: guard.user.id,
      }))
    )

    if (insertError) {
      console.error("Error inserting media:", insertError)
      return { error: insertError.message }
    }
  }

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath("/admin/products")
  revalidatePath("/shop")

  return { error: null }
}
