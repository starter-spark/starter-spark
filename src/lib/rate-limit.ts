import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const isDevelopment = process.env.NODE_ENV === 'development'
const isLocalhost = process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost')

const hasUpstashConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)
const redis = hasUpstashConfig ? Redis.fromEnv() : null
const upstashLimiters = new Map<RateLimitConfig, Ratelimit>()

const multiplier = isDevelopment || isLocalhost ? 10 : 1
export const rateLimitConfigs = {
  // Sensitive
  claimLicense: { requests: 5 * multiplier, window: '1 m' as const },
  claimByToken: { requests: 5 * multiplier, window: '1 m' as const },
  checkout: { requests: 10 * multiplier, window: '1 m' as const },
  contactUpload: { requests: 5 * multiplier, window: '1 m' as const },
  contactForm: { requests: 5 * multiplier, window: '1 m' as const },
  supportFeedback: { requests: 20 * multiplier, window: '1 m' as const },
  newsletter: { requests: 10 * multiplier, window: '1 m' as const },
  ogImage: { requests: 60 * multiplier, window: '1 m' as const },
  siteBanners: { requests: 60 * multiplier, window: '1 m' as const },
  // Community
  communityVote: { requests: 30 * multiplier, window: '1 m' as const },
  communityReport: { requests: 5 * multiplier, window: '10 m' as const },
  communityPost: { requests: 3 * multiplier, window: '10 m' as const },
  communityAnswer: { requests: 10 * multiplier, window: '10 m' as const },
  // Assets
  certificate: { requests: 10 * multiplier, window: '10 m' as const },
  learnAsset: { requests: 120 * multiplier, window: '1 m' as const },
  // Admin
  adminMutation: { requests: 20 * multiplier, window: '1 m' as const },
  learnUpload: { requests: 10 * multiplier, window: '1 m' as const },
  // Profile
  profileUpdate: { requests: 10 * multiplier, window: '1 m' as const },
  accountDelete: { requests: 3 * multiplier, window: '1 h' as const },
  // Misc
  teapot: { requests: 1 * multiplier, window: '5 s' as const },
  default: { requests: 30 * multiplier, window: '1 m' as const },
}

type RateLimitConfig = keyof typeof rateLimitConfigs

function getRateLimitConfig(configKey: RateLimitConfig) {
  switch (configKey) {
    case 'claimLicense':
      return rateLimitConfigs.claimLicense
    case 'claimByToken':
      return rateLimitConfigs.claimByToken
    case 'checkout':
      return rateLimitConfigs.checkout
    case 'contactUpload':
      return rateLimitConfigs.contactUpload
    case 'contactForm':
      return rateLimitConfigs.contactForm
    case 'supportFeedback':
      return rateLimitConfigs.supportFeedback
    case 'newsletter':
      return rateLimitConfigs.newsletter
    case 'ogImage':
      return rateLimitConfigs.ogImage
    case 'siteBanners':
      return rateLimitConfigs.siteBanners
    case 'communityVote':
      return rateLimitConfigs.communityVote
    case 'communityReport':
      return rateLimitConfigs.communityReport
    case 'communityPost':
      return rateLimitConfigs.communityPost
    case 'communityAnswer':
      return rateLimitConfigs.communityAnswer
    case 'certificate':
      return rateLimitConfigs.certificate
    case 'learnAsset':
      return rateLimitConfigs.learnAsset
    case 'adminMutation':
      return rateLimitConfigs.adminMutation
    case 'learnUpload':
      return rateLimitConfigs.learnUpload
    case 'profileUpdate':
      return rateLimitConfigs.profileUpdate
    case 'accountDelete':
      return rateLimitConfigs.accountDelete
    case 'teapot':
      return rateLimitConfigs.teapot
    case 'default':
      return rateLimitConfigs.default
    default: {
      const exhaustiveCheck: never = configKey
      return exhaustiveCheck
    }
  }
}

function parseWindowToMs(window: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(window.trim())
  if (!match) return 60_000

  const value = Number.parseInt(match[1], 10)
  if (!Number.isFinite(value) || value <= 0) return 60_000

  const unit = match[2].toLowerCase()
  switch (unit) {
    case 'ms':
      return value
    case 's':
      return value * 1000
    case 'm':
      return value * 60_000
    case 'h':
      return value * 3_600_000
    case 'd':
      return value * 86_400_000
    default:
      return 60_000
  }
}

function getClientIp(request: Request): string {
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp.trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim()
  return ip || '127.0.0.1'
}

interface MemoryRateLimitEntry {
  count: number
  reset: number
}

type GlobalRateLimitStore = typeof globalThis & {
  __startersparkRateLimitStore?: Map<string, MemoryRateLimitEntry>
}

const memoryStore: Map<string, MemoryRateLimitEntry> = (() => {
  const globalWithStore = globalThis as GlobalRateLimitStore
  if (!globalWithStore.__startersparkRateLimitStore) {
    globalWithStore.__startersparkRateLimitStore = new Map<
      string,
      MemoryRateLimitEntry
    >()
  }
  return globalWithStore.__startersparkRateLimitStore
})()

let lastMemoryCleanupMs = 0
function maybeCleanupMemoryStore(nowMs: number) {
  if (nowMs - lastMemoryCleanupMs < 60_000) return
  if (memoryStore.size < 1000) return

  for (const [key, entry] of memoryStore) {
    if (entry.reset <= nowMs) {
      memoryStore.delete(key)
    }
  }
  lastMemoryCleanupMs = nowMs
}

function getUpstashLimiter(configKey: RateLimitConfig): Ratelimit | null {
  if (!redis) return null

  const existing = upstashLimiters.get(configKey)
  if (existing) return existing

  const config = getRateLimitConfig(configKey)
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: 'starterspark',
  })
  upstashLimiters.set(configKey, limiter)
  return limiter
}

export async function rateLimit(
  request: Request,
  configKey: RateLimitConfig = 'default',
): Promise<NextResponse | null> {
  const config = getRateLimitConfig(configKey)
  const ip = getClientIp(request)
  const identifier = `${configKey}:${ip}`

  try {
    const upstashLimiter = getUpstashLimiter(configKey)

    if (upstashLimiter) {
      const { success, reset, limit } = await upstashLimiter.limit(identifier)

      if (!success) {
        const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
        return NextResponse.json(
          {
            error: 'Too many requests. Please try again later.',
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': retryAfter.toString(),
            },
          },
        )
      }

      return null
    }

    const nowMs = Date.now()
    maybeCleanupMemoryStore(nowMs)

    const windowMs = parseWindowToMs(config.window)
    const existing = memoryStore.get(identifier)

    if (!existing || existing.reset <= nowMs) {
      memoryStore.set(identifier, { count: 1, reset: nowMs + windowMs })
      return null
    }

    if (existing.count >= config.requests) {
      const retryAfter = Math.max(0, Math.ceil((existing.reset - nowMs) / 1000))
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': existing.reset.toString(),
            'Retry-After': retryAfter.toString(),
          },
        },
      )
    }

    existing.count += 1
    memoryStore.set(identifier, existing)
  } catch (error) {
    console.error('Rate limiting error:', error)
  }

  return null
}

export function rateLimitHeaders(
  configKey: RateLimitConfig = 'default',
): HeadersInit {
  const config = getRateLimitConfig(configKey)
  return {
    'X-RateLimit-Limit': config.requests.toString(),
  }
}

export async function rateLimitAction(
  identifier: string,
  configKey: RateLimitConfig = 'adminMutation',
): Promise<{ success: boolean; error: string | null }> {
  const key = `${configKey}:${identifier}`
  const config = getRateLimitConfig(configKey)

  try {
    const upstashLimiter = getUpstashLimiter(configKey)
    if (upstashLimiter) {
      const { success, reset } = await upstashLimiter.limit(key)

      if (!success) {
        const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
        return {
          success: false,
          error: `Too many requests. Please try again in ${String(retryAfter)} seconds.`,
        }
      }

      return { success: true, error: null }
    }

    const nowMs = Date.now()
    maybeCleanupMemoryStore(nowMs)

    const windowMs = parseWindowToMs(config.window)
    const existing = memoryStore.get(key)

    if (!existing || existing.reset <= nowMs) {
      memoryStore.set(key, { count: 1, reset: nowMs + windowMs })
      return { success: true, error: null }
    }

    if (existing.count >= config.requests) {
      const retryAfter = Math.max(0, Math.ceil((existing.reset - nowMs) / 1000))
      return {
        success: false,
        error: `Too many requests. Please try again in ${String(retryAfter)} seconds.`,
      }
    }

    existing.count += 1
    memoryStore.set(key, existing)
    return { success: true, error: null }
  } catch (error) {
    console.error('Rate limiting error:', error)
    return { success: true, error: null }
  }
}
