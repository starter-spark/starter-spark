"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownContentProps {
  content: string
}

// Code block with copy button
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded border border-slate-200 overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
        <span className="text-sm font-mono text-slate-500">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="text-slate-500 hover:text-slate-600 transition-colors"
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

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-slate max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="font-mono text-xl text-slate-900 mt-6 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-mono text-lg text-slate-900 mt-6 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-slate-600 mb-3">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-slate-600 mb-3">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-slate-600 mb-3">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-600 ml-4">{children}</li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-700 hover:underline"
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const match = (className || "").match(/language-(\w+)/)
            const isInline = !match

            if (isInline) {
              return (
                <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-sm text-slate-800">
                  {children}
                </code>
              )
            }

            const language = match ? match[1] : ""
            // Extract text content from children safely
            const codeText = typeof children === "string"
              ? children
              : Array.isArray(children)
                ? children.join("")
                : ""
            return <CodeBlock code={codeText.replace(/\n$/, "")} language={language} />
          },
          pre: ({ children }) => <>{children}</>,
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => <em>{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
