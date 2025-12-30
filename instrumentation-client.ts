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

  // Filter out browser extension and non-actionable errors
  beforeSend(event) {
    const errorMessage = event.exception?.values?.[0]?.value || ''
    const stackTrace = JSON.stringify(event.exception?.values?.[0]?.stacktrace || '')

    // Ignore CSP violations from browser extensions trying to use eval
    if (
      errorMessage.includes("'unsafe-eval'") ||
      errorMessage.includes('Content Security Policy')
    ) {
      return null
    }

    // Ignore errors from browser extensions (crypto wallets, ad blockers, etc.)
    if (
      stackTrace.includes('chrome-extension://') ||
      stackTrace.includes('moz-extension://') ||
      stackTrace.includes('backpack') ||
      stackTrace.includes('metamask') ||
      stackTrace.includes('phantom')
    ) {
      return null
    }

    // Ignore React DOM errors caused by extensions removing nodes
    // These happen when extensions modify the DOM and confuse React's reconciler
    if (
      errorMessage.includes("reading 'removeChild'") ||
      errorMessage.includes("reading 'insertBefore'") ||
      errorMessage.includes("reading 'appendChild'")
    ) {
      return null
    }

    // Ignore ResizeObserver errors (browser throttling, not actionable)
    if (errorMessage.includes('ResizeObserver')) {
      return null
    }

    return event
  },

  debug: false,

  enabled: sentryEnabled,
})

// Router transition spans
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
