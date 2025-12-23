import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Avoid implicit 308 redirects on trailing slashes
  skipTrailingSlashRedirect: true,

  // Remove X-Powered-By header
  poweredByHeader: false,

  // Expose non-secret config to the browser bundle
  env: {
    // Backwards compatible: prefer SUPABASE_URL, fallback to NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  },

  // Image optimization
  images: {
    // Enable modern image formats
    formats: ["image/avif", "image/webp"],
    // Restrict to a small, known set of qualities used in the app
    qualities: [20, 75, 80, 90, 95, 100],
    // Allow placeholder images from external sources if needed
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental features for performance
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: ["lucide-react", "motion/react", "@react-three/drei"],
  },

  // Headers for caching static assets and security
  headers() {
    // Security headers applied to all routes
    const securityHeaders = [
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ]
    const apiCspHeader = {
      key: "Content-Security-Policy",
      value: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    }
    const htmlContentTypeHeader = {
      key: "Content-Type",
      value: "text/html; charset=utf-8",
    }
    const jsonContentTypeHeader = {
      key: "Content-Type",
      value: "application/json; charset=utf-8",
    }

    return Promise.resolve([
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Ensure the API root always returns a CSP + JSON content type
        source: "/api",
        headers: [apiCspHeader, jsonContentTypeHeader],
      },
      {
        // Normalize trailing slash API probes with a CSP + content type
        source: "/api/",
        headers: [apiCspHeader, jsonContentTypeHeader],
      },
      {
        // Apply a strict CSP to API routes (JSON responses)
        source: "/api/:path*",
        headers: [apiCspHeader],
      },
      {
        // Ensure CSP is present on the Sentry tunnel route
        source: "/monitoring",
        headers: [apiCspHeader],
      },
      {
        // Ensure HTML content type for common probes (avoids empty Content-Type on redirects)
        source: "/auth/:path*",
        headers: [htmlContentTypeHeader],
      },
      {
        // Ensure HTML content type for common probes (avoids empty Content-Type on redirects)
        source: "/checkout/:path*",
        headers: [htmlContentTypeHeader],
      },
      {
        // Ensure HTML content type for common probes (avoids empty Content-Type on redirects)
        source: "/claim/:path*",
        headers: [htmlContentTypeHeader],
      },
      {
        // Cache static assets for 1 year
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache fonts for 1 year
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache 3D models for 1 year
        source: "/:path*.glb",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ])
  },

  rewrites() {
    return [
      {
        source: "/api/",
        destination: "/api",
      },
    ]
  },
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
