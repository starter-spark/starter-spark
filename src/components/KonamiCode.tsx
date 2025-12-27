'use client'

import { useEffect, useRef, useCallback } from 'react'

const KONAMI_CODE: readonly string[] = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
] as const

export function KonamiCode() {
  const inputRef = useRef<string[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerConfetti = useCallback(async () => {
    // Dynamically import confetti only when triggered
    const confettiModule = await import('canvas-confetti')

    // Create an absolutely-positioned canvas that scrolls with the page
    const canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
    canvas.style.top = `${window.scrollY}px`
    canvas.style.left = '0'
    canvas.style.width = '100vw'
    canvas.style.height = '200vh'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '9999'
    document.body.appendChild(canvas)

    // Create confetti instance bound to our canvas
    const confetti = confettiModule.create(canvas, { resize: true })

    // Fire confetti from both sides
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      // Left side
      void confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.3 },
        colors: ['#0e7490', '#06b6d4', '#22d3ee', '#67e8f9'],
        ticks: 400,
      })

      // Right side
      void confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.3 },
        colors: ['#0e7490', '#06b6d4', '#22d3ee', '#67e8f9'],
        ticks: 400,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()

    // Clean up canvas after animation completes + extra time for particles to fall
    setTimeout(() => {
      confetti.reset()
      canvas.remove()
    }, duration + 5000)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Add the key to the sequence
      inputRef.current.push(event.code)

      // Keep only the last N keys (length of Konami code)
      if (inputRef.current.length > KONAMI_CODE.length) {
        inputRef.current.shift()
      }

      // Check if the sequence matches
      const konamiSequence = [...KONAMI_CODE]
      const isMatch =
        inputRef.current.length === konamiSequence.length &&
        // eslint-disable-next-line security/detect-object-injection -- i is a safe numeric index from .every()
        inputRef.current.every((key, i) => key === konamiSequence[i])

      if (isMatch) {
        // Reset the sequence
        inputRef.current = []
        void triggerConfetti()
      }

      // Reset sequence after 2 seconds of no input
      timeoutRef.current = setTimeout(() => {
        inputRef.current = []
      }, 2000)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [triggerConfetti])

  // This component renders nothing
  return null
}
