import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import type { Metadata } from 'next'
import { safeMarkdownUrlTransform } from '@/lib/safe-url'
import { formatDate } from '@/lib/utils'
import { createMarkdownComponents } from '@/components/markdown/markdown-components'
import { resolveParams, type MaybePromise } from '@/lib/next-params'
import { PageBlockRenderer } from '@/components/content/PageBlockRenderer'
import { TableOfContents } from '@/components/content/TableOfContents'
import type { PageBlock } from '@/types/page-blocks'

const proseClassName =
  'prose prose-slate max-w-none prose-headings:font-mono prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-cyan-700 prose-a:no-underline hover:prose-a:underline prose-li:text-slate-600 prose-blockquote:border-l-cyan-700 prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r prose-blockquote:not-italic'
const linkClassName = 'text-cyan-700 hover:underline'
const headingOneClassName = 'text-2xl font-mono text-slate-900 mt-6 mb-4'
const headingTwoClassName = 'text-xl font-mono text-slate-900 mt-5 mb-3'

const markdownComponents = createMarkdownComponents({
  link: linkClassName,
  h1: headingOneClassName,
  h2: headingTwoClassName,
})

interface PageProps {
  params: MaybePromise<{ slug: string }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseContentBlocks(blocks: unknown): PageBlock[] {
  if (!Array.isArray(blocks)) return []
  return blocks.filter(
    (b): b is PageBlock => isRecord(b) && typeof b.type === 'string',
  )
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params)
  const supabase = await createClient()

  const { data: page } = await supabase
    .from('page_content')
    .select('title, seo_title, seo_description')
    .eq('slug', slug)
    .eq('is_custom_page', true)
    .not('published_at', 'is', null)
    .maybeSingle()

  if (!page) {
    return {
      title: 'Page Not Found',
    }
  }

  return {
    title: page.seo_title || page.title,
    description: page.seo_description || undefined,
  }
}

export default async function CustomPage({ params }: PageProps) {
  const { slug } = await resolveParams(params)
  const supabase = await createClient()

  // Fetch the custom page by slug
  const { data: page, error } = await supabase
    .from('page_content')
    .select('*')
    .eq('slug', slug)
    .eq('is_custom_page', true)
    .not('published_at', 'is', null)
    .maybeSingle()

  if (error || !page) {
    notFound()
  }

  // Parse content blocks from the page data
  const contentBlocks = parseContentBlocks(page.content_blocks)
  const hasBlocks = contentBlocks.length > 0
  const tocEnabled = page.toc_enabled === true && hasBlocks
  const showLastUpdated = page.show_last_updated !== false

  const lastUpdated = page.updated_at ? formatDate(page.updated_at) : null

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <div className={`${tocEnabled ? 'lg:grid lg:grid-cols-[1fr_220px] lg:gap-12' : ''}`}>
          {/* Main column */}
          <div className="min-w-0">
            {/* Header */}
            <header className="px-6 lg:px-8 pt-8 pb-6">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex items-center gap-2 text-sm text-slate-500">
                  <li>
                    <a
                      href="/"
                      className="hover:text-cyan-700 transition-colors"
                    >
                      Home
                    </a>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li className="text-slate-900 font-medium">{page.title}</li>
                </ol>
              </nav>

              {/* Title block with left accent */}
              <div className="border-l-4 border-cyan-600 pl-4">
                <h1 className="font-mono text-2xl sm:text-3xl font-bold text-slate-900">
                  {page.title}
                </h1>
                {showLastUpdated && lastUpdated && (
                  <p className="mt-2 text-sm text-slate-500">
                    Last updated {lastUpdated}
                  </p>
                )}
              </div>
            </header>

            {/* Content */}
            <main className="px-6 lg:px-8 pb-16">
              <div className="bg-slate-50 rounded border border-slate-200 p-6 sm:p-8">
                {hasBlocks ? (
                  <PageBlockRenderer blocks={contentBlocks} />
                ) : (
                  <div className={proseClassName}>
                    <ReactMarkdown
                      urlTransform={safeMarkdownUrlTransform}
                      components={markdownComponents}
                    >
                      {page.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </main>
          </div>

          {/* TOC Sidebar */}
          {tocEnabled && (
            <aside className="hidden lg:block pr-6 lg:pr-8">
              <div className="sticky top-24 pt-8">
                <TableOfContents
                  blocks={contentBlocks}
                  className="text-sm"
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}