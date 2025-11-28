import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  /* config options here */
}

// Sentry configuration for error monitoring
const sentryConfig = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for source map uploads (set via SENTRY_AUTH_TOKEN env var)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Source map configuration - delete after upload to hide from client
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Automatically instrument React components with Sentry
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests through Next.js to circumvent ad-blockers
  // Uses a random route per build for better evasion
  tunnelRoute: "/monitoring",
})

export default sentryConfig
