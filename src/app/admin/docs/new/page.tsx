'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { createDocPage } from '../actions'

interface Category {
  id: string
  name: string
  slug: string
}

export default function NewDocPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCategory = searchParams.get('category')

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState({
    category_id: preselectedCategory || '',
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    sort_order: '0',
    is_published: false,
  })

  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient()
      const { data } = await supabase
        .from('doc_categories')
        .select('id, name, slug')
        .order('sort_order', { ascending: true })
      setCategories(data || [])
      if (data && data.length > 0 && !formData.category_id) {
        setFormData((prev) => ({ ...prev, category_id: data[0].id }))
      }
      setIsLoading(false)
    }
    void loadCategories()
  }, [formData.category_id])

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    const data = new FormData()
    data.append('category_id', formData.category_id)
    data.append('title', formData.title)
    data.append('slug', formData.slug)
    data.append('content', formData.content)
    data.append('excerpt', formData.excerpt)
    data.append('sort_order', formData.sort_order)
    data.append('is_published', String(formData.is_published))

    try {
      const result = await createDocPage(data)
      if (result.error) {
        alert(result.error)
      } else {
        router.push(`/admin/docs/${result.id}`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-4xl mx-auto">
        <div className="text-center text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin/docs"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documentation
          </Link>
          <h1 className="font-mono text-2xl font-bold text-slate-900">
            New Documentation Page
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {showPreview ? 'Edit' : 'Preview'}
        </Button>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="bg-white rounded border border-slate-200 p-6 space-y-6">
          {/* Category and Title */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <select
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                className="w-full h-10 rounded border border-slate-200 px-3"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value,
                    slug: generateSlug(e.target.value),
                  })
                }
                placeholder="Getting Started with Arduino"
                required
              />
            </div>
          </div>

          {/* Slug and Sort Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="getting-started-with-arduino"
                required
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: e.target.value })
                }
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <Label>Excerpt (optional)</Label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
              placeholder="Brief summary for search results..."
              rows={2}
            />
          </div>

          {/* Content */}
          <div>
            <Label>Content (Markdown)</Label>
            {showPreview ? (
              <div className="min-h-[400px] p-4 border border-slate-200 rounded bg-slate-50 prose prose-slate max-w-none">
                {/* Preview (no markdown renderer) */}
                <pre className="whitespace-pre-wrap text-sm">
                  {formData.content || 'No content yet...'}
                </pre>
              </div>
            ) : (
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="# Introduction&#10;&#10;Write your documentation here using Markdown..."
                rows={20}
                className="font-mono text-sm"
              />
            )}
          </div>

          {/* Published Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_published: checked })
                }
              />
              <div>
                <Label className="mb-0">Publish</Label>
                <p className="text-xs text-slate-500">
                  {formData.is_published
                    ? 'This page will be visible to the public'
                    : 'Save as draft (not visible to public)'}
                </p>
              </div>
            </div>
            <Button type="submit" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Creating...' : 'Create Page'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
