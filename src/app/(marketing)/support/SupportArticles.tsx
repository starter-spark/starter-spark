'use client'

import { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Wrench,
  Cpu,
  Code,
  User,
  Truck,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Article {
  id: string
  slug: string
  category: string
  title: string
  problem: string
  causes: string[] | null
  solutions: string
  view_count: number | null
  helpful_count: number | null
  not_helpful_count: number | null
}

interface Category {
  key: string
  label: string
  icon: string
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  assembly: <Wrench className="w-5 h-5" />,
  electronics: <Cpu className="w-5 h-5" />,
  software: <Code className="w-5 h-5" />,
  account: <User className="w-5 h-5" />,
  shipping: <Truck className="w-5 h-5" />,
  general: <HelpCircle className="w-5 h-5" />,
}

interface SupportArticlesProps {
  articlesByCategory: Record<string, Article[]>
  categories: readonly Category[]
}

export function SupportArticles({
  articlesByCategory,
  categories,
}: SupportArticlesProps) {
  const [openArticle, setOpenArticle] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<
    Record<string, 'helpful' | 'not_helpful'>
  >({})

  const handleFeedback = async (articleId: string, isHelpful: boolean) => {
    // Optimistic update
    setFeedback((prev) => ({
      ...prev,
      [articleId]: isHelpful ? 'helpful' : 'not_helpful',
    }))

    // Call RPC function to record feedback
    try {
      await fetch('/api/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, isHelpful }),
      })
    } catch {
      // Silently fail, feedback is non-critical.
    }
  }

  const categoriesWithArticles = categories.filter(
    (cat) => articlesByCategory[cat.key]?.length > 0,
  )

  if (categoriesWithArticles.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <p className="text-slate-600">
          No troubleshooting articles available yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {categoriesWithArticles.map((category) => (
        <div key={category.key}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center text-cyan-700">
              {CATEGORY_ICONS[category.key]}
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {category.label}
            </h3>
          </div>

          <div className="space-y-3">
            {articlesByCategory[category.key].map((article) => (
              <Collapsible
                key={article.id}
                open={openArticle === article.id}
                onOpenChange={(open) => {
                  setOpenArticle(open ? article.id : null)
                }}
              >
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-medium text-slate-900">
                        {article.title}
                      </h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {article.problem}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-4',
                        openArticle === article.id && 'transform rotate-180',
                      )}
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-5 pb-5 border-t border-slate-100">
                      {/* Causes */}
                      {article.causes && article.causes.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-slate-700 mb-2">
                            Possible Causes
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                            {article.causes.map((cause, i) => (
                              <li key={i}>{cause}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Solutions */}
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-slate-700 mb-2">
                          Solutions
                        </h5>
                        <SolutionsContent content={article.solutions} />
                      </div>

                      {/* Feedback */}
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="text-sm text-slate-600 mb-3">
                          Was this helpful?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              void handleFeedback(article.id, true)
                            }
                            disabled={!!feedback[article.id]}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                              feedback[article.id] === 'helpful'
                                ? 'bg-emerald-100 text-emerald-700'
                                : feedback[article.id]
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700',
                            )}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Yes
                          </button>
                          <button
                            onClick={() =>
                              void handleFeedback(article.id, false)
                            }
                            disabled={!!feedback[article.id]}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                              feedback[article.id] === 'not_helpful'
                                ? 'bg-red-100 text-red-700'
                                : feedback[article.id]
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700',
                            )}
                          >
                            <ThumbsDown className="w-4 h-4" />
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Safe component-based markdown rendering
function SolutionsContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeContent: string[] = []
  let listItems: string[] = []
  let listType: 'ol' | 'ul' | null = null

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType
      elements.push(
        <ListTag
          key={elements.length}
          className={cn(
            'my-2 space-y-1',
            listType === 'ul'
              ? 'list-disc list-inside'
              : 'list-decimal list-inside',
          )}
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-slate-600">
              {formatInlineText(item)}
            </li>
          ))}
        </ListTag>,
      )
      listItems = []
      listType = null
    }
  }

  for (const line of lines) {
    // Code block start/end
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre
            key={elements.length}
            className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs my-3"
          >
            <code>{codeContent.join('\n')}</code>
          </pre>,
        )
        codeContent = []
        inCodeBlock = false
      } else {
        // Start code block
        flushList()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeContent.push(line)
      continue
    }

    // Headers
    if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2
          key={elements.length}
          className="text-base font-semibold text-slate-900 mt-4 mb-2"
        >
          {line.slice(3)}
        </h2>,
      )
      continue
    }

    if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3
          key={elements.length}
          className="text-sm font-semibold text-slate-800 mt-3 mb-1"
        >
          {line.slice(4)}
        </h3>,
      )
      continue
    }

    // Numbered list
    const numberedMatch = /^(\d+)\. (.+)$/.exec(line)
    if (numberedMatch) {
      if (listType !== 'ol') {
        flushList()
        listType = 'ol'
      }
      listItems.push(numberedMatch[2])
      continue
    }

    // Bullet list
    if (line.startsWith('- ')) {
      if (listType !== 'ul') {
        flushList()
        listType = 'ul'
      }
      listItems.push(line.slice(2))
      continue
    }

    // Regular paragraph
    if (line.trim()) {
      flushList()
      elements.push(
        <p key={elements.length} className="text-sm text-slate-600 my-2">
          {formatInlineText(line)}
        </p>,
      )
    }
  }

  flushList()

  return <div className="space-y-1">{elements}</div>
}

// Format inline text (bold, code)
function formatInlineText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Check for inline code
    const codeMatch = /^(.*?)`([^`]+)`(.*)$/.exec(remaining)
    if (codeMatch) {
      if (codeMatch[1]) {
        parts.push(...formatBold(codeMatch[1], key))
        key += 10
      }
      parts.push(
        <code
          key={key++}
          className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs"
        >
          {codeMatch[2]}
        </code>,
      )
      remaining = codeMatch[3]
      continue
    }

    // No more inline code, format bold and add rest
    parts.push(...formatBold(remaining, key))
    break
  }

  return parts.length === 1 ? parts[0] : parts
}

function formatBold(text: string, startKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = startKey

  while (remaining.length > 0) {
    const boldMatch = /^(.*?)\*\*([^*]+)\*\*(.*)$/.exec(remaining)
    if (boldMatch) {
      if (boldMatch[1]) {
        parts.push(<span key={key++}>{boldMatch[1]}</span>)
      }
      parts.push(<strong key={key++}>{boldMatch[2]}</strong>)
      remaining = boldMatch[3]
      continue
    }

    if (remaining) {
      parts.push(<span key={key++}>{remaining}</span>)
    }
    break
  }

  return parts
}
