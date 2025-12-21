"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save, Trash2, Plus, X, Package, AlertTriangle, Image as ImageIcon } from "lucide-react"
import { updateProduct, deleteProduct, updateProductTags, saveProductMedia } from "../actions"
import { MediaUploader, type MediaItem } from "@/components/admin/MediaUploader"
import { type Database } from "@/lib/supabase/database.types"

type ProductTagType = Database["public"]["Enums"]["product_tag_type"]

const ALL_TAGS: { type: ProductTagType; label: string; description: string }[] = [
  { type: "featured", label: "Featured", description: "Highlights in shop + homepage (highest priority = homepage)" },
  { type: "bestseller", label: "Bestseller", description: "Top selling product" },
  { type: "bundle", label: "Bundle", description: "Product bundle/kit" },
  // Automated tags - managed by system:
  { type: "new", label: "New", description: "Auto-added for new products (expires after 7 days)" },
  { type: "limited", label: "Limited", description: "Auto-managed by inventory (low stock)" },
  { type: "out_of_stock", label: "Out of Stock", description: "Auto-managed by inventory (0 stock)" },
  // Note: "discount" tag is auto-managed by the "On Sale" toggle in Pricing section
]

interface TagState {
  tag: ProductTagType
  priority: number | null
  discount_percent: number | null
}

// Automated tags that are managed by database triggers or system
const AUTOMATED_TAGS: ProductTagType[] = ["out_of_stock", "limited", "new", "discount"]

interface ProductFormProps {
  product: {
    id: string
    slug: string
    name: string
    description: string | null
    price_cents: number
    stripe_price_id: string | null
    specs: unknown
    // Discount fields (Phase 14.3)
    discount_percent: number | null
    discount_expires_at: string | null
    original_price_cents: number | null
    // Inventory fields (Phase 14.4)
    track_inventory: boolean | null
    stock_quantity: number | null
    low_stock_threshold: number | null
  }
  initialTags?: TagState[]
  initialMedia?: MediaItem[]
}

export function ProductForm({ product, initialTags = [], initialMedia = [] }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState(product.name)
  const [slug, setSlug] = useState(product.slug)
  const [description, setDescription] = useState(product.description || "")
  const [stripePriceId, setStripePriceId] = useState(product.stripe_price_id || "")

  // Pricing state (Phase 14.3) - simple: enter price, optionally toggle sale
  const [priceCents, setPriceCents] = useState(
    product.original_price_cents || product.price_cents
  )
  const [isOnSale, setIsOnSale] = useState(
    !!(product.discount_percent && product.original_price_cents)
  )
  const [discountPercent, setDiscountPercent] = useState<number | null>(product.discount_percent)
  const [discountExpiresAt, setDiscountExpiresAt] = useState(product.discount_expires_at || "")

  // Calculate sale price from price and discount
  const salePriceCents = isOnSale && discountPercent
    ? Math.round(priceCents * (1 - discountPercent / 100))
    : priceCents

  // Inventory state (Phase 14.4)
  const [trackInventory, setTrackInventory] = useState(product.track_inventory || false)
  const [stockQuantity, setStockQuantity] = useState<number | null>(product.stock_quantity)
  const [lowStockThreshold, setLowStockThreshold] = useState(product.low_stock_threshold || 10)

  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(() => {
    if (product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)) {
      return Object.entries(product.specs as Record<string, unknown>).map(([key, value]) => ({
        key,
        value: typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : "",
      }))
    }
    return []
  })

  // Tags state
  const [selectedTags, setSelectedTags] = useState<TagState[]>(initialTags)

  // Media state
  const [media, setMedia] = useState<MediaItem[]>(initialMedia)

  const toggleTag = (tagType: ProductTagType) => {
    setSelectedTags((prev) => {
      const exists = prev.find((t) => t.tag === tagType)
      if (exists) {
        return prev.filter((t) => t.tag !== tagType)
      }
      return [...prev, { tag: tagType, priority: 0, discount_percent: null }]
    })
  }

  const updateTagPriority = (tagType: ProductTagType, priority: number) => {
    setSelectedTags((prev) =>
      prev.map((t) => (t.tag === tagType ? { ...t, priority } : t))
    )
  }

  const isTagSelected = (tagType: ProductTagType) =>
    selectedTags.some((t) => t.tag === tagType)

  const getTagPriority = (tagType: ProductTagType) =>
    selectedTags.find((t) => t.tag === tagType)?.priority ?? 0

  // Check if a tag is automated (managed by database triggers)
  const isAutomatedTag = (tagType: ProductTagType) =>
    AUTOMATED_TAGS.includes(tagType)

  const handleAddSpec = () => {
    setSpecs([...specs, { key: "", value: "" }])
  }

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index))
  }

  const handleSpecChange = (index: number, field: "key" | "value", value: string) => {
    setSpecs((prev) =>
      prev.map((spec, i) => {
        if (i !== index) return spec
        return field === "key" ? { ...spec, key: value } : { ...spec, value }
      })
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Convert specs array to object
    const specsObject: Record<string, string> = {}
    for (const spec of specs) {
      if (spec.key.trim()) {
        specsObject[spec.key.trim()] = spec.value.trim()
      }
    }

    startTransition(async () => {
      // Update product
      const result = await updateProduct(product.id, {
        name,
        slug,
        description: description || null,
        // If on sale, price_cents is the calculated sale price, otherwise it's the full price
        price_cents: isOnSale && discountPercent ? salePriceCents : priceCents,
        stripe_price_id: stripePriceId || null,
        specs: Object.keys(specsObject).length > 0 ? specsObject : null,
        // Discount fields (Phase 14.3) - only set if on sale
        discount_percent: isOnSale ? discountPercent : null,
        discount_expires_at: isOnSale && discountExpiresAt ? discountExpiresAt : null,
        original_price_cents: isOnSale && discountPercent ? priceCents : null,
        // Inventory fields (Phase 14.4)
        track_inventory: trackInventory,
        stock_quantity: trackInventory ? stockQuantity : null,
        low_stock_threshold: trackInventory ? lowStockThreshold : null,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      // Update tags
      const tagsResult = await updateProductTags(product.id, selectedTags)
      if (tagsResult.error) {
        setError(tagsResult.error)
        return
      }

      // Update media
      const mediaResult = await saveProductMedia(product.id, media)
      if (mediaResult.error) {
        setError(mediaResult.error)
        return
      }

      router.push("/admin/products")
      router.refresh()
    })
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    const result = await deleteProduct(product.id)

    if (result.error) {
      setError(result.error)
      setIsDeleting(false)
    } else {
      router.push("/admin/products")
      router.refresh()
    }
  }

  return (
    <form onSubmit={(e) => { handleSubmit(e); }} className="space-y-6">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Product name, slug, and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-900">
                Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium text-slate-900">
                Slug
              </label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); }}
                required
                pattern="[a-z0-9\-]+"
                title="Lowercase letters, numbers, and hyphens only"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-slate-900">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); }}
              className="min-h-[100px] w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Price and Stripe configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium text-slate-900">
                Price (cents)
              </label>
              <Input
                id="price"
                type="number"
                min="0"
                value={priceCents}
                onChange={(e) => { setPriceCents(Number.parseInt(e.target.value) || 0); }}
                required
              />
              <p className="text-xs text-slate-500">
                ${(priceCents / 100).toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="stripe" className="text-sm font-medium text-slate-900">
                Stripe Price ID
              </label>
              <Input
                id="stripe"
                value={stripePriceId}
                onChange={(e) => { setStripePriceId(e.target.value); }}
                placeholder="price_..."
              />
            </div>
          </div>

          {/* Sale Toggle */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="onSale"
                checked={isOnSale}
                onChange={(e) => {
                  setIsOnSale(e.target.checked)
                  if (!e.target.checked) {
                    setDiscountPercent(null)
                    setDiscountExpiresAt("")
                  }
                }}
                className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700"
              />
              <label htmlFor="onSale" className="text-sm font-medium text-slate-900">
                On Sale
              </label>
            </div>

            {/* Sale Options (shown when On Sale is checked) */}
            {isOnSale && (
              <div className="mt-4 p-4 bg-amber-50 rounded-md border border-amber-200 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="discountPercent" className="text-sm font-medium text-slate-900">
                      Discount %
                    </label>
                    <Input
                      id="discountPercent"
                      type="number"
                      min="1"
                      max="99"
                      value={discountPercent ?? ""}
                      onChange={(e) => { setDiscountPercent(e.target.value ? Number.parseInt(e.target.value) : null); }}
                      placeholder="e.g., 20"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="discountExpires" className="text-sm font-medium text-slate-900">
                      Expires At (optional)
                    </label>
                    <Input
                      id="discountExpires"
                      type="datetime-local"
                      value={discountExpiresAt ? discountExpiresAt.slice(0, 16) : ""}
                      onChange={(e) => { setDiscountExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : ""); }}
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Sale Preview */}
                {discountPercent && (
                  <div className="p-3 bg-white rounded border border-amber-300">
                    <p className="text-sm">
                      <span className="line-through text-slate-400">${(priceCents / 100).toFixed(2)}</span>
                      <span className="mx-2">→</span>
                      <span className="font-mono font-semibold text-amber-600 text-lg">${(salePriceCents / 100).toFixed(2)}</span>
                      <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-mono rounded">
                        {discountPercent}% OFF
                      </span>
                      <span className="text-green-600 ml-2 text-sm">
                        (saves ${((priceCents - salePriceCents) / 100).toFixed(2)})
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory
          </CardTitle>
          <CardDescription>Track stock levels and automate availability tags</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Track Inventory Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="trackInventory"
              checked={trackInventory}
              onChange={(e) => {
                setTrackInventory(e.target.checked)
                if (!e.target.checked) {
                  setStockQuantity(null)
                }
              }}
              className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700"
            />
            <label htmlFor="trackInventory" className="text-sm font-medium text-slate-900">
              Track Inventory
            </label>
          </div>
          <p className="text-xs text-slate-500">
            When enabled, stock tags (Out of Stock, Limited) are automatically managed based on quantity.
          </p>

          {/* Inventory Fields (shown when tracking is enabled) */}
          {trackInventory && (
            <div className="mt-4 p-4 bg-slate-50 rounded-md border border-slate-200 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="stockQuantity" className="text-sm font-medium text-slate-900">
                    Stock Quantity
                  </label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={stockQuantity ?? ""}
                    onChange={(e) => { setStockQuantity(e.target.value ? Number.parseInt(e.target.value) : null); }}
                    placeholder="e.g., 50"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lowStockThreshold" className="text-sm font-medium text-slate-900">
                    Low Stock Threshold
                  </label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="1"
                    value={lowStockThreshold}
                    onChange={(e) => { setLowStockThreshold(Number.parseInt(e.target.value) || 10); }}
                  />
                  <p className="text-xs text-slate-500">
                    Product shows &quot;Limited&quot; when stock falls to or below this number
                  </p>
                </div>
              </div>

              {/* Stock Status Preview */}
              {stockQuantity !== null && (
                <div className={`p-3 rounded border ${
                  stockQuantity <= 0
                    ? "bg-red-50 border-red-200"
                    : stockQuantity <= lowStockThreshold
                    ? "bg-amber-50 border-amber-200"
                    : "bg-green-50 border-green-200"
                }`}>
                  <div className="flex items-center gap-2">
                    {stockQuantity <= 0 ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Out of Stock</span>
                        <span className="text-xs text-red-500">(auto-tagged)</span>
                      </>
                    ) : stockQuantity <= lowStockThreshold ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-600">
                          Low Stock ({stockQuantity} remaining)
                        </span>
                        <span className="text-xs text-amber-500">(auto-tagged as &quot;Limited&quot;)</span>
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          In Stock ({stockQuantity} available)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Product Tags</CardTitle>
          <CardDescription>Select tags to display on the product card (max 3 shown)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {ALL_TAGS.map((tagInfo) => {
              const isAuto = isAutomatedTag(tagInfo.type)
              const isDisabled = isAuto && trackInventory
              return (
                <div
                  key={tagInfo.type}
                  className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
                    isTagSelected(tagInfo.type)
                      ? isDisabled
                        ? "border-slate-300 bg-slate-100"
                        : "border-cyan-700 bg-cyan-50"
                      : "border-slate-200 hover:border-slate-300"
                  } ${isDisabled ? "opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    id={`tag-${tagInfo.type}`}
                    checked={isTagSelected(tagInfo.type)}
                    onChange={() => !isDisabled && toggleTag(tagInfo.type)}
                    disabled={isDisabled}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`tag-${tagInfo.type}`}
                      className={`block text-sm font-medium cursor-pointer ${
                        isDisabled ? "text-slate-500" : "text-slate-900"
                      }`}
                    >
                      {tagInfo.label}
                      {isAuto && (
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          (auto)
                        </span>
                      )}
                    </label>
                    <p className="text-xs text-slate-500">{tagInfo.description}</p>
                    {isDisabled && (
                      <p className="text-xs text-amber-600 mt-1">
                        Managed automatically by inventory tracking
                      </p>
                    )}

                    {/* Show priority input when selected and not automated */}
                    {isTagSelected(tagInfo.type) && !isDisabled && (
                      <div className="mt-2 flex items-center gap-2">
                        <label className="text-xs text-slate-600">Priority:</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={getTagPriority(tagInfo.type)}
                          onChange={(e) =>
                            { updateTagPriority(tagInfo.type, Number.parseInt(e.target.value) || 0); }
                          }
                          className="w-20 h-7 text-xs"
                        />
                        {tagInfo.type === "featured" && (
                          <span className="text-xs text-slate-500">(highest = homepage)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-500">
            Higher priority Featured tag = shown on homepage. Tags marked &quot;(auto)&quot; are managed automatically. Discount tag is controlled by the &quot;On Sale&quot; toggle in Pricing.
          </p>
        </CardContent>
      </Card>

      {/* Specs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>Technical specifications (key-value pairs)</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddSpec}>
              <Plus className="mr-2 h-4 w-4" />
              Add Spec
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {specs.length === 0 ? (
            <p className="text-sm text-slate-500">No specifications added yet.</p>
          ) : (
            <div className="space-y-3">
              {specs.map((spec, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Key"
                    value={spec.key}
                    onChange={(e) => { handleSpecChange(index, "key", e.target.value); }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={spec.value}
                    onChange={(e) => { handleSpecChange(index, "value", e.target.value); }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => { handleRemoveSpec(index); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-slate-600" />
            <div>
              <CardTitle>Media</CardTitle>
              <CardDescription>Product images, videos, 3D models, and documents</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MediaUploader
            productId={product.id}
            media={media}
            onChange={setMedia}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <Separator />
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="destructive"
          onClick={() => void handleDelete()}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete Product
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { router.push("/admin/products"); }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-cyan-700 hover:bg-cyan-600"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}
