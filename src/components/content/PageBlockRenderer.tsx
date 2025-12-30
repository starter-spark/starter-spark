'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Highlight, themes } from 'prism-react-renderer'
import {
  AlertTriangle,
  Check,
  Copy,
  Info,
  Lightbulb,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { safeMarkdownUrlTransform } from '@/lib/safe-url'
import { createMarkdownComponents } from '@/components/markdown/markdown-components'
import type {
  PageBlock,
} from '@/types/page-blocks'
import { generateAnchor } from '@/types/page-blocks'

const markdownStyles = {
  h2: 'font-mono text-xl text-slate-900 mt-6 mb-3',
  h3: 'font-mono text-lg text-slate-900 mt-4 mb-2',
  p: 'text-slate-600 mb-4 leading-relaxed',
  ul: 'list-disc list-inside space-y-2 text-slate-600 mb-6',
  ol: 'list-decimal list-inside space-y-2 text-slate-600 mb-6',
  li: 'text-slate-600',
  blockquote:
    'border-l-4 border-cyan-500 bg-slate-50 pl-4 py-2 my-4 italic text-slate-600',
  link: 'text-cyan-700 hover:underline',
}

const markdownComponents = createMarkdownComponents(markdownStyles)

// Map common language aliases to Prism language names
function getPrismLanguage(lang: string): string {
  const languageMap: Record<string, string> = {
    cpp: 'cpp',
    'c++': 'cpp',
    c: 'c',
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    python: 'python',
    py: 'python',
    java: 'java',
    arduino: 'cpp',
    bash: 'bash',
    sh: 'bash',
    shell: 'bash',
    json: 'json',
    html: 'markup',
    css: 'css',
    sql: 'sql',
    text: 'plain',
    plain: 'plain',
    plaintext: 'plain',
  }
  return languageMap[lang.toLowerCase()] || 'plain'
}

function CodeBlock({
  code,
  language = 'plaintext',
  filename,
  showLineNumbers = true,
}: {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
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
          aria-label={copied ? 'Copied!' : 'Copy code'}
          type="button"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      <Highlight
        theme={themes.github}
        code={code.trim()}
        language={prismLanguage}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} p-4 overflow-x-auto text-sm`}
            style={{ ...style, margin: 0, background: '#f8fafc' }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {showLineNumbers && (
                  <span className="inline-block w-8 text-slate-400 select-none text-right mr-4">
                    {i + 1}
                  </span>
                )}
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

function Callout({
  variant,
  title,
  children,
}: {
  variant: 'tip' | 'warning' | 'info' | 'danger'
  title?: string
  children: React.ReactNode
}) {
  const styles = {
    tip: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      icon: <Lightbulb className="w-5 h-5 text-cyan-700" />,
      defaultTitle: 'Tip',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      defaultTitle: 'Warning',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      defaultTitle: 'Note',
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      defaultTitle: 'Important',
    },
	} as const

	const style = (() => {
		switch (variant) {
			case 'tip':
				return styles.tip
			case 'warning':
				return styles.warning
			case 'danger':
				return styles.danger
			case 'info':
			default:
				return styles.info
		}
	})()

	return (
		<div className={`${style.bg} ${style.border} border rounded p-4 my-6`}>
      <div className="flex items-center gap-2 mb-2">
        {style.icon}
        <span className="font-mono text-sm font-semibold">
          {title || style.defaultTitle}
        </span>
      </div>
      <div className="text-sm text-slate-700 prose prose-sm max-w-none">
        {children}
      </div>
    </div>
  )
}

function getVideoEmbed(
  url: string,
): { type: 'youtube' | 'vimeo' | 'direct'; embedUrl: string } | null {
  // YouTube
  const youtubeMatch =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(
      url,
    )
  if (youtubeMatch) {
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}` }
  }

  // Vimeo
  const vimeoMatch = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url)
  if (vimeoMatch) {
    return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` }
  }

  // Direct video
  if (/\.(mp4|webm|ogg)$/i.test(url)) {
    return { type: 'direct', embedUrl: url }
  }

  return null
}

function VideoPlayer({ url, caption }: { url: string; caption?: string }) {
  const embed = getVideoEmbed(url)

  if (!embed) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center my-6">
        <p className="text-slate-500">Unable to load video from: {url}</p>
      </div>
    )
  }

  return (
    <figure className="my-6">
      {embed.type === 'direct' ? (
        <video
          src={embed.embedUrl}
          className="w-full rounded-lg"
          controls
        />
      ) : (
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <iframe
            src={embed.embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {caption && (
        <figcaption className="text-sm text-slate-500 mt-2 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

interface PageBlockRendererProps {
  blocks: PageBlock[]
}

export function PageBlockRenderer({ blocks }: PageBlockRendererProps) {
  const renderMarkdown = (content: string) => (
    <ReactMarkdown
      urlTransform={safeMarkdownUrlTransform}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  )

  const renderBlock = (block: PageBlock, index: number) => {
    const key = block.id || `block-${index}`

    switch (block.type) {
      case 'heading': {
        const b = block
        const anchor = b.anchor || generateAnchor(b.content)
        const Tag = b.level === 1 ? 'h2' : b.level === 2 ? 'h3' : 'h4'
        const className =
          b.level === 1
            ? 'font-mono text-2xl text-slate-900 mt-10 mb-4 scroll-mt-24'
            : b.level === 2
              ? 'font-mono text-xl text-slate-900 mt-8 mb-3 scroll-mt-24'
              : 'font-mono text-lg text-slate-900 mt-6 mb-2 scroll-mt-24'
        return (
          <Tag key={key} id={anchor} className={className}>
            {b.content}
          </Tag>
        )
      }

      case 'text': {
        const b = block
        return (
          <div key={key} className="prose prose-slate max-w-none">
            {renderMarkdown(b.content)}
          </div>
        )
      }

      case 'image': {
        const b = block
        const widthClass =
          b.width === 'small'
            ? 'max-w-sm mx-auto'
            : b.width === 'medium'
              ? 'max-w-xl mx-auto'
              : b.width === 'full'
                ? 'w-full'
                : 'max-w-3xl mx-auto'
        return (
          <figure key={key} className={`my-6 ${widthClass}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.url}
              alt={b.alt}
              className="w-full rounded border border-slate-200"
              loading="lazy"
            />
            {b.caption && (
              <figcaption className="text-sm text-slate-500 mt-2 text-center">
                {b.caption}
              </figcaption>
            )}
          </figure>
        )
      }

      case 'callout': {
        const b = block
        return (
          <Callout key={key} variant={b.variant} title={b.title}>
            {renderMarkdown(b.content)}
          </Callout>
        )
      }

      case 'code': {
        const b = block
        return (
          <CodeBlock
            key={key}
            code={b.code}
            language={b.language}
            filename={b.filename}
            showLineNumbers={b.showLineNumbers ?? true}
          />
        )
      }

      case 'video': {
        const b = block
        return <VideoPlayer key={key} url={b.url} caption={b.caption} />
      }

      case 'faq': {
        const b = block
        return (
          <Accordion key={key} type="single" collapsible className="my-6">
            {b.items.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium text-slate-900 hover:text-cyan-700">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm prose-slate max-w-none pt-2">
                    {renderMarkdown(item.answer)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )
      }

      case 'cta_button': {
        const b = block
        const alignment =
          b.alignment === 'center'
            ? 'justify-center'
            : b.alignment === 'right'
              ? 'justify-end'
              : 'justify-start'
        const variant =
          b.variant === 'secondary'
            ? 'secondary'
            : b.variant === 'outline'
              ? 'outline'
              : 'default'
        return (
          <div key={key} className={`flex ${alignment} my-6`}>
            <Button asChild variant={variant} className={variant === 'default' ? 'bg-cyan-700 hover:bg-cyan-600' : ''}>
              <a href={b.url}>{b.text}</a>
            </Button>
          </div>
        )
      }

      case 'divider': {
        const b = block
        if (b.style === 'space') {
          return <div key={key} className="my-12" />
        }
        if (b.style === 'dots') {
          return (
            <div key={key} className="my-8 flex justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </div>
          )
        }
        return <hr key={key} className="my-8 border-slate-200" />
      }

      case 'stat_counter': {
        const b = block
        const statCount = b.stats.length
        // Use appropriate grid columns based on count
        const gridCols =
          statCount === 1
            ? 'grid-cols-1 max-w-xs'
            : statCount === 2
              ? 'grid-cols-2 max-w-md'
              : statCount === 3
                ? 'grid-cols-3 max-w-2xl'
                : 'grid-cols-2 md:grid-cols-4'
        return (
          <div
            key={key}
            className={`grid ${gridCols} gap-6 my-8 p-6 bg-slate-50 rounded-lg border border-slate-200 mx-auto`}
          >
            {b.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-mono text-3xl font-bold text-cyan-700">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )
      }

      default:
        return (
          <div
            key={key}
            className="rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 my-4"
          >
            Unsupported block type: <span className="font-mono">{(block as PageBlock).type}</span>
          </div>
        )
    }
  }

  return <div className="space-y-2">{blocks.map(renderBlock)}</div>
}
