'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Save,
  Eye,
  CheckCircle,
  Loader2,
  AlertCircle,
  LayoutList,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { createCustomPage, checkSlugAvailability } from '../actions'
import { MarkdownPreview } from '@/components/markdown/MarkdownPreview'
import {
  AdminTextArea,
  adminHelperTextClass,
  adminLabelClass,
} from '@/components/admin/form-controls'
import { PageBlockEditor } from '../[pageKey]/PageBlockEditor'
import { PageBlockRenderer } from '@/components/content/PageBlockRenderer'
import { PagePreview } from '@/components/content/PagePreview'
import type { PageBlock } from '@/types/page-blocks'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, 50)
}

export function NewCustomPageForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [slugChecking, setSlugChecking] = useState(false)
  const [content, setContent] = useState('')
  const [contentBlocks, setContentBlocks] = useState<PageBlock[]>([])
  const [editorMode, setEditorMode] = useState<'markdown' | 'blocks'>('markdown')
  const [tocEnabled, setTocEnabled] = useState(false)
  const [showLastUpdated, setShowLastUpdated] = useState(true)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [activeTab, setActiveTab] = useState<string>('edit')

  // Auto-generate slug from title (unless manually edited)
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlug(generateSlug(title))
    }
  }, [title, slugManuallyEdited])

  // Check slug availability when it changes (debounced)
  useEffect(() => {
    if (!slug) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlugError(null)
      return
    }

    const timeout = setTimeout(() => {
      void (async () => {
        setSlugChecking(true)
        const result = await checkSlugAvailability(slug)
        setSlugChecking(false)
        if (result.available) {
          setSlugError(null)
        } else {
          setSlugError(result.error || 'Slug not available')
        }
      })()
    }, 300)

    return () => {
      clearTimeout(timeout)
    }
  }, [slug])

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    // Sanitize the slug as they type
    const sanitized = value
      .toLowerCase()
      .replaceAll(/[^a-z0-9-]/g, '')
      .slice(0, 50)
    setSlug(sanitized)
  }

  const handleSubmit = (publish = false) => {
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!slug.trim()) {
      setError('Slug is required')
      return
    }

    if (slugError) {
      setError(slugError)
      return
    }

    // Validate content based on mode
    if (editorMode === 'markdown' && !content.trim()) {
      setError('Content is required')
      return
    }

    if (editorMode === 'blocks' && contentBlocks.length === 0) {
      setError('At least one content block is required')
      return
    }

    startTransition(async () => {
      const result = await createCustomPage({
        title: title.trim(),
        slug: slug.trim(),
        content: editorMode === 'markdown' ? content.trim() : '',
        contentBlocks: editorMode === 'blocks' ? contentBlocks : [],
        tocEnabled,
        showLastUpdated,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        publish,
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin/content')
      }
    })
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/content">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-mono text-slate-900">
              Create Custom Page
            </h1>
            <p className="text-sm text-slate-500">
              Create a new markdown page at /p/{slug || 'your-slug'}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-600 border-slate-200"
        >
          New Page
        </Badge>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Page Details */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle>Page Details</CardTitle>
          <CardDescription>
            Set the title and URL for your custom page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label
              htmlFor="title"
              className={adminLabelClass}
            >
              Page Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
              }}
              placeholder="e.g., Frequently Asked Questions"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <label
              htmlFor="slug"
              className={adminLabelClass}
            >
              URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">/p/</span>
              <div className="relative flex-1">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    handleSlugChange(e.target.value)
                  }}
                  placeholder="faq"
                  className={
                    slugError ? 'border-red-300 focus:ring-red-500' : ''
                  }
                />
                {slugChecking && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                )}
                {!slugChecking && slug && !slugError && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            {slugError && <p className="text-sm text-red-600">{slugError}</p>}
            <p className="text-xs text-slate-500">
              Only lowercase letters, numbers, and hyphens. Auto-generated from
              title.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Page Settings */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle>Page Settings</CardTitle>
          <CardDescription>
            Configure display options for this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className={adminLabelClass}>Table of Contents</label>
              <p className="text-xs text-slate-500">
                Show a navigation sidebar with headings
              </p>
            </div>
            <Switch
              checked={tocEnabled}
              onCheckedChange={setTocEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className={adminLabelClass}>Show Last Updated</label>
              <p className="text-xs text-slate-500">
                Display when the page was last updated
              </p>
            </div>
            <Switch
              checked={showLastUpdated}
              onCheckedChange={setShowLastUpdated}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Page Content</CardTitle>
              <CardDescription>
                Build your page with rich content blocks or use Markdown.
              </CardDescription>
            </div>
            {/* Editor Mode Toggle */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setEditorMode('markdown')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  editorMode === 'markdown'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Markdown
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('blocks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  editorMode === 'blocks'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Blocks
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editorMode === 'blocks' ? (
            /* Blocks Editor */
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="edit">Edit Blocks</TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="page-preview">
                  <LayoutList className="h-4 w-4 mr-2" />
                  Page Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-4">
                <PageBlockEditor
                  blocks={contentBlocks}
                  onChange={setContentBlocks}
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                <div className="w-full min-h-[400px] p-6 border border-slate-200 rounded-md bg-slate-50">
                  {contentBlocks.length > 0 ? (
                    <PageBlockRenderer blocks={contentBlocks} />
                  ) : (
                    <p className="text-slate-500 text-center py-8">
                      No blocks to preview. Add some blocks in the Edit tab.
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="page-preview" className="mt-4">
                <PagePreview
                  title={title}
                  blocks={contentBlocks}
                  markdownContent={content}
                  tocEnabled={tocEnabled}
                  showLastUpdated={showLastUpdated}
                  editorMode={editorMode}
                />
              </TabsContent>
            </Tabs>
          ) : (
            /* Markdown Editor */
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="page-preview">
                  <LayoutList className="h-4 w-4 mr-2" />
                  Page Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <AdminTextArea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                  }}
                  className="h-[400px] font-mono p-4"
                  placeholder="# Your Page Title

Write your content here using Markdown...

## Section Title

- List item 1
- List item 2

**Bold text** and *italic text* are supported."
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="w-full min-h-[400px] p-6 border border-slate-200 rounded-md bg-slate-50 prose prose-slate max-w-none">
                  <MarkdownPreview
                    content={content}
                    emptyMessage="Preview will appear here..."
                    emptyClassName="text-slate-400 italic"
                  />
                </div>
              </TabsContent>
              <TabsContent value="page-preview" className="mt-2">
                <PagePreview
                  title={title}
                  blocks={contentBlocks}
                  markdownContent={content}
                  tocEnabled={tocEnabled}
                  showLastUpdated={showLastUpdated}
                  editorMode={editorMode}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>
            Optional. Customize how this page appears in search results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="seo-title"
              className={adminLabelClass}
            >
              SEO Title
            </label>
            <Input
              id="seo-title"
              value={seoTitle}
              onChange={(e) => {
                setSeoTitle(e.target.value)
              }}
              placeholder={title || 'Defaults to page title'}
            />
            <p className={adminHelperTextClass}>
              Leave blank to use the page title.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="seo-description"
              className={adminLabelClass}
            >
              Meta Description
            </label>
            <AdminTextArea
              id="seo-description"
              value={seoDescription}
              onChange={(e) => {
                setSeoDescription(e.target.value)
              }}
              rows={3}
              className="p-3"
              placeholder="Brief description for search engines (150-160 characters recommended)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            handleSubmit(false)
          }}
          disabled={isPending || !!slugError}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => {
            handleSubmit(true)
          }}
          disabled={isPending || !!slugError}
          className="bg-cyan-700 hover:bg-cyan-600"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Create & Publish
        </Button>
      </div>
    </>
  )
}
