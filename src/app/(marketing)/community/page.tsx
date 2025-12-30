import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ForumFilters } from './ForumFilters'
import { PostsList, type Post } from './PostsList'
import { Suspense } from 'react'
import { getContents } from '@/lib/content'
import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

const ITEMS_PER_PAGE = 10

const pageTitle = 'The Lab - Community Q&A'
const pageDescription =
  'Get help from the StarterSpark community. Ask questions, share solutions, and connect with other builders.'

function formatUpstreamError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : typeof error === 'string'
          ? error
          : (() => {
              try {
                return JSON.stringify(error)
              } catch {
                return String(error)
              }
            })()

  const message = raw.replace(/\s+/g, ' ').trim()
  if (!message) return 'Unknown error'
  if (/(<!doctype html|<html)/i.test(message)) return 'Upstream returned HTML'
  return message.length > 300 ? message.slice(0, 300) + '...' : message
}

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: `${siteConfig.url}/community`,
    siteName: siteConfig.name,
    images: [
      {
        url: `/api/og?title=${encodeURIComponent('The Lab')}&subtitle=${encodeURIComponent(pageDescription)}&type=post`,
        width: 1200,
        height: 630,
        alt: pageTitle,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
    images: [
      `/api/og?title=${encodeURIComponent('The Lab')}&subtitle=${encodeURIComponent(pageDescription)}&type=post`,
    ],
  },
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: MaybePromise<{
    status?: string
    tag?: string
    product?: string
    q?: string
  }>
}) {
  const params = await resolveParams(searchParams)
  const supabase = await createClient()
  const allowedStatuses = new Set(['open', 'solved'])
  const statusFilter =
    params.status && allowedStatuses.has(params.status)
      ? params.status
      : undefined
  const tagFilter = (() => {
    if (!params.tag) return undefined
    const trimmed = params.tag.trim()
    if (!trimmed || trimmed.length > 40) return undefined
    return /^[\w\s-]+$/.test(trimmed) ? trimmed : undefined
  })()
  const searchQuery = params.q?.trim().slice(0, 120)

  // Fetch dynamic content
  const content = await getContents(
    [
      'community.header.title',
      'community.header.description',
      'community.empty',
    ],
    {
      'community.header.title': 'The Lab',
      'community.header.description':
        'Get help from the community. Ask questions, share solutions, and connect with other builders. Every question gets answered.',
      'community.empty': 'No discussions yet. Be the first to ask a question!',
    },
  )

  let posts: Post[] = []
  let products: { id: string; name: string; slug: string }[] = []
  let totalCount = 0

  try {
    // Fetch posts with author info and comment count
    let query = supabase
      .from('posts')
      .select(
        `
        id,
        slug,
        title,
        status,
        tags,
        upvotes,
        view_count,
        created_at,
        author:profiles!posts_author_id_fkey (
          id,
          full_name,
          email,
          role,
          avatar_url,
          avatar_seed
        ),
        product:products (
          id,
          name,
          slug
        ),
        comments (id)
      `,
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    if (tagFilter) {
      query = query.contains('tags', [tagFilter])
    }

    // Apply text search
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`)
    }

    // Get total count first
    let countQuery = supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
    if (statusFilter) countQuery = countQuery.eq('status', statusFilter)
    if (tagFilter) countQuery = countQuery.contains('tags', [tagFilter])
    if (searchQuery) countQuery = countQuery.ilike('title', `%${searchQuery}%`)
    const { count } = await countQuery
    totalCount = count || 0

    // Apply pagination - only fetch first page for initial render
    const { data: postData, error } = await query.range(0, ITEMS_PER_PAGE - 1)

    if (error) {
      console.error('Error fetching posts:', formatUpstreamError(error))
    }
    posts = (postData as Post[]) || []
  } catch (error) {
    console.error('Error fetching posts:', formatUpstreamError(error))
  }

  try {
    const { data: productData } = await supabase
      .from('products')
      .select('id, name, slug')
      .order('name')
    products = (productData as typeof products) || []
  } catch (error) {
    console.error('Error fetching products:', formatUpstreamError(error))
  }

  // Get unique tags from posts
  const allTags = new Set<string>()
  for (const post of posts) {
    if (post.tags) for (const tag of post.tags) allTags.add(tag)
  }
  const availableTags = Array.from(allTags).sort()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="px-6 lg:px-8 pt-8 pb-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-slate-500">
              <li>
                <Link href="/" className="hover:text-cyan-700 transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-900 font-medium">Community</li>
            </ol>
          </nav>

          {/* Title block with left accent */}
          <div className="border-l-4 border-cyan-600 pl-4">
            <h1 className="font-mono text-2xl sm:text-3xl font-bold text-slate-900">
              {content['community.header.title']}
            </h1>
            <p className="mt-2 text-slate-600 max-w-xl">
              {content['community.header.description']}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 lg:px-8 pb-16">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              {/* Ask Question CTA */}
              <Button
                asChild
                className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono mb-6"
              >
                <Link href="/community/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Ask a Question
                </Link>
              </Button>

              {/* Filters */}
              <Suspense
                fallback={
                  <div className="animate-pulse bg-slate-100 rounded h-48" />
                }
              >
                <ForumFilters
                  products={products || []}
                  availableTags={availableTags}
                  currentStatus={statusFilter}
                  currentTag={tagFilter}
                  currentProduct={params.product}
                  currentSearch={searchQuery}
                />
              </Suspense>
            </aside>

            {/* Question List */}
            <section aria-label="Discussion posts" className="flex-1 min-w-0">
              <PostsList
                initialPosts={posts}
                totalCount={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                emptyMessage={content['community.empty']}
                statusFilter={statusFilter}
                tagFilter={tagFilter}
                productFilter={params.product}
                searchQuery={searchQuery}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
