'use client'

import { useCallback, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  AlertTriangle,
  Check,
  CheckSquare,
  Copy,
  Download,
  Info,
  Lightbulb,
  Square,
} from 'lucide-react'
import { useLessonStatsOptional } from './LessonStats'
import { Highlight, themes } from 'prism-react-renderer'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import type { ComponentPropsWithoutRef } from 'react'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkEmoji from 'remark-emoji'
import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'
import {
  normalizeLearnAssetValue,
  parseLearnAssetRef,
  resolveLearnAssetUrl,
} from '@/lib/learn-assets'
import {
  safeMarkdownUrlTransform,
} from '@/lib/safe-url'
import { createMarkdownComponents } from '@/components/markdown/markdown-components'

const LazyCodeEditor = dynamic(
  () => import('@/components/learn/CodeEditor').then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Loading editor…
      </div>
    ),
  },
)

const LazyFlowViewer = dynamic(
  () => import('@/components/learn/FlowViewer').then((m) => m.FlowViewer),
  {
    ssr: false,
    loading: () => (
      <div className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Loading diagram…
      </div>
    ),
  },
)

const LazyVisualBlocksChallenge = dynamic(
  () =>
    import('@/components/learn/VisualBlocksChallenge').then(
      (m) => m.VisualBlocksChallenge,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Loading challenge…
      </div>
    ),
  },
)

const markdownStyles = {
  h2: 'font-mono text-2xl text-slate-900 mt-8 mb-4',
  h3: 'font-mono text-xl text-slate-900 mt-6 mb-3',
  p: 'text-slate-600 mb-4',
  ul: 'list-disc list-inside space-y-2 text-slate-600 mb-6',
  ol: 'list-decimal list-inside space-y-2 text-slate-600 mb-6',
  li: 'text-slate-600',
  blockquote:
    'border-l-4 border-cyan-500 bg-slate-50 pl-4 py-2 my-4 italic text-slate-600',
  link: 'text-cyan-700 hover:underline',
}

const inlineCodeClassName =
  'bg-slate-100 px-1.5 py-0.5 rounded font-mono text-sm'

interface LessonContentProps {
  content: string
  contentBlocks?: unknown[] | null
  lessonType?: string
  videoUrl?: string | null
  codeStarter?: string | null
  codeSolution?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

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
    ino: 'cpp',
    bash: 'bash',
    sh: 'bash',
    shell: 'bash',
    json: 'json',
    html: 'markup',
    css: 'css',
    sql: 'sql',
    text: 'plain',
    plain: 'plain',
  }
  return languageMap[lang.toLowerCase()] || 'plain'
}

// Custom remark plugin to transform callout directives into custom elements
const remarkCallouts: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const directive = node as {
          name: string
          data?: { hName?: string; hProperties?: Record<string, string> }
          children?: unknown[]
        }
        if (['tip', 'warning', 'info', 'danger'].includes(directive.name)) {
          const data = directive.data || (directive.data = {})
          data.hName = 'div'
          data.hProperties = {
            'data-callout': directive.name,
          }
        }
      }
    })
  }
}

// Code block component with copy button and syntax highlighting
function CodeBlock({
  code,
  language = 'cpp',
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
    setTimeout(() => {
      setCopied(false)
    }, 2000)
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

function Callout({
  variant,
  children,
}: {
  variant: 'tip' | 'warning' | 'info' | 'danger'
  children: React.ReactNode
}) {
  const styles = {
    tip: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      icon: <Lightbulb className="w-5 h-5 text-cyan-700" />,
      title: 'Tip',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      title: 'Warning',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      title: 'Note',
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      title: 'Important',
    },
  } as const

  const style =
    variant === 'tip'
      ? styles.tip
      : variant === 'warning'
        ? styles.warning
        : variant === 'info'
          ? styles.info
          : styles.danger

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

function getVideoEmbed(
  url: string,
): { type: 'youtube' | 'vimeo' | 'direct'; id: string } | null {
  const normalized = normalizeLearnAssetValue(url)

  if (normalized.startsWith('/api/learn/assets?')) {
    return { type: 'direct', id: normalized }
  }

  if (parseLearnAssetRef(normalized)) {
    return { type: 'direct', id: resolveLearnAssetUrl(normalized) }
  }

  const youtubeMatch =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(
      url,
    )
  if (youtubeMatch) {
    return { type: 'youtube', id: youtubeMatch[1] }
  }

  const vimeoMatch = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url)
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1] }
  }

  if (/\.(mp4|webm|ogg)$/i.test(url)) {
    return { type: 'direct', id: url }
  }

  return null
}

interface VideoChapter {
  time: number // seconds
  title: string
}

interface VideoPlayerProps {
  url: string
  startTime?: number
  chapters?: VideoChapter[]
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function VideoPlayer({ url, startTime, chapters }: VideoPlayerProps) {
  const embed = getVideoEmbed(url)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)

  // Jump to timestamp
  const jumpToTime = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      videoRef.current.play().catch(() => {})
    }
  }, [])

  if (!embed) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center my-6">
        <p className="text-slate-500">Unable to load video from: {url}</p>
      </div>
    )
  }

  if (embed.type === 'youtube') {
    // YouTube supports start time via URL param
    const startParam = startTime ? `?start=${startTime}` : ''
    return (
      <div className="space-y-2 my-6">
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${embed.id}${startParam}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {chapters && chapters.length > 0 && (
          <VideoChapterList chapters={chapters} onJump={() => {}} isYouTube videoId={embed.id} />
        )}
      </div>
    )
  }

  if (embed.type === 'vimeo') {
    // Vimeo supports start time via #t=
    const startHash = startTime ? `#t=${startTime}s` : ''
    return (
      <div className="space-y-2 my-6">
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <iframe
            src={`https://player.vimeo.com/video/${embed.id}${startHash}`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        {chapters && chapters.length > 0 && (
          <VideoChapterList chapters={chapters} onJump={() => {}} isVimeo videoId={embed.id} />
        )}
      </div>
    )
  }

  // Direct video with full controls
  return (
    <div className="space-y-2 my-6">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={embed.id}
          className="w-full h-full"
          controls
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={() => {
            if (startTime && videoRef.current) {
              videoRef.current.currentTime = startTime
            }
          }}
        />
      </div>
      {chapters && chapters.length > 0 && (
        <VideoChapterList chapters={chapters} onJump={jumpToTime} currentTime={currentTime} />
      )}
    </div>
  )
}

function VideoChapterList({
  chapters,
  onJump,
  currentTime = 0,
  isYouTube,
  isVimeo,
  videoId,
}: {
  chapters: VideoChapter[]
  onJump: (time: number) => void
  currentTime?: number
  isYouTube?: boolean
  isVimeo?: boolean
  videoId?: string
}) {
  // Find current chapter
  const currentChapter = chapters.reduce((acc, ch, idx) => {
    if (ch.time <= currentTime) return idx
    return acc
  }, 0)

  return (
    <div className="bg-slate-50 rounded border border-slate-200 p-3">
      <p className="font-mono text-xs font-semibold text-slate-700 mb-2">Chapters</p>
      <div className="space-y-1">
        {chapters.map((chapter, idx) => {
          const isActive = idx === currentChapter

          if (isYouTube && videoId) {
            return (
              <a
                key={idx}
                href={`https://www.youtube.com/watch?v=${videoId}&t=${chapter.time}s`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded transition-colors ${
                  isActive
                    ? 'bg-cyan-100 text-cyan-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono text-xs text-slate-400 w-10">
                  {formatTime(chapter.time)}
                </span>
                <span className="flex-1">{chapter.title}</span>
              </a>
            )
          }

          if (isVimeo && videoId) {
            return (
              <a
                key={idx}
                href={`https://vimeo.com/${videoId}#t=${chapter.time}s`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded transition-colors ${
                  isActive
                    ? 'bg-cyan-100 text-cyan-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono text-xs text-slate-400 w-10">
                  {formatTime(chapter.time)}
                </span>
                <span className="flex-1">{chapter.title}</span>
              </a>
            )
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onJump(chapter.time)}
              className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded transition-colors w-full text-left ${
                isActive
                  ? 'bg-cyan-100 text-cyan-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="font-mono text-xs text-slate-400 w-10">
                {formatTime(chapter.time)}
              </span>
              <span className="flex-1">{chapter.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Collapsible advanced content section
function AdvancedSection({
  title,
  children,
  defaultOpen = false,
}: {
  title?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="my-6 border border-purple-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-purple-600 font-mono text-xs uppercase tracking-wide font-semibold">
            Advanced
          </span>
          {title && <span className="text-sm text-purple-900 font-medium">{title}</span>}
        </div>
        <svg
          className={`w-5 h-5 text-purple-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-white border-t border-purple-200">
          {children}
        </div>
      )}
    </div>
  )
}

// Alternative explanation component
function AlternativeExplanation({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  const [showAlternative, setShowAlternative] = useState(false)

  return (
    <div className="my-4">
      {!showAlternative ? (
        <button
          type="button"
          onClick={() => setShowAlternative(true)}
          className="text-sm text-cyan-700 hover:text-cyan-600 font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {title || "Explain differently"}
        </button>
      ) : (
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-cyan-800 font-mono text-xs uppercase tracking-wide font-semibold">
              Alternative Explanation
            </span>
            <button
              type="button"
              onClick={() => setShowAlternative(false)}
              className="text-cyan-600 hover:text-cyan-800 text-sm"
            >
              Hide
            </button>
          </div>
          <div className="text-sm text-cyan-900">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

function QuizBlock({
  question,
  options,
  correctAnswer,
}: {
  question: string
  options: string[]
  correctAnswer: number | null
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const stats = useLessonStatsOptional()

  const isCorrect = submitted && selected === correctAnswer

  const handleSubmit = () => {
    setSubmitted(true)
    // Record quiz answer for stats
    if (stats) {
      stats.recordQuizAnswer(selected === correctAnswer)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 my-6">
      <h3 className="font-mono text-lg font-semibold text-slate-900 mb-4">
        {question}
      </h3>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isSelected = selected === i
          const showCorrect = submitted && correctAnswer === i
          const showIncorrect = submitted && isSelected && correctAnswer !== i

          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (!submitted) {
                  setSelected(i)
                }
              }}
              disabled={submitted}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                showCorrect
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : showIncorrect
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : isSelected
                      ? 'border-cyan-500 bg-cyan-50 text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
              } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    showCorrect
                      ? 'border-green-500 bg-green-500'
                      : showIncorrect
                        ? 'border-red-500 bg-red-500'
                        : isSelected
                          ? 'border-cyan-500 bg-cyan-500'
                          : 'border-slate-300'
                  }`}
                >
                  {(isSelected || showCorrect) && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm">{opt}</span>
              </div>
            </button>
          )
        })}
      </div>
      {!submitted && selected !== null && (
        <button
          type="button"
          onClick={handleSubmit}
          className="mt-4 px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-sm transition-colors"
        >
          Check Answer
        </button>
      )}
      {submitted && (
        <div
          className={`mt-4 p-3 rounded ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
        >
          <p className="text-sm font-medium">
            {isCorrect
              ? 'Correct!'
              : `Incorrect. The correct answer is: ${options[correctAnswer ?? 0]}`}
          </p>
        </div>
      )}
      {submitted && (
        <button
          type="button"
          onClick={() => {
            setSelected(null)
            setSubmitted(false)
          }}
          className="mt-3 text-sm text-cyan-700 hover:text-cyan-600 font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

function CodeChallenge({
  starterCode,
  solutionCode,
  language = 'cpp',
  storageKey,
}: {
  starterCode: string
  solutionCode?: string | null
  language?: string
  storageKey?: string
}) {
  const [showSolution, setShowSolution] = useState(false)
  const stats = useLessonStatsOptional()
  const hasRecordedAttemptRef = useRef(false)

  // Record attempt when user starts editing (first keypress)
  const handleCodeChange = useCallback(() => {
    if (!hasRecordedAttemptRef.current && stats) {
      stats.incrementAttempts()
      hasRecordedAttemptRef.current = true
    }
  }, [stats])

  return (
    <div className="space-y-4 my-8">
      <div className="rounded-lg border border-cyan-200 bg-cyan-50/50 p-4">
        <h3 className="font-mono text-lg font-semibold text-slate-900 mb-4">
          Code Challenge
        </h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">
              Starter Code
            </div>
            <LazyCodeEditor
              initialCode={starterCode}
              language={language}
              filename={language === 'cpp' ? 'challenge.ino' : undefined}
              storageKey={storageKey}
              diffAgainst={solutionCode}
              diffTitle="Diff vs Solution"
              onChange={handleCodeChange}
            />
          </div>
          {solutionCode && (
            <div>
              <button
                onClick={() => {
                  setShowSolution(!showSolution)
                }}
                className="text-sm text-cyan-700 hover:text-cyan-600 font-medium"
                type="button"
              >
                {showSolution ? 'Hide Solution' : 'Show Solution'}
              </button>
              {showSolution && (
                <div className="mt-2">
                  <LazyCodeEditor
                    initialCode={solutionCode}
                    language={language}
                    filename={language === 'cpp' ? 'solution.ino' : undefined}
                    readOnly
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function LessonContent({
  content,
  contentBlocks,
  lessonType = 'content',
  videoUrl,
  codeStarter,
  codeSolution,
}: LessonContentProps) {
  const blocks = Array.isArray(contentBlocks) ? contentBlocks : []

  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  let checkboxIndex = 0
  const isCalloutVariant = (
    value: string,
  ): value is 'tip' | 'warning' | 'info' | 'danger' =>
    value === 'tip' ||
    value === 'warning' ||
    value === 'info' ||
    value === 'danger'

  const toggleCheckbox = useCallback((index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const getInlineCodeText = (value: React.ReactNode) => {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          typeof item === 'string' || typeof item === 'number'
            ? String(item)
            : '',
        )
        .join('')
    }
    return ''
  }

  const markdownComponents: Components = createMarkdownComponents(markdownStyles, {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    div: ({
      children,
      ...props
    }: ComponentPropsWithoutRef<'div'> & { 'data-callout'?: string }) => {
      const calloutType = props['data-callout']
      if (calloutType && isCalloutVariant(calloutType)) {
        return <Callout variant={calloutType}>{children}</Callout>
      }
      return <div {...props}>{children}</div>
    },
    code: ({ className, children }) => {
      const match = /language-(\w+)/.exec(className || '')
      const isInline = !match

      if (isInline) {
        return (
          <code className={inlineCodeClassName}>
            {getInlineCodeText(children)}
          </code>
        )
      }

      const language = match ? match[1] : 'text'
      const codeText =
        typeof children === 'string'
          ? children
          : Array.isArray(children)
            ? children.join('')
            : ''
      return (
        <CodeBlock code={codeText.replace(/\n$/, '')} language={language} />
      )
    },
    pre: ({ children }) => <>{children}</>,
    input: ({ type, checked, ...props }: ComponentPropsWithoutRef<'input'>) => {
      if (type === 'checkbox') {
        const index = checkboxIndex++
        const isChecked = checkedItems.has(index)

        return (
          <button
            type="button"
            role="checkbox"
            aria-checked={isChecked}
            onClick={() => {
              toggleCheckbox(index)
            }}
            className="inline-flex items-center justify-center w-5 h-5 mr-2 align-text-bottom rounded border border-slate-300 bg-white hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors cursor-pointer"
          >
            {isChecked ? (
              <CheckSquare className="w-4 h-4 text-cyan-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-300" />
            )}
          </button>
        )
      }
      return <input type={type} checked={checked} {...props} />
    },
  })

  const renderMarkdown = (markdown: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkDirective, remarkCallouts, remarkEmoji]}
      urlTransform={safeMarkdownUrlTransform}
      components={markdownComponents}
    >
      {markdown}
    </ReactMarkdown>
  )

  const renderBlocks = () => {
    return (
      <div className="space-y-8">
        {blocks.map((block, index) => {
          if (!isRecord(block)) return null
          const type = asString(block.type) || 'text'

          if (type === 'text') {
            const md = asString(block.content) || ''
            return (
              <article
                key={asString(block.id) || String(index)}
                className="prose prose-slate max-w-none"
              >
                {renderMarkdown(md)}
              </article>
            )
          }

          if (type === 'heading') {
            const level = asNumber(block.level) || 2
            const text = asString(block.content) || ''
            const Tag: 'h2' | 'h3' | 'h4' =
              level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4'
            const className =
              level === 1
                ? 'font-mono text-2xl text-slate-900 mt-8 mb-4'
                : level === 2
                  ? 'font-mono text-xl text-slate-900 mt-6 mb-3'
                  : 'font-mono text-lg text-slate-900 mt-4 mb-2'
            return (
              <Tag
                key={asString(block.id) || String(index)}
                className={className}
              >
                {text}
              </Tag>
            )
          }

          if (type === 'image') {
            const url = asString(block.url)
            if (!url) return null
            const resolvedUrl = resolveLearnAssetUrl(url)
            const alt = asString(block.alt) || ''
            const caption = asString(block.caption)
            return (
              <figure
                key={asString(block.id) || String(index)}
                className="my-6"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvedUrl}
                  alt={alt}
                  className="w-full rounded border border-slate-200 bg-white"
                  loading="lazy"
                />
                {caption && (
                  <figcaption className="text-xs text-slate-500 mt-2">
                    {caption}
                  </figcaption>
                )}
              </figure>
            )
          }

          if (type === 'video') {
            const url = asString(block.url)
            if (!url) return null
            const startTime = asNumber(block.startTime) || asNumber(block.start_time) || undefined
            // Parse chapters from block
            const rawChapters = Array.isArray(block.chapters) ? block.chapters : []
            const chapters: VideoChapter[] = rawChapters
              .filter((ch): ch is Record<string, unknown> => isRecord(ch))
              .map((ch) => ({
                time: asNumber(ch.time) || 0,
                title: asString(ch.title) || 'Chapter',
              }))
              .filter((ch) => ch.time >= 0)

            return (
              <VideoPlayer
                key={asString(block.id) || String(index)}
                url={url}
                startTime={startTime}
                chapters={chapters.length > 0 ? chapters : undefined}
              />
            )
          }

          if (type === 'code') {
            const code = asString(block.code) || ''
            const language = asString(block.language) || 'text'
            const filename = asString(block.filename) || undefined
            return (
              <div key={asString(block.id) || String(index)}>
                <CodeBlock
                  code={code}
                  language={language}
                  filename={filename}
                />
              </div>
            )
          }

          if (type === 'callout') {
            const variant = (asString(block.variant) || 'info') as
              | 'tip'
              | 'warning'
              | 'info'
              | 'danger'
            const md = asString(block.content) || ''
            return (
              <Callout
                key={asString(block.id) || String(index)}
                variant={variant}
              >
                {renderMarkdown(md)}
              </Callout>
            )
          }

          if (type === 'download') {
            const url = asString(block.url)
            if (!url) return null
            const resolvedUrl = resolveLearnAssetUrl(url)
            const filename = asString(block.filename) || 'Download'
            const description = asString(block.description)
            const ext = filename.split('.').pop()?.toLowerCase() || ''
            const fileTypeLabel =
              ext === 'ino'
                ? 'Arduino Sketch'
                : ext === 'pdf'
                  ? 'PDF Document'
                  : ext === 'stl'
                    ? '3D Model'
                    : ext === 'zip'
                      ? 'Archive'
                      : 'File'
            return (
              <div
                key={asString(block.id) || String(index)}
                className="rounded border border-slate-200 bg-white p-4 flex items-center gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded bg-cyan-50 flex items-center justify-center">
                  <Download className="w-6 h-6 text-cyan-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium text-slate-900 truncate">
                    {filename}
                  </p>
                  <p className="text-xs text-slate-500">{fileTypeLabel}</p>
                  {description && (
                    <p className="text-sm text-slate-600 mt-1">{description}</p>
                  )}
                </div>
                <a
                  href={resolvedUrl}
                  download={filename}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            )
          }

          if (type === 'quiz') {
            const question = asString(block.question) || 'Quiz'
            const options = Array.isArray(block.options)
              ? block.options.filter((o): o is string => typeof o === 'string')
              : []
            const correctAnswer =
              asNumber(block.correctAnswer) ?? asNumber(block.correct_answer)
            const blockId = asString(block.id) || `quiz-${index}`
            return (
              <QuizBlock
                key={blockId}
                question={question}
                options={options}
                correctAnswer={correctAnswer}
              />
            )
          }

          if (type === 'interactive_code') {
            const starter = asString(block.starterCode) || ''
            const solution = asString(block.solutionCode)
            const language = asString(block.language) || 'cpp'
            const blockId = asString(block.id) || `block-${index}`
            return (
              <CodeChallenge
                key={blockId}
                starterCode={starter}
                solutionCode={solution}
                language={language}
                storageKey={`learn:code:${blockId}`}
              />
            )
          }

          if (type === 'diagram') {
            const flowValue = isRecord(block.flowData)
              ? block.flowData
              : (block as unknown)
            return (
              <div key={asString(block.id) || String(index)} className="my-6">
                <LazyFlowViewer value={flowValue} />
              </div>
            )
          }

          if (type === 'visual_blocks') {
            const starterFlow = isRecord(block.flowData)
              ? block.flowData
              : (block as unknown)
            const solutionFlow = isRecord(block.solutionFlowData)
              ? block.solutionFlowData
              : isRecord(block.solution)
                ? block.solution
                : undefined
            return (
              <LazyVisualBlocksChallenge
                key={asString(block.id) || String(index)}
                starterFlow={starterFlow}
                solutionFlow={solutionFlow}
              />
            )
          }

          // Advanced content section (collapsible)
          if (type === 'advanced_section' || type === 'advanced') {
            const title = asString(block.title)
            const content = asString(block.content) || ''
            const defaultOpen = block.defaultOpen === true

            return (
              <AdvancedSection
                key={asString(block.id) || String(index)}
                title={title || undefined}
                defaultOpen={defaultOpen}
              >
                {renderMarkdown(content)}
              </AdvancedSection>
            )
          }

          // Alternative explanation
          if (type === 'alternative_explanation' || type === 'alternative') {
            const title = asString(block.title)
            const content = asString(block.content) || ''

            return (
              <AlternativeExplanation
                key={asString(block.id) || String(index)}
                title={title || undefined}
              >
                {renderMarkdown(content)}
              </AlternativeExplanation>
            )
          }

          return (
            <div
              key={asString(block.id) || String(index)}
              className="rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600"
            >
              Unsupported block type: <span className="font-mono">{type}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {blocks.length > 0 ? (
        renderBlocks()
      ) : (
        <>
          {videoUrl && <VideoPlayer url={videoUrl} />}
          <article className="prose prose-slate max-w-none">
            {renderMarkdown(content)}
          </article>
        </>
      )}

      {lessonType === 'code_challenge' &&
        codeStarter &&
        blocks.length === 0 && (
          <CodeChallenge
            starterCode={codeStarter}
            solutionCode={codeSolution}
          />
        )}
    </div>
  )
}
