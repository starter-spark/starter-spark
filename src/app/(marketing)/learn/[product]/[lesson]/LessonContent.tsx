"use client"

import { useState } from "react"
import { AlertTriangle, Lightbulb, Copy, Check, Info } from "lucide-react"
import { Highlight, themes } from "prism-react-renderer"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkDirective from "remark-directive"
import { visit } from "unist-util-visit"
import type { Plugin } from "unified"
import type { Root } from "mdast"

interface LessonContentProps {
  content: string
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
    arduino: "cpp",
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

// Custom remark plugin to transform callout directives into custom elements
const remarkCallouts: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node) => {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective"
      ) {
        const directive = node as { name: string; data?: { hName?: string; hProperties?: Record<string, string> }; children?: unknown[] }
        if (["tip", "warning", "info"].includes(directive.name)) {
          const data = directive.data || (directive.data = {})
          data.hName = "div"
          data.hProperties = {
            "data-callout": directive.name,
          }
        }
      }
    })
  }
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
    void navigator.clipboard.writeText(code)
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
  children,
}: {
  type: "tip" | "warning" | "info"
  children: React.ReactNode
}) {
  const styles = {
    tip: {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      icon: <Lightbulb className="w-5 h-5 text-cyan-700" />,
      title: "Tip",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      title: "Warning",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: <Info className="w-5 h-5 text-blue-600" />,
      title: "Note",
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

export function LessonContent({ content }: LessonContentProps) {
  return (
    <article className="prose prose-slate max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkCallouts]}
        components={{
          h2: ({ children }) => (
            <h2 className="font-mono text-2xl text-slate-900 mt-8 mb-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-mono text-xl text-slate-900 mt-6 mb-3">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-slate-600 mb-4">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 text-slate-600 mb-6">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-600">{children}</li>
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
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          // Handle callout divs from remark-directive
          div: ({ children, ...props }) => {
            const calloutType = (props as { "data-callout"?: string })["data-callout"]
            if (calloutType && ["tip", "warning", "info"].includes(calloutType)) {
              return <Callout type={calloutType as "tip" | "warning" | "info"}>{children}</Callout>
            }
            return <div {...props}>{children}</div>
          },
          // Handle code blocks with syntax highlighting
          code: ({ className, children }) => {
            const match = (className || "").match(/language-(\w+)/)
            const isInline = !match

            if (isInline) {
              return (
                <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-sm">
                  {children}
                </code>
              )
            }

            const language = match ? match[1] : "text"
            // Extract text content from children safely
            const codeText = typeof children === "string"
              ? children
              : Array.isArray(children)
                ? children.join("")
                : ""
            return <CodeBlock code={codeText.replace(/\n$/, "")} language={language} />
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}
