"use client"

import Link from "next/link"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"

interface LessonNavigationProps {
  prevHref?: string | null
  nextHref: string
  isLastLesson: boolean
  lessonId: string
  progressStorageKey: string
  nextProgressPercent: number
}

function safeSessionStorageSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function shouldSendCompletion(event: React.MouseEvent<HTMLElement>): boolean {
  // Only send for a normal left click navigation (avoid new tab/window, etc.)
  if (event.defaultPrevented) return false
  if ("button" in event && event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  return true
}

export function LessonNavigation({
  prevHref,
  nextHref,
  isLastLesson,
  lessonId,
  progressStorageKey,
  nextProgressPercent,
}: LessonNavigationProps) {
  const markComplete = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (globalThis.window === undefined) return
      if (!shouldSendCompletion(event)) return

      safeSessionStorageSet(
        `${progressStorageKey}:pending`,
        JSON.stringify({
          lessonId,
          progress: nextProgressPercent,
          createdAt: Date.now(),
          attempts: 0,
        })
      )

      const payload = JSON.stringify({ lessonId })

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" })
        navigator.sendBeacon("/api/learn/complete", blob)
        return
      }

      void fetch("/api/learn/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // non-blocking best-effort
      })
    },
    [lessonId, nextProgressPercent, progressStorageKey]
  )

  return (
    <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-200">
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
            ? "bg-green-600 hover:bg-green-500 text-white font-mono"
            : "bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
        }
      >
        <Link href={nextHref} onClick={markComplete}>
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
  )
}
