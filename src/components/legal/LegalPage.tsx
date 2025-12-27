import ReactMarkdown from 'react-markdown'
import { safeMarkdownUrlTransform } from '@/lib/safe-url'
import { createMarkdownComponents } from '@/components/markdown/markdown-components'

const layoutClassName = 'bg-slate-50'
const sectionClassName = 'pt-32 pb-24 px-6 lg:px-20'
const containerClassName = 'max-w-3xl mx-auto'
const titleClassName = 'font-mono text-4xl font-bold text-slate-900 mb-8'
const cardClassName = 'bg-white rounded border border-slate-200 p-8'
const proseClassName = 'prose prose-slate max-w-none'
const emptyClassName = 'text-slate-600 font-mono text-sm'
const updatedClassName = 'mt-6 text-sm text-slate-600 text-center'
const linkClassName = 'text-cyan-700 hover:underline'
const h1ClassName = 'text-2xl font-mono text-slate-900 mt-6 mb-4'
const h2ClassName = 'text-xl font-mono text-slate-900 mt-5 mb-3'

interface LegalPageProps {
  title: string
  content: string | null
  lastUpdated: string | null
  emptyMessage: string
}

const markdownComponents = createMarkdownComponents({
  link: linkClassName,
  h1: h1ClassName,
  h2: h2ClassName,
})

function LegalContent({
  content,
  emptyMessage,
}: {
  content: string | null
  emptyMessage: string
}) {
  if (!content) {
    return <p className={emptyClassName}>{emptyMessage}</p>
  }

  return (
    <div className={proseClassName}>
      <ReactMarkdown
        urlTransform={safeMarkdownUrlTransform}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function LegalFooter({ lastUpdated }: { lastUpdated: string | null }) {
  if (!lastUpdated) return null
  return <p className={updatedClassName}>Last updated: {lastUpdated}</p>
}

export function LegalPage({
  title,
  content,
  lastUpdated,
  emptyMessage,
}: LegalPageProps) {
  return (
    <div className={layoutClassName}>
      <section className={sectionClassName}>
        <div className={containerClassName}>
          <h1 className={titleClassName}>{title}</h1>

          <div className={cardClassName}>
            <LegalContent content={content} emptyMessage={emptyMessage} />
          </div>

          <LegalFooter lastUpdated={lastUpdated} />
        </div>
      </section>
    </div>
  )
}
