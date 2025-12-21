import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  debug: false,

  enabled: process.env.NODE_ENV === "production",

  // Capture unhandled errors globally
  integrations: [],
})
