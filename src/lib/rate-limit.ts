import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

// Check if we're in a test/development/local environment
const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.CI === "true"
const isDevelopment = process.env.NODE_ENV === "development"
const isLocalhost = process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost")

// Validate Upstash configuration at startup
const hasUpstashConfig = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

if (!hasUpstashConfig && !isDevelopment && !isTestEnvironment) {
  console.warn(
    "⚠️  UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured. " +
    "Rate limiting will be disabled."
  )
}

// Determine if we should use lenient rate limiting
const useLenientRateLimiting = isTestEnvironment || isDevelopment || isLocalhost

// Create Upstash rate limiter (only if configured)
const ratelimit = hasUpstashConfig
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      // Much higher limit for local/test environments (100 vs 10 per minute)
      limiter: Ratelimit.slidingWindow(useLenientRateLimiting ? 100 : 10, "1 m"),
      analytics: true,
      prefix: "starterspark",
    })
  : null

// Rate limit configurations for different endpoints
// More lenient in development/test/local environments
const multiplier = isTestEnvironment || isDevelopment || isLocalhost ? 10 : 1
export const rateLimitConfigs = {
  // Sensitive endpoints - stricter limits (but more lenient in test)
  claimLicense: { requests: 5 * multiplier, window: "1 m" as const },
  claimByToken: { requests: 5 * multiplier, window: "1 m" as const },
  checkout: { requests: 10 * multiplier, window: "1 m" as const },
  // Admin actions - moderate limits
  adminMutation: { requests: 20 * multiplier, window: "1 m" as const },
  // General API - more permissive
  default: { requests: 30 * multiplier, window: "1 m" as const },
}

type RateLimitConfig = keyof typeof rateLimitConfigs

/**
 * Rate limit a request using Upstash Redis
 * @param request - The incoming request
 * @param configKey - Which rate limit config to use
 * @returns null if allowed, NextResponse if rate limited
 */
export async function rateLimit(
  request: Request,
  configKey: RateLimitConfig = "default"
): Promise<NextResponse | null> {
  // Skip rate limiting if Upstash is not configured
  if (!ratelimit) {
    return null
  }

  // Get identifier (IP address or fallback)
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() ?? "127.0.0.1"
  const identifier = `${configKey}:${ip}`

  const config = rateLimitConfigs[configKey]

  try {
    const { success, reset } = await ratelimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": config.requests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          }
        }
      )
    }
  } catch (error) {
    // If rate limiting fails (e.g., Redis connection issue), allow the request
    // but log the error for monitoring
    console.error("Rate limiting error:", error)
  }

  return null
}

/**
 * Create rate limit headers for successful requests
 */
export function rateLimitHeaders(configKey: RateLimitConfig = "default"): HeadersInit {
  const config = rateLimitConfigs[configKey]
  return {
    "X-RateLimit-Limit": config.requests.toString(),
  }
}

/**
 * Rate limit for server actions (without Request object)
 * @param identifier - Unique identifier (e.g., user ID)
 * @param configKey - Which rate limit config to use
 * @returns Object with success boolean and error message if rate limited
 */
export async function rateLimitAction(
  identifier: string,
  configKey: RateLimitConfig = "adminMutation"
): Promise<{ success: boolean; error?: string }> {
  // Skip rate limiting if Upstash is not configured
  if (!ratelimit) {
    return { success: true }
  }

  const key = `${configKey}:${identifier}`

  try {
    const { success, reset } = await ratelimit.limit(key)

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return {
        success: false,
        error: `Too many requests. Please try again in ${retryAfter} seconds.`,
      }
    }

    return { success: true }
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    console.error("Rate limiting error:", error)
    return { success: true }
  }
}
