import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText, FolderOpen, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteDocPageButton } from './DeleteDocPageButton'
import { TogglePublishButton } from './TogglePublishButton'

export const metadata = {
  title: 'Documentation - Admin',
}

export default async function AdminDocsPage() {
  const supabase = await createClient()

  // Fetch all categories with their pages
  const { data: categories } = await supabase
    .from('doc_categories')
    .select(
      `
      id,
      name,
      slug,
      is_published,
      sort_order,
      pages:doc_pages (
        id,
        title,
        slug,
        excerpt,
        is_published,
        sort_order,
        updated_at
      )
    `,
    )
    .order('sort_order', { ascending: true })

  // Count stats
  const totalPages =
    categories?.reduce((acc, cat) => acc + (cat.pages?.length || 0), 0) || 0
  const publishedPages =
    categories?.reduce(
      (acc, cat) =>
        acc +
        (cat.pages?.filter(
          (p: { is_published: boolean | null }) => p.is_published,
        )?.length || 0),
      0,
    ) || 0

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-900">
            Documentation
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage documentation pages and categories
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/docs/categories">
              <FolderOpen className="w-4 h-4 mr-2" />
              Categories
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/docs/new">
              <Plus className="w-4 h-4 mr-2" />
              New Page
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-white rounded border border-slate-200">
          <p className="text-sm text-slate-500">Categories</p>
          <p className="font-mono text-2xl text-slate-900">
            {categories?.length || 0}
          </p>
        </div>
        <div className="p-4 bg-white rounded border border-slate-200">
          <p className="text-sm text-slate-500">Total Pages</p>
          <p className="font-mono text-2xl text-slate-900">{totalPages}</p>
        </div>
        <div className="p-4 bg-white rounded border border-slate-200">
          <p className="text-sm text-slate-500">Published</p>
          <p className="font-mono text-2xl text-slate-900">{publishedPages}</p>
        </div>
      </div>

      {/* Pages by Category */}
      <div className="space-y-6">
        {categories?.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded border border-slate-200 overflow-hidden"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-slate-500" />
                <span className="font-mono text-slate-900">
                  {category.name}
                </span>
                {!category.is_published && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    Draft
                  </span>
                )}
              </div>
              <span className="text-sm text-slate-500">
                {category.pages?.length || 0} pages
              </span>
            </div>
            {category.pages && category.pages.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {(
                  category.pages as Array<{
                    id: string
                    title: string
                    slug: string
                    excerpt: string | null
                    is_published: boolean | null
                    sort_order: number | null
                    updated_at: string | null
                  }>
                )
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                  .map((page) => (
                    <div
                      key={page.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-mono text-sm text-slate-900">
                            {page.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            /docs/{category.slug}/{page.slug}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TogglePublishButton
                          pageId={page.id}
                          isPublished={page.is_published ?? false}
                        />
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/docs/${page.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                        <DeleteDocPageButton
                          pageId={page.id}
                          pageTitle={page.title}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No pages in this category</p>
                <Button variant="link" size="sm" asChild className="mt-2">
                  <Link href={`/admin/docs/new?category=${category.id}`}>
                    Add first page
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ))}

        {(!categories || categories.length === 0) && (
          <div className="p-12 text-center bg-white rounded border border-slate-200">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h2 className="font-mono text-lg text-slate-900 mb-2">
              No Categories Yet
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Create your first category to start organizing documentation.
            </p>
            <Button asChild>
              <Link href="/admin/docs/categories">
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
