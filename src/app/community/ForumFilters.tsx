"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useCallback, useTransition, useOptimistic } from "react"

interface Product {
  id: string
  name: string
  slug: string
}

interface ForumFiltersProps {
  products: Product[]
  availableTags: string[]
  currentStatus?: string
  currentTag?: string
  currentProduct?: string
  currentSearch?: string
}

export function ForumFilters({
  products,
  availableTags,
  currentStatus,
  currentTag,
  currentProduct,
  currentSearch,
}: ForumFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch || "")
  const [isPending, startTransition] = useTransition()

  // Optimistic state for immediate UI feedback
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(
    { status: currentStatus, tag: currentTag, product: currentProduct },
    (state, update: { key: string; value: string | null }) => {
      if (update.key === "status") return { ...state, status: update.value || undefined }
      if (update.key === "tag") return { ...state, tag: update.value || undefined }
      if (update.key === "product") return { ...state, product: update.value || undefined }
      return state
    }
  )

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams?.toString() || "")
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      // Optimistic update for instant feedback
      setOptimisticFilters({ key, value })

      // Navigate with transition to avoid blocking UI
      startTransition(() => {
        router.push(`/community?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams, setOptimisticFilters]
  )

  const clearFilters = () => {
    setSearch("")
    startTransition(() => {
      router.push("/community", { scroll: false })
    })
  }

  // Use optimistic values for instant UI feedback
  const activeStatus = optimisticFilters.status
  const activeTag = optimisticFilters.tag
  const activeProduct = optimisticFilters.product

  const hasActiveFilters = activeStatus || activeTag || activeProduct || currentSearch

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-cyan-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-mono">Loading...</span>
        </div>
      )}

      {/* Search */}
      <div>
        <label className="block text-sm font-mono text-slate-600 mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilter("q", search.trim() || null)
              }
            }}
            className="pl-10 pr-8 bg-white border-slate-200 focus:border-cyan-700"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("")
                updateFilter("q", null)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">Press Enter to search</p>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-mono text-slate-600 mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {["all", "open", "solved"].map((status) => {
            const isActive = (activeStatus || "all") === status
            return (
              <Button
                key={status}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter("status", status)}
                disabled={isPending}
                className={
                  isActive
                    ? "bg-cyan-700 hover:bg-cyan-600 text-white font-mono cursor-pointer"
                    : "border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700 font-mono cursor-pointer"
                }
              >
                {status === "all"
                  ? "All"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-sm font-mono text-slate-600 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.slice(0, 10).map((tag) => {
              const isActive = activeTag === tag
              return (
                <Button
                  key={tag}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateFilter("tag", activeTag === tag ? null : tag)
                  }
                  disabled={isPending}
                  className={
                    isActive
                      ? "bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-xs cursor-pointer"
                      : "border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700 font-mono text-xs cursor-pointer"
                  }
                >
                  #{tag}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Product Filter */}
      {products.length > 0 && (
        <div>
          <label htmlFor="product-filter" className="block text-sm font-mono text-slate-600 mb-2">
            Product
          </label>
          <select
            id="product-filter"
            name="product-filter"
            aria-label="Product"
            value={activeProduct || ""}
            onChange={(e) => updateFilter("product", e.target.value || null)}
            disabled={isPending}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-700 focus:border-cyan-700 focus:outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="">All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.slug}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={isPending}
          className="w-full text-slate-500 hover:text-cyan-700 cursor-pointer"
        >
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}
