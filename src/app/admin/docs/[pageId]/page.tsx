'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { updateDocPage, deleteDocPage } from '../actions'

interface Category {
  id: string
  name: string
  slug: string
}

interface DocPage {
  id: string
  category_id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  sort_order: number | null
  is_published: boolean | null
  category: {
    slug: string
  }
}

export default function EditDocPage({
  params,
}: {
  params: Promise<{ pageId: string }>
}) {
  const { pageId } = use(params)
  const router = useRouter()

  const [categories, setCategories] = useState<Category[]>([])
  const [page, setPage] = useState<DocPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    sort_order: '0',
    is_published: false,
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      // Load categories
      const { data: cats } = await supabase
        .from('doc_categories')
        .select('id, name, slug')
        .order('sort_order', { ascending: true })
      setCategories(cats || [])

      // Load page
      const { data: pageData } = await supabase
        .from('doc_pages')
        .select(
          `
          id,
          category_id,
          title,
          slug,
          content,
          excerpt,
          sort_order,
          is_published,
          category:doc_categories!inner (
            slug
          )
        `,
        )
        .eq('id', pageId)
        .single()

      if (pageData) {
        const typedPage = pageData as unknown as DocPage
        setPage(typedPage)
        setFormData({
          category_id: typedPage.category_id,
          title: typedPage.title,
          slug: typedPage.slug,
          content: typedPage.content || '',
          excerpt: typedPage.excerpt || '',
          sort_order: String(typedPage.sort_order || 0),
          is_published: typedPage.is_published ?? false,
        })
      }
      setIsLoading(false)
    }
    void loadData()
  }, [pageId])

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
      const result = await updateDocPage(pageId, data)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${formData.title}"? This action cannot be undone.`)) {
      return
    }

    const result = await deleteDocPage(pageId)
    if (result.error) {
      alert(result.error)
    } else {
      router.push('/admin/docs')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-4xl mx-auto">
        <div className="text-center text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="p-6 lg:p-10 max-w-4xl mx-auto">
        <div className="text-center text-slate-500">Page not found</div>
      </div>
    )
  }

  const currentCategory = categories.find((c) => c.id === formData.category_id)
  const previewUrl = currentCategory
    ? `/docs/${currentCategory.slug}/${formData.slug}`
    : null

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
            Edit Page
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {previewUrl && formData.is_published && (
            <Button variant="outline" asChild>
              <Link href={previewUrl} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </Link>
            </Button>
          )}
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
                  setFormData({ ...formData, title: e.target.value })
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

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_published: checked })
                }
              />
              <div>
                <Label className="mb-0">Published</Label>
                <p className="text-xs text-slate-500">
                  {formData.is_published
                    ? 'Visible to the public'
                    : 'Draft (not visible)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDelete()}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
