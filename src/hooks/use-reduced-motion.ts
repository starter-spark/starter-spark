import { useEffect, useState } from 'react'

function getInitialPrefersReducedMotion(): boolean {
  if (globalThis.window === undefined || globalThis.matchMedia === undefined) {
    return false
  }
  return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Hook to detect if the user prefers reduced motion.
 * Respects the prefers-reduced-motion media query for accessibility.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getInitialPrefersReducedMotion,
  )

  useEffect(() => {
    if (
      globalThis.window === undefined ||
      globalThis.matchMedia === undefined
    ) {
      return
    }

    const mediaQuery = globalThis.matchMedia('(prefers-reduced-motion: reduce)')

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  return prefersReducedMotion
}
