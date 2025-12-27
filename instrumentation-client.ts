import * as Sentry from '@sentry/nextjs'

const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

const sentryEnabled =
  process.env.NODE_ENV === 'production' &&
  !!process.env.NEXT_PUBLIC_SENTRY_DSN &&
  process.env.NEXT_PUBLIC_SENTRY_DISABLED !== '1' &&
  !isLocalHost

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Include IP and request headers
  sendDefaultPii: true,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,

  integrations: [
    Sentry.replayIntegration({
      // Mask text and block media
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  debug: false,

  enabled: sentryEnabled,
})

// Router transition spans
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
