import ReactMarkdown from 'react-markdown'
import { safeMarkdownUrlTransform } from '@/lib/safe-url'
import { createMarkdownComponents } from '@/components/markdown/markdown-components'

const linkClassName = 'text-cyan-700 hover:underline'

const previewComponents = createMarkdownComponents({
  link: linkClassName,
})

interface MarkdownPreviewProps {
  content: string
  emptyMessage?: string
  emptyClassName?: string
}

export function MarkdownPreview({
  content,
  emptyMessage,
  emptyClassName,
}: MarkdownPreviewProps) {
  if (!content && emptyMessage) {
    return <p className={emptyClassName}>{emptyMessage}</p>
  }

  return (
    <ReactMarkdown
      urlTransform={safeMarkdownUrlTransform}
      components={previewComponents}
    >
      {content}
    </ReactMarkdown>
  )
}
