'use client'

import { ProductCard, type ProductTag } from '@/components/commerce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'
import { useState, useMemo } from 'react'

interface Product {
  slug: string
  name: string
  price: number
  inStock: boolean
  badge?: string
  tags?: ProductTag[]
  category: string
  status: 'active' | 'coming_soon' | 'draft'
  image?: string
  // Discount fields
  originalPrice?: number | null
  discountPercent?: number | null
  discountExpiresAt?: string | null
}

interface ShopFiltersProps {
  products: Product[]
}

type FilterOption = 'all' | 'kit' | 'bundle' | 'parts'

export function ShopFilters({ products }: ShopFiltersProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterOption>('all')

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'kit', label: 'Kits' },
    { value: 'bundle', label: 'Bundles' },
    { value: 'parts', label: 'Parts' },
  ]

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesFilter = filter === 'all' || product.category === filter
      return matchesSearch && matchesFilter
    })
  }, [products, search, filter])

  return (
    <>
      {/* Search & Filter */}
      <section className="pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                aria-hidden="true"
              />
              <Input
                id="product-search"
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                }}
                className="pl-10 bg-white border-slate-200 focus:border-cyan-700"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" aria-hidden="true" />
              {filterOptions.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={filter === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter(value)
                  }}
                  className={
                    filter === value
                      ? 'bg-cyan-700 hover:bg-cyan-600 text-white font-mono'
                      : 'border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700 font-mono'
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.slug}
                  slug={product.slug}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                  inStock={product.inStock}
                  badge={product.badge}
                  tags={product.tags}
                  status={product.status}
                  originalPrice={product.originalPrice}
                  discountPercent={product.discountPercent}
                  discountExpiresAt={product.discountExpiresAt}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-500 font-mono">
                No products match your search.
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch('')
                  setFilter('all')
                }}
                className="mt-4 text-cyan-700 hover:text-cyan-600"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
