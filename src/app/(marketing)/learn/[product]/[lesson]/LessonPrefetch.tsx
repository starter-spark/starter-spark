"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface LessonPrefetchProps {
  hrefs: string[]
}

export function LessonPrefetch({ hrefs }: LessonPrefetchProps) {
  const router = useRouter()

  useEffect(() => {
    if (globalThis.window === undefined) return
    if (hrefs.length === 0) return

    const connection = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection
    if (connection?.saveData) return
    if (connection?.effectiveType?.includes('2g')) return

    const run = () => {
      for (const href of hrefs) {
        if (href) router.prefetch(href)
      }
    }

    const requestIdleCallback = (
      globalThis as unknown as {
        requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
      }
    ).requestIdleCallback
    const cancelIdleCallback = (
      globalThis as unknown as { cancelIdleCallback?: (handle: number) => void }
    ).cancelIdleCallback

    if (typeof requestIdleCallback === "function" && typeof cancelIdleCallback === "function") {
      const handle = requestIdleCallback((_deadline) => {
        void _deadline
        run()
      }, { timeout: 1500 })
      return () => { cancelIdleCallback(handle); }
    }

    const timeout = globalThis.setTimeout(run, 800)
    return () => { globalThis.clearTimeout(timeout); }
  }, [router, hrefs])

  return null
}
