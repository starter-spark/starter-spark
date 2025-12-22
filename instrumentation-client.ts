import * as Sentry from "@sentry/nextjs"

const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")

const sentryEnabled =
  process.env.NODE_ENV === "production" &&
  !!process.env.NEXT_PUBLIC_SENTRY_DSN &&
  process.env.NEXT_PUBLIC_SENTRY_DISABLED !== "1" &&
  process.env.NEXT_PUBLIC_E2E !== "1" &&
  !isLocalHost

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adds request headers and IP for users
  sendDefaultPii: true,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text content and block all media for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  debug: false,

  enabled: sentryEnabled,
})

// Export router transition capture for performance monitoring
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
