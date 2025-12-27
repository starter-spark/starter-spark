import * as Sentry from '@sentry/nextjs'

const sentryEnabled =
  process.env.NODE_ENV === 'production' &&
  !!process.env.NEXT_PUBLIC_SENTRY_DSN &&
  process.env.NEXT_PUBLIC_SENTRY_DISABLED !== '1'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  debug: false,

  enabled: sentryEnabled,

  // Capture unhandled errors globally
  integrations: [],
})
