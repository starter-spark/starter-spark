'use client'

import { PageBlockRenderer } from './PageBlockRenderer'
import { TableOfContents } from './TableOfContents'
import { MarkdownPreview } from '@/components/markdown/MarkdownPreview'
import type { PageBlock } from '@/types/page-blocks'

interface PagePreviewProps {
  title: string
  blocks: PageBlock[]
  markdownContent?: string
  tocEnabled: boolean
  showLastUpdated: boolean
  editorMode: 'markdown' | 'blocks'
}

export function PagePreview({
  title,
  blocks,
  markdownContent,
  tocEnabled,
  showLastUpdated,
  editorMode,
}: PagePreviewProps) {
  const hasBlocks = editorMode === 'blocks' && blocks.length > 0
  const showToc = tocEnabled && hasBlocks

  return (
    <div className="bg-white rounded border border-slate-200 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className={showToc ? 'lg:grid lg:grid-cols-[1fr_180px] lg:gap-8' : ''}>
          {/* Main column */}
          <div className="min-w-0">
            {/* Header */}
            <header className="px-4 pt-4 pb-3">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="mb-3">
                <ol className="flex items-center gap-2 text-xs text-slate-400">
                  <li>Home</li>
                  <li aria-hidden="true">/</li>
                  <li className="text-slate-600 font-medium">{title || 'Page Title'}</li>
                </ol>
              </nav>

              {/* Title with accent */}
              <div className="border-l-4 border-cyan-600 pl-3">
                <h1 className="font-mono text-lg font-bold text-slate-900">
                  {title || 'Page Title'}
                </h1>
                {showLastUpdated && (
                  <p className="mt-1 text-xs text-slate-400">
                    Last updated Today
                  </p>
                )}
              </div>
            </header>

            {/* Content */}
            <main className="px-4 pb-4">
              <div className="bg-slate-50 rounded border border-slate-200 p-4">
                {hasBlocks ? (
                  blocks.length > 0 ? (
                    <div className="text-sm">
                      <PageBlockRenderer blocks={blocks} />
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-6 text-sm">
                      Add content blocks to see a preview
                    </p>
                  )
                ) : editorMode === 'markdown' && markdownContent ? (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <MarkdownPreview content={markdownContent} />
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-6 text-sm">
                    Add content to see a preview
                  </p>
                )}
              </div>
            </main>
          </div>

          {/* TOC Sidebar */}
          {showToc && (
            <aside className="hidden lg:block pr-4">
              <div className="sticky top-4 pt-4">
                <TableOfContents blocks={blocks} className="text-xs" />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
