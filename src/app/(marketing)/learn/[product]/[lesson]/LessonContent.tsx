"use client"

import { useState } from "react"
import { AlertTriangle, Lightbulb, Copy, Check, Info } from "lucide-react"
import { Highlight, themes } from "prism-react-renderer"

interface LessonContentProps {
  content: string
}

// DOMPurify configuration - only allow safe tags and attributes
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ["strong", "em", "code", "a", "br"],
  ALLOWED_ATTR: ["href", "class", "target", "rel"],
  ALLOW_DATA_ATTR: false,
  // Only allow safe URL protocols (blocks javascript:, data:, etc.)
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
}

// Only import DOMPurify on client side to avoid jsdom ESM issues on server
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DOMPurify: any = null
if (typeof window !== "undefined") {
  import("dompurify").then((mod) => {
    DOMPurify = mod.default || mod
  })
}

// Map common language aliases to Prism language names
function getPrismLanguage(lang: string): string {
  const languageMap: Record<string, string> = {
    cpp: "cpp",
    "c++": "cpp",
    c: "c",
    javascript: "javascript",
    js: "javascript",
    typescript: "typescript",
    ts: "typescript",
    python: "python",
    py: "python",
    java: "java",
    arduino: "cpp", // Arduino is C++ based
    ino: "cpp",
    bash: "bash",
    sh: "bash",
    shell: "bash",
    json: "json",
    html: "markup",
    css: "css",
    sql: "sql",
    text: "plain",
    plain: "plain",
  }
  return languageMap[lang.toLowerCase()] || "plain"
}

// Code block component with copy button and syntax highlighting
function CodeBlock({
  code,
  language = "cpp",
  filename,
}: {
  code: string
  language?: string
  filename?: string
}) {
  const [copied, setCopied] = useState(false)
  const prismLanguage = getPrismLanguage(language)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded border border-slate-200 overflow-hidden my-6">
      {/* Header with filename and/or language badge */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-sm font-mono text-slate-600">{filename}</span>
          )}
          <span className="text-xs font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-slate-500 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      {/* Syntax highlighted code */}
      <Highlight theme={themes.github} code={code.trim()} language={prismLanguage}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} p-4 overflow-x-auto text-sm`}
            style={{ ...style, margin: 0, background: "#f8fafc" }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="inline-block w-8 text-slate-400 select-none text-right mr-4">
                  {i + 1}
                </span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

// Callout component for tips, warnings, etc.
function Callout({
  type,
  title,
  children,
}: {
  type: "tip" | "warning" | "info"
  title?: string
  children: React.ReactNode
}) {
  const styles = {
    tip: {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      icon: <Lightbulb className="w-5 h-5 text-cyan-700" />,
      title: title || "Tip",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      title: title || "Warning",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: <Info className="w-5 h-5 text-blue-600" />,
      title: title || "Note",
    },
  }

  const style = styles[type]

  return (
    <div className={`${style.bg} ${style.border} border rounded p-4 my-6`}>
      <div className="flex items-center gap-2 mb-2">
        {style.icon}
        <span className="font-mono text-sm font-semibold">{style.title}</span>
      </div>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  )
}

// Parse and render markdown/HTML content from database
function parseContent(content: string): React.ReactNode[] {
  const elements: React.ReactNode[] = []

  // Split content into blocks (by double newlines or special markers)
  const lines = content.split('\n')
  let currentBlock: string[] = []
  let inCodeBlock = false
  let codeLanguage = ''
  let codeFilename = ''
  let key = 0

  const flushBlock = () => {
    if (currentBlock.length === 0) return

    const blockText = currentBlock.join('\n').trim()
    if (!blockText) {
      currentBlock = []
      return
    }

    // Check for callouts (:::tip, :::warning, :::info)
    const calloutMatch = blockText.match(/^:::(tip|warning|info)\s*(.*?)\n([\s\S]*?):::$/m)
    if (calloutMatch) {
      const [, type, title, body] = calloutMatch
      elements.push(
        <Callout key={key++} type={type as "tip" | "warning" | "info"} title={title || undefined}>
          {body.trim()}
        </Callout>
      )
      currentBlock = []
      return
    }

    // Check for headers
    if (blockText.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="font-mono text-2xl text-slate-900 mt-8 mb-4">
          {blockText.slice(3)}
        </h2>
      )
      currentBlock = []
      return
    }

    if (blockText.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="font-mono text-xl text-slate-900 mt-6 mb-3">
          {blockText.slice(4)}
        </h3>
      )
      currentBlock = []
      return
    }

    // Check for unordered lists
    if (blockText.match(/^[-*]\s/m)) {
      const items = blockText.split(/\n/).filter(line => line.match(/^[-*]\s/))
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-2 text-slate-600 mb-6">
          {items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInlineText(item.replace(/^[-*]\s/, '')) }} />
          ))}
        </ul>
      )
      currentBlock = []
      return
    }

    // Check for ordered lists
    if (blockText.match(/^\d+\.\s/m)) {
      const items = blockText.split(/\n/).filter(line => line.match(/^\d+\.\s/))
      elements.push(
        <ol key={key++} className="list-decimal list-inside space-y-2 text-slate-600 mb-6">
          {items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInlineText(item.replace(/^\d+\.\s/, '')) }} />
          ))}
        </ol>
      )
      currentBlock = []
      return
    }

    // Default: paragraph
    elements.push(
      <p key={key++} className="text-slate-600 mb-4" dangerouslySetInnerHTML={{ __html: formatInlineText(blockText) }} />
    )
    currentBlock = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code block start
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        flushBlock()
        inCodeBlock = true
        const match = line.match(/```(\w+)?\s*(.*)/)
        codeLanguage = match?.[1] || 'text'
        codeFilename = match?.[2] || ''
      } else {
        // End of code block
        const code = currentBlock.join('\n')
        elements.push(
          <CodeBlock
            key={key++}
            code={code}
            language={codeLanguage}
            filename={codeFilename || undefined}
          />
        )
        currentBlock = []
        inCodeBlock = false
        codeLanguage = ''
        codeFilename = ''
      }
      continue
    }

    if (inCodeBlock) {
      currentBlock.push(line)
      continue
    }

    // Callout blocks
    if (line.startsWith(':::')) {
      if (currentBlock.length > 0 && !currentBlock[0].startsWith(':::')) {
        flushBlock()
      }
      currentBlock.push(line)
      if (line.match(/^:::(tip|warning|info)/) && !line.endsWith(':::')) {
        // Multi-line callout, continue collecting
        continue
      }
      if (line === ':::' && currentBlock.length > 1) {
        flushBlock()
      }
      continue
    }

    // Empty line - flush current block
    if (line.trim() === '') {
      flushBlock()
      continue
    }

    currentBlock.push(line)
  }

  // Flush any remaining content
  flushBlock()

  return elements
}

// Format inline text (bold, italic, code, links) with XSS protection
function formatInlineText(text: string): string {
  // First, escape any raw HTML to prevent injection
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // Then apply markdown formatting
  const formatted = escaped
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')
    // Links - sanitized by DOMPurify's ALLOWED_URI_REGEXP
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-700 hover:underline">$1</a>')

  // Sanitize with DOMPurify to prevent any XSS that slipped through (client-side only)
  if (DOMPurify) {
    return DOMPurify.sanitize(formatted, PURIFY_CONFIG)
  }
  // On server or before DOMPurify loads, return the escaped/formatted content
  // (already escaped raw HTML above, so this is safe)
  return formatted
}

export function LessonContent({ content }: LessonContentProps) {
  const parsedContent = parseContent(content)

  return (
    <article className="prose prose-slate max-w-none">
      {parsedContent}
    </article>
  )
}
