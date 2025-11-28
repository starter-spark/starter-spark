// This file is used by Next.js to initialize instrumentation
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

import * as Sentry from "@sentry/nextjs"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }
}

// Capture errors from nested React Server Components (Next.js 15+)
export const onRequestError = Sentry.captureRequestError
