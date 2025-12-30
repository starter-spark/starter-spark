'use client'

import { useEffect, useState } from 'react'
import type { PageBlock } from '@/types/page-blocks'
import { extractHeadings } from '@/types/page-blocks'
import { cn } from '@/lib/utils'

interface TableOfContentsProps {
  blocks: PageBlock[]
  className?: string
}

export function TableOfContents({ blocks, className }: TableOfContentsProps) {
  const headings = extractHeadings(blocks)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting (visible)
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)
        if (visibleEntries.length > 0) {
          // Sort by their position in the document
          visibleEntries.sort((a, b) => {
            const aRect = a.boundingClientRect
            const bRect = b.boundingClientRect
            return aRect.top - bRect.top
          })
          setActiveId(visibleEntries[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      },
    )

    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.anchor)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [headings])

  if (headings.length === 0) {
    return null
  }

  const handleClick = (anchor: string) => {
    const element = document.getElementById(anchor)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav className={cn('space-y-1', className)} aria-label="Table of contents">
      <p className="font-mono text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        On this page
      </p>
      <ul className="space-y-1">
        {headings.map((heading) => {
          const isActive = activeId === heading.anchor
          const indentClass =
            heading.level === 2 ? 'pl-3' : heading.level === 3 ? 'pl-6' : ''

          return (
            <li key={heading.id}>
              <button
                onClick={() => handleClick(heading.anchor)}
                className={cn(
                  'block w-full text-left text-sm py-1 px-2 rounded transition-colors',
                  indentClass,
                  isActive
                    ? 'text-cyan-700 bg-cyan-50 font-medium'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                )}
                type="button"
              >
                {heading.content}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
