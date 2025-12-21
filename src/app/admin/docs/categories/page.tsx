"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { createCategory, updateCategory, deleteCategory } from "../actions"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  parent_id: string | null
  sort_order: number | null
  is_published: boolean | null
}

const ICONS = ["Rocket", "Cpu", "Zap", "Wrench", "Book", "BookOpen"]

export default function AdminDocCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "BookOpen",
    sort_order: "0",
    is_published: true,
  })

  useEffect(() => {
    void loadCategories()
  }, [])

  async function loadCategories() {
    const supabase = createClient()
    const { data } = await supabase
      .from("doc_categories")
      .select("*")
      .order("sort_order", { ascending: true })
    setCategories(data || [])
    setIsLoading(false)
  }

  function startCreate() {
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "BookOpen",
      sort_order: String(categories.length),
      is_published: true,
    })
    setIsCreating(true)
    setEditingId(null)
  }

  function startEdit(category: Category) {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "BookOpen",
      sort_order: String(category.sort_order || 0),
      is_published: category.is_published ?? true,
    })
    setEditingId(category.id)
    setIsCreating(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setIsCreating(false)
  }

  async function handleSave() {
    setIsSaving(true)
    const data = new FormData()
    data.append("name", formData.name)
    data.append("slug", formData.slug)
    data.append("description", formData.description)
    data.append("icon", formData.icon)
    data.append("sort_order", formData.sort_order)
    data.append("is_published", String(formData.is_published))

    try {
      if (isCreating) {
        const result = await createCategory(data)
        if (result.error) {
          alert(result.error)
        } else {
          await loadCategories()
          cancelEdit()
        }
      } else if (editingId) {
        const result = await updateCategory(editingId, data)
        if (result.error) {
          alert(result.error)
        } else {
          await loadCategories()
          cancelEdit()
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? All pages in this category will also be deleted.`)) {
      return
    }

    const result = await deleteCategory(id)
    if (result.error) {
      alert(result.error)
    } else {
      await loadCategories()
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
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
            Documentation Categories
          </h1>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={startCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="bg-white rounded border border-slate-200 p-6 mb-6">
          <h2 className="font-mono text-lg text-slate-900 mb-4">
            {isCreating ? "Create Category" : "Edit Category"}
          </h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: isCreating ? generateSlug(e.target.value) : formData.slug,
                    })
                  }}
                  placeholder="Getting Started"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="getting-started"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this category..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Icon</Label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full h-10 rounded border border-slate-200 px-3"
                >
                  {ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_published: checked })
                  }
                />
                <Label>Published</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={() => void handleSave()} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded border border-slate-200">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="font-mono text-lg text-slate-900 mb-2">No Categories</h2>
          <p className="text-sm text-slate-500 mb-4">
            Create your first category to organize documentation.
          </p>
          <Button onClick={startCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Category
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded border border-slate-200 divide-y divide-slate-100">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-4 flex items-center justify-between hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-mono text-slate-900">{category.name}</p>
                  <p className="text-xs text-slate-500">/docs/{category.slug}</p>
                </div>
                {!category.is_published && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    Draft
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 mr-2">#{category.sort_order}</span>
                <Button variant="ghost" size="sm" onClick={() => startEdit(category)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => void handleDelete(category.id, category.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
