"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save, Plus, X } from "lucide-react"
import { createProduct } from "../actions"

export function NewProductForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [priceCents, setPriceCents] = useState(0)
  const [stripePriceId, setStripePriceId] = useState("")
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([])

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/^-|-$/g, "")
  }

  const handleNameChange = (value: string) => {
    setName(value)
    // Only auto-generate if slug hasn't been manually edited
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value))
    }
  }

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
      const result = await createProduct({
        name,
        slug,
        description: description || null,
        price_cents: priceCents,
        stripe_price_id: stripePriceId || null,
        specs: Object.keys(specsObject).length > 0 ? specsObject : null,
        // Discount fields (Phase 14.3) - null for new products
        discount_percent: null,
        discount_expires_at: null,
        original_price_cents: null,
        // Inventory fields (Phase 14.4) - disabled by default for new products
        track_inventory: false,
        stock_quantity: null,
        low_stock_threshold: null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push("/admin/products")
        router.refresh()
      }
    })
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
                onChange={(e) => { handleNameChange(e.target.value); }}
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
        <CardContent className="space-y-4">
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
                Display price: ${(priceCents / 100).toFixed(2)}
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

      {/* Actions */}
      <Separator />
      <div className="flex justify-end gap-2">
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
          Create Product
        </Button>
      </div>
    </form>
  )
}
