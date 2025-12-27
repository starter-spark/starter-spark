'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProductFilterClientProps {
  products: { id: string; name: string }[]
  currentProduct?: string
  currentFilter?: string
}

export function ProductFilterClient({
  products,
  currentProduct,
  currentFilter,
}: ProductFilterClientProps) {
  const router = useRouter()

  const handleProductChange = (value: string) => {
    const params = new URLSearchParams()
    if (currentFilter) {
      params.set('filter', currentFilter)
    }
    if (value && value !== 'all') {
      params.set('product', value)
    }
    const queryString = params.toString()
    router.push(`/admin/licenses${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <Select value={currentProduct || 'all'} onValueChange={handleProductChange}>
      <SelectTrigger className="w-[180px] bg-white">
        <SelectValue placeholder="Filter by product" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Products</SelectItem>
        {products.map((product) => (
          <SelectItem key={product.id} value={product.id}>
            {product.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
