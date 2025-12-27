'use client'

import { Suspense, useState, useEffect, useRef, lazy } from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { ClientErrorBoundary } from '@/components/ui/client-error-boundary'
import { cn } from '@/lib/utils'

// Lazy load the ENTIRE Three.js stack - don't even parse it until needed
const ThreeScene = lazy(() => import('./HeroArmScene'))

export default function HeroArm({ className }: { className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [canRender3d, setCanRender3d] = useState(false) // Start false, enable after idle
  const [shouldLoad, setShouldLoad] = useState(false) // Don't load until page is idle
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Wait for browser idle before loading Three.js (keeps initial render smooth)
  // 500ms timeout ensures it doesn't wait forever if browser stays busy
  useEffect(() => {
    const startLoading = () => {
      const isWebdriver =
        typeof navigator !== 'undefined' && navigator.webdriver
      const supported = !isWebdriver && supportsWebGL()
      setCanRender3d(supported)
      if (supported) {
        setShouldLoad(true)
      }
    }

    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(startLoading, { timeout: 500 })
      return () => cancelIdleCallback(id)
    } else {
      // Safari fallback - wait 150ms for React to settle
      const id = setTimeout(startLoading, 150)
      return () => clearTimeout(id)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`${className} relative`}
      role="img"
      aria-label="Interactive 3D model of a 4DOF robotic arm kit"
    >
      {shouldLoad && canRender3d ? (
        <ClientErrorBoundary
          fallback={
            <div
              className="absolute inset-0 flex items-center justify-center bg-slate-50"
              aria-hidden="true"
            >
              <p className="text-sm text-slate-500 font-mono">
                3D preview unavailable
              </p>
            </div>
          }
          onError={() => {
            setCanRender3d(false)
            setIsLoaded(true)
          }}
        >
          <div
            className={cn(
              'w-full h-full transition-opacity duration-500',
              isLoaded ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Suspense fallback={null}>
              <ThreeScene
                prefersReducedMotion={prefersReducedMotion}
                onLoaded={() => setIsLoaded(true)}
              />
            </Suspense>
          </div>
        </ClientErrorBoundary>
      ) : !canRender3d && !shouldLoad ? null : (
        // Show nothing until shouldLoad is true - crosshairs show through
        null
      )}
    </div>
  )
}

function supportsWebGL(): boolean {
  if (globalThis.window === undefined) return false
  if (typeof document === 'undefined') return false
  if (typeof WebGLRenderingContext === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl'),
    )
  } catch {
    return false
  }
}
