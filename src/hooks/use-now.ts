'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Hydration-safe clock. Returns null on the server and during hydration
 * (so both renders are identical), then the current time quantized to
 * `intervalMs`, updating on each tick. Callers must treat null as
 * "clock not available yet".
 */
export function useNow(intervalMs = 60_000): Date | null {
  const subscribe = useCallback(
    (onTick: () => void) => {
      const id = setInterval(onTick, intervalMs)
      return () => clearInterval(id)
    },
    [intervalMs],
  )

  const ms = useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null,
  )

  return ms === null ? null : new Date(ms)
}
