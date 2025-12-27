'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { safeMarkdownUrlTransform } from '@/lib/safe-url'
import { createMarkdownComponents } from '@/components/markdown/markdown-components'

interface MarkdownContentProps {
  content: string
}

const proseClassName = 'prose prose-slate max-w-none'
const headingTwoClassName = 'font-mono text-xl text-slate-900 mt-6 mb-3'
const headingThreeClassName = 'font-mono text-lg text-slate-900 mt-6 mb-2'
const paragraphClassName = 'text-slate-600 mb-3'
const listClassName = 'list-disc list-inside text-slate-600 mb-3'
const orderedListClassName = 'list-decimal list-inside text-slate-600 mb-3'
const listItemClassName = 'text-slate-600 ml-4'
const linkClassName = 'text-cyan-700 hover:underline'
const strongClassName = 'font-semibold text-slate-900'
const inlineCodeClassName =
  'bg-slate-100 px-1.5 py-0.5 rounded font-mono text-sm text-slate-800'

// Code block with copy button
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className="rounded border border-slate-200 overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
        <span className="text-sm font-mono text-slate-500">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="text-slate-500 hover:text-slate-600 transition-colors"
          type="button"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      <pre className="p-4 bg-slate-50 overflow-x-auto">
        <code className="text-sm font-mono text-slate-800">{code}</code>
      </pre>
    </div>
  )
}

function MarkdownCode({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const match = /language-(\w+)/.exec(className || '')
  const isInline = !match

  if (isInline) {
    return <code className={inlineCodeClassName}>{children}</code>
  }

  const language = match ? match[1] : ''
  // Extract text content from children safely
  const codeText =
    typeof children === 'string'
      ? children
      : Array.isArray(children)
        ? children.join('')
        : ''
  return <CodeBlock code={codeText.replace(/\n$/, '')} language={language} />
}

const markdownComponents = createMarkdownComponents(
  {
    link: linkClassName,
    h2: headingTwoClassName,
    h3: headingThreeClassName,
    p: paragraphClassName,
    ul: listClassName,
    ol: orderedListClassName,
    li: listItemClassName,
    strong: strongClassName,
  },
  {
    code: MarkdownCode,
    pre: ({ children }) => <>{children}</>,
    em: ({ children }) => <em>{children}</em>,
  },
)

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className={proseClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeMarkdownUrlTransform}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
