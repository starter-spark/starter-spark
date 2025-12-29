import ReactMarkdown from 'react-markdown'
import { safeMarkdownUrlTransform } from '@/lib/safe-url'
import { createMarkdownComponents } from '@/components/markdown/markdown-components'
import { MarkdownTableOfContents } from '@/components/content/MarkdownTableOfContents'

const proseClassName =
  'prose prose-slate max-w-none prose-headings:font-mono prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-cyan-700 prose-a:no-underline hover:prose-a:underline prose-li:text-slate-600 prose-blockquote:border-l-cyan-700 prose-blockquote:bg-white prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r prose-blockquote:not-italic'

const markdownComponents = createMarkdownComponents({
  link: 'text-cyan-700 hover:underline',
  h1: 'text-2xl font-mono text-slate-900 mt-8 mb-4',
  h2: 'text-xl font-mono text-slate-900 mt-6 mb-3',
})

interface LegalPageProps {
  title: string
  content: string | null
  lastUpdated: string | null
  emptyMessage: string
  breadcrumbLabel?: string
}

export function LegalPage({
  title,
  content,
  lastUpdated,
  emptyMessage,
  breadcrumbLabel,
}: LegalPageProps) {
  const hasContent = !!content

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-[1fr_200px] lg:gap-12">
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
                  <li className="text-slate-900 font-medium">
                    {breadcrumbLabel || title}
                  </li>
                </ol>
              </nav>

              {/* Title block with left accent */}
              <div className="border-l-4 border-cyan-600 pl-4">
                <h1 className="font-mono text-2xl sm:text-3xl font-bold text-slate-900">
                  {title}
                </h1>
                {lastUpdated && (
                  <p className="mt-2 text-sm text-slate-500">
                    Last updated {lastUpdated}
                  </p>
                )}
              </div>
            </header>

            {/* Content */}
            <main className="px-6 lg:px-8 pb-16">
              <article className="bg-slate-50 rounded border border-slate-200 p-6 sm:p-8">
                {hasContent ? (
                  <div className={proseClassName}>
                    <ReactMarkdown
                      urlTransform={safeMarkdownUrlTransform}
                      components={markdownComponents}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-slate-600 font-mono text-sm">
                    {emptyMessage}
                  </p>
                )}
              </article>
            </main>
          </div>

          {/* TOC Sidebar */}
          {hasContent && (
            <aside className="hidden lg:block pr-6 lg:pr-8">
              <div className="sticky top-24 pt-8">
                <MarkdownTableOfContents content={content} className="text-sm" />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
