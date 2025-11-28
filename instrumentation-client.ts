import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adds request headers and IP for users
  sendDefaultPii: true,

  // Performance monitoring - 10% in production, 100% in development
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay - 10% of sessions, 100% of sessions with errors
  // Recommended for low-medium traffic sites
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text content and block all media for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Disable debug logging in production
  debug: false,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
})

// Export router transition capture for performance monitoring
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
