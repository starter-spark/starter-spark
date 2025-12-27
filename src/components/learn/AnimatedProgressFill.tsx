'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedProgressFillProps {
  progress: number
  storageKey: string
  className?: string
}

function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, value))
}

const pendingSuffix = ':pending'

function safeSessionStorageGet(key: string): string | null {
  if (globalThis.window === undefined) return null
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function parseStoredProgress(raw: string | null): number | null {
  if (!raw) return null
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

function parsePendingProgress(raw: string | null): number | null {
  const asNumber = parseStoredProgress(raw)
  if (asNumber !== null) return asNumber

  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const progress = (parsed as Record<string, unknown>).progress
    if (typeof progress === 'number' && Number.isFinite(progress))
      return progress
    if (typeof progress === 'string') {
      const num = Number(progress)
      return Number.isFinite(num) ? num : null
    }
    return null
  } catch {
    return null
  }
}

function safeSessionStorageSet(key: string, value: string) {
  if (globalThis.window === undefined) return
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Ignore (private mode, quota, etc.).
  }
}

function safeSessionStorageRemove(key: string) {
  if (globalThis.window === undefined) return
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Ignore.
  }
}

export function AnimatedProgressFill({
  progress,
  storageKey,
  className,
}: AnimatedProgressFillProps) {
  const targetFromProps = useMemo(() => clampProgress(progress), [progress])
  const { initial, target, shouldClearPending } = useMemo(() => {
    if (globalThis.window === undefined) {
      return {
        initial: targetFromProps,
        target: targetFromProps,
        shouldClearPending: false,
      }
    }

    const storedRaw = safeSessionStorageGet(storageKey)
    const pendingRaw = safeSessionStorageGet(`${storageKey}${pendingSuffix}`)

    const storedValue = parseStoredProgress(storedRaw)
    const pendingValue = parsePendingProgress(pendingRaw)

    const stored = storedValue === null ? null : clampProgress(storedValue)
    const pending = pendingValue === null ? null : clampProgress(pendingValue)

    const nextTarget = clampProgress(
      Math.max(targetFromProps, stored ?? 0, pending ?? 0),
    )

    return {
      initial: stored ?? nextTarget,
      target: nextTarget,
      shouldClearPending: pending !== null && pending <= targetFromProps,
    }
  }, [storageKey, targetFromProps])
  const ref = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    safeSessionStorageSet(storageKey, String(target))
    if (shouldClearPending) {
      safeSessionStorageRemove(`${storageKey}${pendingSuffix}`)
    }

    const el = ref.current
    if (!el) return

    el.style.width = `${initial}%`
    const raf = requestAnimationFrame(() => {
      el.style.width = `${target}%`
    })

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [initial, shouldClearPending, storageKey, target])

  return (
    <div
      ref={ref}
      className={cn('progress-bar-fill', className)}
      style={{ width: `${initial}%` } as CSSProperties}
    />
  )
}
