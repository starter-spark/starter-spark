import { Redis } from '@upstash/redis'

const hasUpstashConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
)

const redis = hasUpstashConfig ? Redis.fromEnv() : null

type GlobalCacheStore = typeof globalThis & {
  __startersparkCacheStore?: Map<string, { value: string; expiresAtMs: number }>
}

const memoryStore: Map<string, { value: string; expiresAtMs: number }> = (() => {
  const globalWithStore = globalThis as GlobalCacheStore
  if (!globalWithStore.__startersparkCacheStore) {
    globalWithStore.__startersparkCacheStore = new Map()
  }
  return globalWithStore.__startersparkCacheStore
})()

let lastMemoryCleanupMs = 0
function maybeCleanupMemoryStore(nowMs: number) {
  if (nowMs - lastMemoryCleanupMs < 60_000) return
  if (memoryStore.size < 1000) return

  for (const [key, entry] of memoryStore) {
    if (entry.expiresAtMs <= nowMs) memoryStore.delete(key)
  }
  lastMemoryCleanupMs = nowMs
}

function cacheKey(key: string) {
  return `starterspark:cache:${key}`
}

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const fullKey = cacheKey(key)

  if (redis) {
    const cached = await redis.get<string>(fullKey)
    if (!cached) return null
    try {
      return JSON.parse(cached) as T
    } catch {
      return null
    }
  }

  const nowMs = Date.now()
  maybeCleanupMemoryStore(nowMs)
  const entry = memoryStore.get(fullKey)
  if (!entry) return null
  if (entry.expiresAtMs <= nowMs) {
    memoryStore.delete(fullKey)
    return null
  }
  try {
    return JSON.parse(entry.value) as T
  } catch {
    memoryStore.delete(fullKey)
    return null
  }
}

export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const fullKey = cacheKey(key)
  const ttl = Math.max(1, Math.floor(ttlSeconds))
  const json = JSON.stringify(value)

  if (redis) {
    await redis.set(fullKey, json, { ex: ttl })
    return
  }

  const nowMs = Date.now()
  maybeCleanupMemoryStore(nowMs)
  memoryStore.set(fullKey, { value: json, expiresAtMs: nowMs + ttl * 1000 })
}

export async function cacheDelete(key: string): Promise<void> {
  const fullKey = cacheKey(key)

  if (redis) {
    await redis.del(fullKey)
    return
  }

  memoryStore.delete(fullKey)
}

export async function cacheWrapJson<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGetJson<T>(key)
  if (cached !== null) return cached

  const value = await compute()
  await cacheSetJson(key, value, ttlSeconds)
  return value
}

