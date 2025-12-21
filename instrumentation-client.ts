import * as Sentry from "@sentry/nextjs"

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

  enabled: process.env.NODE_ENV === "production",
})

// Export router transition capture for performance monitoring
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
