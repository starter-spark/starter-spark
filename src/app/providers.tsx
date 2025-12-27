'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { ReactLenis } from 'lenis/react'
import { MotionConfig } from 'motion/react'
import { type ReactNode, useEffect } from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { usePathname } from 'next/navigation'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const prefersReducedMotion = useReducedMotion()
  const pathname = usePathname()
  const disableSmoothScroll =
    pathname.startsWith('/admin') || pathname.startsWith('/learn')

  useEffect(() => {
    if (!prefersReducedMotion && !disableSmoothScroll) return

    const html = document.documentElement
    const body = document.body

    html.classList.remove(
      'lenis',
      'lenis-smooth',
      'lenis-scrolling',
      'lenis-stopped',
    )
    body.classList.remove('lenis')

    const resetStyles = (el: HTMLElement) => {
      for (const prop of [
        'overflow',
        'overflow-x',
        'overflow-y',
        'height',
        'width',
        'position',
        'top',
        'right',
        'bottom',
        'left',
        'transform',
        'will-change',
        'scroll-behavior',
      ]) {
        el.style.removeProperty(prop)
      }
    }

    resetStyles(html)
    resetStyles(body)
  }, [disableSmoothScroll, prefersReducedMotion])

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
        disable_surveys: true,
        disable_session_recording: true,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.debug()
          }
        },
      })
    }
  }, [])

  const content =
    prefersReducedMotion || disableSmoothScroll ? (
      children
    ) : (
      <ReactLenis root options={{ lerp: 0.1, duration: 1.2 }}>
        {children}
      </ReactLenis>
    )

  const wrappedContent = prefersReducedMotion ? (
    <MotionConfig reducedMotion="always">{content}</MotionConfig>
  ) : (
    content
  )

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{wrappedContent}</>
  }

  return <PostHogProvider client={posthog}>{wrappedContent}</PostHogProvider>
}
