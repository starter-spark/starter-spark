"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { ReactLenis } from "lenis/react"
import { ReactNode, useEffect } from "react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    // Only initialize PostHog if the key is available
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        // Capture pageviews automatically
        capture_pageview: true,
        // Capture pageleaves to measure time on page
        capture_pageleave: true,
        // Disable surveys to save ~30KB of JS
        disable_surveys: true,
        // Disable session recording to improve performance
        disable_session_recording: true,
        // Only enable in production
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") {
            posthog.debug()
          }
        },
      })
    }
  }, [])

  // Wrap content with Lenis for smooth scrolling (respects reduced motion)
  const content = prefersReducedMotion ? (
    children
  ) : (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2 }}>
      {children}
    </ReactLenis>
  )

  // If PostHog is not configured, just render with Lenis
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{content}</>
  }

  return <PostHogProvider client={posthog}>{content}</PostHogProvider>
}
