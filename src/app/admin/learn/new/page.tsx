import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import { createCourse } from '../actions'

export const metadata = {
  title: 'New Course | Admin',
}

async function getProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug')
    .order('name')

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data
}

export default async function NewCoursePage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/learn" aria-label="Back to courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-900">
            New Course
          </h1>
          <p className="text-slate-600">Create a new learning course</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <form action={createCourse} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Introduction to Arduino"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_id">Associated Product *</Label>
              <select
                id="product_id"
                name="product_id"
                required
                defaultValue=""
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              >
                <option value="" disabled>
                  Select a product
                </option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Users must own this product to access the course
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="A comprehensive introduction to Arduino programming and electronics..."
              rows={3}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <select
                id="difficulty"
                name="difficulty"
                defaultValue="beginner"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">
                Estimated Duration (minutes)
              </Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min={0}
                defaultValue={60}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button asChild type="button" variant="outline">
              <Link href="/admin/learn">Cancel</Link>
            </Button>
            <Button type="submit" className="bg-cyan-700 hover:bg-cyan-600">
              Create Course
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
