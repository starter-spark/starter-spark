import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  FileDown,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/file-size'
import type { DocAttachment, DocNavPage, DocCategoryInfo } from '@/lib/docs'

const proseClassName = cn(
  'prose',
  'prose-slate',
  'max-w-none',
  'prose-headings:font-mono',
  'prose-headings:text-slate-900',
  'prose-a:text-cyan-700',
  'prose-code:text-cyan-700',
  'prose-code:bg-slate-100',
  'prose-code:px-1.5',
  'prose-code:py-0.5',
  'prose-code:rounded',
  'prose-code:before:content-none',
  'prose-code:after:content-none',
  'prose-pre:bg-slate-900',
  'prose-pre:text-slate-100',
)

interface DocBreadcrumbsProps {
  category: DocCategoryInfo
  title: string
}

export function DocBreadcrumbs({ category, title }: DocBreadcrumbsProps) {
  return (
    <section className="pt-28 pb-4 px-6 lg:px-20">
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
          <Link href="/docs" className="hover:text-cyan-700 transition-colors">
            Documentation
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href={`/docs/${category.slug}`}
            className="hover:text-cyan-700 transition-colors"
          >
            {category.name}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 truncate">{title}</span>
        </nav>
      </div>
    </section>
  )
}

interface DocArticleHeaderProps {
  title: string
  category: DocCategoryInfo
  updatedLabel: string
  readingTime: number
}

export function DocArticleHeader({
  title,
  category,
  updatedLabel,
  readingTime,
}: DocArticleHeaderProps) {
  return (
    <>
      <Link
        href={`/docs/${category.slug}`}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {category.name}
      </Link>

      <header className="mb-8">
        <h1 className="font-mono text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
          {title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Updated {updatedLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{readingTime} min read</span>
          </div>
        </div>
      </header>
    </>
  )
}

interface DocContentProps {
  content: string | null
}

export function DocContent({ content }: DocContentProps) {
  return (
    <div className={proseClassName}>
      {content ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      ) : (
        <p className="text-slate-500 italic">
          This article is being written. Check back soon!
        </p>
      )}
    </div>
  )
}

interface DocAttachmentsProps {
  attachments: DocAttachment[]
}

export function DocAttachments({ attachments }: DocAttachmentsProps) {
  return (
    <div className="mt-8 pt-8 border-t border-slate-200">
      <h2 className="font-mono text-lg text-slate-900 mb-4">Attachments</h2>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <a
            key={attachment.id}
            href={attachment.storage_path}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-3 p-3 rounded border border-slate-200 hover:border-cyan-300 hover:bg-slate-50 transition-all"
          >
            <FileDown className="w-5 h-5 text-cyan-700" />
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
          </a>
        ))}
      </div>
    </div>
  )
}

interface DocPrevNextNavProps {
  categorySlug: string
  prevPage: DocNavPage | null
  nextPage: DocNavPage | null
}

export function DocPrevNextNav({
  categorySlug,
  prevPage,
  nextPage,
}: DocPrevNextNavProps) {
  return (
    <section className="pb-24 px-6 lg:px-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4">
          {prevPage ? (
            <Link
              href={`/docs/${categorySlug}/${prevPage.slug}`}
              className="flex-1 p-4 bg-white rounded border border-slate-200 hover:border-cyan-300 transition-colors group"
            >
              <p className="text-xs text-slate-500 mb-1">Previous</p>
              <p className="font-mono text-slate-900 group-hover:text-cyan-700 transition-colors">
                {prevPage.title}
              </p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextPage ? (
            <Link
              href={`/docs/${categorySlug}/${nextPage.slug}`}
              className="flex-1 p-4 bg-white rounded border border-slate-200 hover:border-cyan-300 transition-colors group text-right"
            >
              <p className="text-xs text-slate-500 mb-1">Next</p>
              <p className="font-mono text-slate-900 group-hover:text-cyan-700 transition-colors">
                {nextPage.title}
              </p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    </section>
  )
}
