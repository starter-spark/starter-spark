'use client'

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ChevronLeft, ChevronRight, FastForward } from 'lucide-react'

interface LessonNavigationProps {
  prevHref?: string | null
  nextHref: string
  isLastLesson: boolean
  lessonId: string
  progressStorageKey: string
  nextProgressPercent: number
  completesCourse?: boolean
  showSkipButton?: boolean
}

function safeSessionStorageSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Ignore.
  }
}

function shouldSendCompletion(event: React.MouseEvent<HTMLElement>): boolean {
  // Only send for a normal left click navigation (avoid new tab/window, etc.)
  if (event.defaultPrevented) return false
  if ('button' in event && event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return false
  return true
}

// Same burst as a correct quiz answer
async function celebrate(target: HTMLElement | null) {
  const rect = target?.getBoundingClientRect()
  const origin = rect
    ? {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      }
    : { x: 0.5, y: 0.6 }
  // Load confetti only when someone finishes a course
  const { default: confetti } = await import('canvas-confetti')
  void confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 35,
    origin,
    colors: ['#0e7490', '#06b6d4', '#22d3ee', '#67e8f9', '#facc15'],
    disableForReducedMotion: true,
  })
}

export function LessonNavigation({
  prevHref,
  nextHref,
  isLastLesson,
  lessonId,
  progressStorageKey,
  nextProgressPercent,
  completesCourse = false,
  showSkipButton = true,
}: LessonNavigationProps) {
  const [isSkipping, setIsSkipping] = useState(false)
  const nextButtonRef = useRef<HTMLAnchorElement>(null)

  const markComplete = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (globalThis.window === undefined) return
      if (!shouldSendCompletion(event)) return

      // The confetti canvas lives on <body>, so it keeps playing after navigation
      if (completesCourse) void celebrate(nextButtonRef.current)

      safeSessionStorageSet(
        `${progressStorageKey}:pending`,
        JSON.stringify({
          lessonId,
          progress: nextProgressPercent,
          createdAt: Date.now(),
          attempts: 0,
        }),
      )

      const payload = JSON.stringify({ lessonId })

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon('/api/learn/complete', blob)
        return
      }

      void fetch('/api/learn/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Best-effort, non-blocking.
      })
    },
    [completesCourse, lessonId, nextProgressPercent, progressStorageKey],
  )

  const handleSkip = useCallback(async () => {
    setIsSkipping(true)
    try {
      // Mark as complete via API
      await fetch('/api/learn/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      })
      if (completesCourse) {
        // A full page load would clear the confetti, so let it play first
        await celebrate(nextButtonRef.current)
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }
      // Navigate to next lesson
      window.location.href = nextHref
    } catch {
      setIsSkipping(false)
    }
  }, [completesCourse, lessonId, nextHref])

  return (
    <div className="mt-12 pt-8 border-t border-slate-200">
      {/* Skip button */}
      {showSkipButton && !isLastLesson && (
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={() => void handleSkip()}
            disabled={isSkipping}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <FastForward className="w-4 h-4" />
            {isSkipping ? 'Skipping...' : 'I already know this — skip ahead'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        {prevHref ? (
          <Link
            href={prevHref}
            className="flex items-center gap-2 text-slate-600 hover:text-cyan-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Link>
        ) : (
          <div />
        )}

        <Button
          asChild
          className={
            isLastLesson
              ? 'bg-green-600 hover:bg-green-500 text-white font-mono'
              : 'bg-cyan-700 hover:bg-cyan-600 text-white font-mono'
          }
        >
          <Link ref={nextButtonRef} href={nextHref} onClick={markComplete}>
            {isLastLesson ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Course
              </>
            ) : (
              <>
                Next Lesson
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Link>
        </Button>
      </div>
    </div>
  )
}
