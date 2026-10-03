'use client'

import { useEffect } from 'react'

/**
 * Scrolls to the element named in the URL hash once the page has rendered.
 * The browser's own jump fires while the loading skeleton is showing, so
 * links like /learn/robot-car#course-<id> otherwise land at the top.
 */
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(globalThis.location.hash.slice(1))
    if (!id) return
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView()
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
