"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-2xl font-mono text-slate-900">Something went wrong!</h2>
          <p className="text-slate-600">{error.message}</p>
          <button
            onClick={() => { reset(); }}
            className="px-4 py-2 bg-cyan-700 text-white rounded hover:bg-cyan-600"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
