'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  FileDown,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { formatFileSize } from '@/lib/file-size'
import { DocContent } from '@/components/docs/DocArticle'
import {
  updateDocPage,
  deleteDocPage,
  createDocAttachmentUpload,
  finalizeDocAttachment,
  deleteDocAttachment,
} from '../actions'

const ATTACHMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.zip,.txt,.csv'

interface Category {
  id: string
  name: string
  slug: string
}

interface Attachment {
  id: string
  filename: string
  storage_path: string
  file_size: number | null
  mime_type: string | null
}

async function loadAttachments(
  pageId: string,
  setAttachments: (attachments: Attachment[]) => void,
) {
  const supabase = createClient()
  const { data } = await supabase
    .from('doc_attachments')
    .select('id, filename, storage_path, file_size, mime_type')
    .eq('page_id', pageId)
    .order('created_at', { ascending: true })
  setAttachments((data as Attachment[] | null) ?? [])
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [attachmentToDelete, setAttachmentToDelete] =
    useState<Attachment | null>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

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
      await loadAttachments(pageId, setAttachments)
      setIsLoading(false)
    }
    void loadData()
  }, [pageId])

  async function refreshAttachments() {
    await loadAttachments(pageId, setAttachments)
  }

  async function handleAttachmentSelect(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setIsUploadingAttachment(true)
    try {
      const minted = await createDocAttachmentUpload(
        pageId,
        file.name,
        file.size,
        file.type,
      )
      if (minted.error || !minted.path || !minted.token) {
        toast.error('Failed to upload attachment', {
          description: minted.error,
        })
        return
      }

      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from('doc-attachments')
        .uploadToSignedUrl(minted.path, minted.token, file, {
          contentType: minted.contentType,
        })
      if (uploadError) {
        toast.error('Failed to upload attachment', {
          description: uploadError.message,
        })
        return
      }

      const result = await finalizeDocAttachment(pageId, minted.path)
      if (result.error) {
        toast.error('Failed to upload attachment', {
          description: result.error,
        })
        return
      }

      toast.success('Attachment uploaded')
      await refreshAttachments()
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  async function handleAttachmentDeleteConfirm() {
    if (!attachmentToDelete) return
    const attachment = attachmentToDelete
    setAttachmentToDelete(null)

    const result = await deleteDocAttachment(attachment.id)
    if (result.error) {
      toast.error('Failed to delete attachment', { description: result.error })
    } else {
      toast.success('Attachment deleted')
      await refreshAttachments()
    }
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
      const result = await updateDocPage(pageId, data)
      if (result.error) {
        toast.error('Failed to save page', { description: result.error })
      } else {
        toast.success('Page saved')
        router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteConfirm() {
    setShowDeleteDialog(false)
    const result = await deleteDocPage(pageId)
    if (result.error) {
      toast.error('Failed to delete page', { description: result.error })
    } else {
      toast.success('Page deleted')
      router.push('/admin/docs')
    }
  }

  if (isLoading) {
    return <div className="py-12 text-center text-slate-500">Loading...</div>
  }

  if (!page) {
    return (
      <div className="py-12 text-center text-slate-500">Page not found</div>
    )
  }

  const currentCategory = categories.find((c) => c.id === formData.category_id)
  const previewUrl = currentCategory
    ? `/docs/${currentCategory.slug}/${formData.slug}`
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {previewUrl && formData.is_published && (
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={previewUrl} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2 w-full sm:w-auto"
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
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="min-h-[400px] p-4 border border-slate-200 rounded bg-slate-50">
                <DocContent content={formData.content || null} />
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
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-200 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Attachments */}
      <div className="bg-white rounded border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-mono text-lg font-bold text-slate-900">
              Attachments
            </h2>
            <p className="text-xs text-slate-500">
              Downloadable files shown at the bottom of the published page (max
              10MB)
            </p>
          </div>
          <input
            ref={attachmentInputRef}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            onChange={(e) => void handleAttachmentSelect(e)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isUploadingAttachment}
            onClick={() => attachmentInputRef.current?.click()}
            className="w-full sm:w-auto"
          >
            {isUploadingAttachment ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploadingAttachment ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>

        {attachments.length === 0 ? (
          <p className="text-sm text-slate-500">No attachments yet.</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded border border-slate-200"
              >
                <FileDown className="w-5 h-5 text-cyan-700 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-slate-900 truncate">
                    {attachment.filename}
                  </p>
                  {attachment.file_size && (
                    <p className="text-xs text-slate-500">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachmentToDelete(attachment)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={attachmentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setAttachmentToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{attachmentToDelete?.filename}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be permanently deleted
              from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleAttachmentDeleteConfirm()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{formData.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The page will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteConfirm()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
