import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type SupabaseServerClient = SupabaseClient<Database>

export interface DocMetadata {
  title: string
  excerpt: string | null
  categorySlug: string
}

export interface DocCategoryInfo {
  id: string
  name: string
  slug: string
}

export interface DocPageRecord {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  created_at: string | null
  updated_at: string | null
  category: DocCategoryInfo
}

export interface DocAttachment {
  id: string
  filename: string
  storage_path: string
  file_size: number | null
  mime_type: string | null
  url: string
}

export interface DocNavPage {
  id: string
  title: string
  slug: string
  sort_order: number | null
}

export interface DocCategoryMeta {
  name: string
  description: string | null
}

export interface DocCategoryListPage {
  id: string
  title: string
  slug: string
  excerpt: string | null
}

export interface DocCategoryListItem {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number | null
  pages: DocCategoryListPage[]
}

export interface DocCategoryPage {
  id: string
  title: string
  slug: string
  excerpt: string | null
  updated_at: string | null
  sort_order: number | null
}

export interface DocCategoryWithPages {
  id: string
  name: string
  slug: string
  description: string | null
  pages: DocCategoryPage[]
}

export async function fetchDocMetadata(
  supabase: SupabaseServerClient,
  categorySlug: string,
  slug: string,
): Promise<DocMetadata | null> {
  // doc_pages slugs are only unique per category (UNIQUE(category_id, slug)),
  // so the lookup must be scoped through the inner-joined category.
  const { data } = await supabase
    .from('doc_pages')
    .select(
      `
      title,
      excerpt,
      category:doc_categories!inner (
        slug
      )
    `,
    )
    .eq('slug', slug)
    .eq('category.slug', categorySlug)
    .eq('is_published', true)
    .single()

  const page = data as {
    title: string
    excerpt: string | null
    category: { slug: string }
  } | null

  if (!page?.category?.slug) return null

  return {
    title: page.title,
    excerpt: page.excerpt,
    categorySlug: page.category.slug,
  }
}

export async function fetchDocCategoryMeta(
  supabase: SupabaseServerClient,
  slug: string,
): Promise<DocCategoryMeta | null> {
  const { data } = await supabase
    .from('doc_categories')
    .select('name, description')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!data) return null
  return data as DocCategoryMeta
}

export async function fetchDocCategories(
  supabase: SupabaseServerClient,
): Promise<DocCategoryListItem[]> {
  const { data, error } = await supabase
    .from('doc_categories')
    .select(
      `
      id,
      name,
      slug,
      description,
      icon,
      sort_order,
      pages:doc_pages (
        id,
        title,
        slug,
        excerpt
      )
    `,
    )
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
  }

  return (data as DocCategoryListItem[] | null) ?? []
}

export async function fetchDocCategoryWithPages(
  supabase: SupabaseServerClient,
  slug: string,
): Promise<DocCategoryWithPages | null> {
  const { data, error } = await supabase
    .from('doc_categories')
    .select(
      `
      id,
      name,
      slug,
      description,
      pages:doc_pages (
        id,
        title,
        slug,
        excerpt,
        sort_order,
        updated_at
      )
    `,
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !data) return null
  return data as DocCategoryWithPages
}

export async function fetchDocArticle(
  supabase: SupabaseServerClient,
  categorySlug: string,
  slug: string,
): Promise<DocPageRecord | null> {
  // doc_pages slugs are only unique per category (UNIQUE(category_id, slug)),
  // so the lookup must be scoped through the inner-joined category.
  const { data, error } = await supabase
    .from('doc_pages')
    .select(
      `
      id,
      title,
      slug,
      content,
      excerpt,
      created_at,
      updated_at,
      category:doc_categories!inner (
        id,
        name,
        slug
      )
    `,
    )
    .eq('slug', slug)
    .eq('category.slug', categorySlug)
    .eq('is_published', true)
    .single()

  if (error || !data) return null

  const page = data as DocPageRecord
  if (!page.category) return null

  return page
}

export async function fetchDocAttachments(
  supabase: SupabaseServerClient,
  pageId: string,
): Promise<DocAttachment[]> {
  const { data } = await supabase
    .from('doc_attachments')
    .select('id, filename, storage_path, file_size, mime_type')
    .eq('page_id', pageId)

  const rows = (data as Omit<DocAttachment, 'url'>[] | null) ?? []

  // storage_path stays bucket-relative in the DB; resolve it to a public URL
  // here so the bucket can move without a data migration.
  return rows.map((row) => ({
    ...row,
    url: supabase.storage.from('doc-attachments').getPublicUrl(row.storage_path)
      .data.publicUrl,
  }))
}

export async function fetchDocSiblingPages(
  supabase: SupabaseServerClient,
  categoryId: string,
): Promise<DocNavPage[]> {
  const { data } = await supabase
    .from('doc_pages')
    .select('id, title, slug, sort_order')
    .eq('category_id', categoryId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  return (data as DocNavPage[] | null) ?? []
}
