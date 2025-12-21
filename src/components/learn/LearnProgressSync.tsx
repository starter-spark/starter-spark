"use client"

import { useEffect } from "react"

type PendingLessonCompletion = {
  lessonId: string
  progress?: number
  createdAt?: number
  attempts?: number
}

const pendingSuffix = ":pending"

function safeSessionStorageGet(key: string): string | null {
  if (globalThis.window === undefined) return null
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSessionStorageSet(key: string, value: string) {
  if (globalThis.window === undefined) return
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function safeSessionStorageRemove(key: string) {
  if (globalThis.window === undefined) return
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function pendingKeysForUser(userId: string): string[] {
  if (globalThis.window === undefined) return []

  const prefix = `learn:${userId}:course:`
  const suffix = `:progress${pendingSuffix}`
  const keys: string[] = []

  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (!key) continue
      if (!key.startsWith(prefix)) continue
      if (!key.endsWith(suffix)) continue
      keys.push(key)
    }
  } catch {
    return []
  }

  return keys
}

function parsePending(raw: string | null): PendingLessonCompletion | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    const record = parsed as Record<string, unknown>
    const lessonId = record.lessonId
    if (typeof lessonId !== "string" || lessonId.length === 0) return null
    const createdAt =
      typeof record.createdAt === "number" && Number.isFinite(record.createdAt)
        ? record.createdAt
        : undefined
    const attempts =
      typeof record.attempts === "number" && Number.isFinite(record.attempts)
        ? record.attempts
        : undefined
    const progress =
      typeof record.progress === "number" && Number.isFinite(record.progress)
        ? record.progress
        : undefined

    return { lessonId, createdAt, attempts, progress }
  } catch {
    return null
  }
}

function backoffMs(attempts: number): number {
  const base = 1000 * Math.pow(2, Math.min(attempts, 5))
  return Math.min(30_000, Math.max(1000, base))
}

async function postCompletion(lessonId: string): Promise<Response> {
  return fetch("/api/learn/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lessonId }),
    keepalive: true,
  })
}

async function syncPendingKey(pendingKey: string, signal: AbortSignal): Promise<void> {
  const raw = safeSessionStorageGet(pendingKey)
  const pending = parsePending(raw)
  if (!pending) return

  const now = Date.now()
  const ageMs = typeof pending.createdAt === "number" ? now - pending.createdAt : 0
  const attempts = pending.attempts ?? 0

  // Too old or too many retries -> clear to avoid permanent UI drift.
  if (ageMs > 24 * 60 * 60 * 1000 || attempts >= 5) {
    safeSessionStorageRemove(pendingKey)
    return
  }

  let response: Response
  try {
    response = await postCompletion(pending.lessonId)
  } catch {
    // Network error: retry later.
    const next = { ...pending, attempts: attempts + 1 }
    safeSessionStorageSet(pendingKey, JSON.stringify(next))
    await new Promise<void>((resolve) => {
      const id = globalThis.setTimeout(resolve, backoffMs(attempts))
      signal.addEventListener("abort", () => { globalThis.clearTimeout(id); }, { once: true })
    })
    return
  }

  if (signal.aborted) return

  if (response.status === 204 || response.ok) {
    safeSessionStorageRemove(pendingKey)
    return
  }

  // Non-retryable: stale payload or removed lesson.
  if (response.status === 400 || response.status === 404) {
    safeSessionStorageRemove(pendingKey)
    return
  }

  // Auth issues: keep pending so it can retry after re-login.
  if (response.status === 401 || response.status === 403) {
    return
  }

  // Retryable (429/5xx).
  const next = { ...pending, attempts: attempts + 1 }
  safeSessionStorageSet(pendingKey, JSON.stringify(next))
  await new Promise<void>((resolve) => {
    const id = globalThis.setTimeout(resolve, backoffMs(attempts))
    signal.addEventListener("abort", () => { globalThis.clearTimeout(id); }, { once: true })
  })
}

export function LearnProgressSync({
  storageKey,
  userId,
}: {
  storageKey?: string
  userId?: string
}) {
  useEffect(() => {
    if (globalThis.window === undefined) return

    const controller = new AbortController()
    const signal = controller.signal

    const pendingKeys = storageKey
      ? [`${storageKey}${pendingSuffix}`]
      : userId
        ? pendingKeysForUser(userId)
        : []

    if (pendingKeys.length === 0) return () => { controller.abort(); }

    void (async () => {
      for (const pendingKey of pendingKeys) {
        if (signal.aborted) return
        await syncPendingKey(pendingKey, signal)
      }
    })()

    return () => { controller.abort(); }
  }, [storageKey, userId])

  return null
}

