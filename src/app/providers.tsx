"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { ReactNode, useEffect } from "react"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Only initialize PostHog if the key is available
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        // Capture pageviews automatically
        capture_pageview: true,
        // Capture pageleaves to measure time on page
        capture_pageleave: true,
        // Only enable in production
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") {
            posthog.debug()
          }
        },
      })
    }
  }, [])

  // If PostHog is not configured, just render children
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
