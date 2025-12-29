'use client'

import { useState, useEffect } from 'react'

interface TocHeading {
  id: string
  text: string
  level: number
}

function generateAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Strip markdown formatting from text
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // **bold**
    .replace(/\*(.+?)\*/g, '$1')     // *italic*
    .replace(/__(.+?)__/g, '$1')     // __bold__
    .replace(/_(.+?)_/g, '$1')       // _italic_
    .replace(/`(.+?)`/g, '$1')       // `code`
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // [link](url)
    .replace(/\\([.!#\-*_`[\]()])/g, '$1') // escaped characters like \.
    .trim()
}

function extractHeadingsFromMarkdown(markdown: string): TocHeading[] {
  const headings: TocHeading[] = []
  // Match ## headings (h2) - these are the main sections in legal docs
  const regex = /^##\s+(.+)$/gm
  let match

  while ((match = regex.exec(markdown)) !== null) {
    const rawText = match[1].trim()
    const text = stripMarkdown(rawText)
    headings.push({
      id: generateAnchor(text),
      text,
      level: 2,
    })
  }

  return headings
}

interface MarkdownTableOfContentsProps {
  content: string
  className?: string
}

export function MarkdownTableOfContents({
  content,
  className = '',
}: MarkdownTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const headings = extractHeadingsFromMarkdown(content)

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    )

    // Observe all heading elements
    for (const heading of headings) {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    }

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) {
    return null
  }

  return (
    <nav aria-label="Table of contents" className={className}>
      <p className="font-mono text-xs font-medium text-slate-900 mb-3 uppercase tracking-wide">
        On this page
      </p>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`block text-sm transition-colors ${
                activeId === heading.id
                  ? 'text-cyan-700 font-medium'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Export the helper for use in markdown components
export { generateAnchor, extractHeadingsFromMarkdown }
