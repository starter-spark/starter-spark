import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Star } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatPrice } from '@/lib/validation'

export const metadata = {
  title: 'Products | Admin',
}

async function getProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_tags (tag, priority)
    `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-900">
            Products
          </h1>
          <p className="text-slate-600">Manage your product catalog</p>
        </div>
        <Button asChild className="bg-cyan-700 hover:bg-cyan-600">
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">No products yet.</p>
          <Button asChild className="mt-4 bg-cyan-700 hover:bg-cyan-600">
            <Link href="/admin/products/new">Create your first product</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const tags = ((product.product_tags as unknown) || []) as {
                  tag: string
                  priority: number | null
                }[]
                const hasFeaturedTag = tags.some((t) => t.tag === 'featured')
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {product.name}
                        </span>
                        {hasFeaturedTag && (
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">
                        {product.slug}
                      </code>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatPrice(product.price_cents)}
                    </TableCell>
                    <TableCell>
                      {hasFeaturedTag ? (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                          Featured
                        </Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="sm">
                            <Link
                              href={`/admin/products/${product.slug}`}
                              aria-label={`Edit ${product.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit product</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
