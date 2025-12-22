"use client"

import { useGLTF, OrbitControls, PerspectiveCamera, Grid, ContactShadows } from "@react-three/drei"
import { Canvas, type ThreeElements } from "@react-three/fiber"
import { Suspense, useState, useEffect, useRef } from "react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { ClientErrorBoundary } from "@/components/ui/client-error-boundary"

function Model(props: ThreeElements["group"]) {
  const { scene } = useGLTF("/assets/3d/arm/arm.glb", true)
  return <primitive object={scene} {...props} />
}

function LoadingIndicator({ onLoaded }: { onLoaded: () => void }) {
  useEffect(() => {
    onLoaded()
  }, [onLoaded])
  return null
}

// Simple studio lighting without HDR environment (saves 1.5MB)
function StudioLighting() {
  return (
    <>
      {/* Key light - main light source */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Fill light - softer, from opposite side */}
      <directionalLight
        position={[-5, 4, -5]}
        intensity={0.5}
      />
      {/* Rim light - highlights edges */}
      <directionalLight
        position={[0, 3, -8]}
        intensity={0.8}
      />
      {/* Ambient light - fills shadows */}
      <ambientLight intensity={0.4} />
    </>
  )
}

export default function HeroArm({ className }: { className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [canRender3d, setCanRender3d] = useState(() => {
    const isWebdriver =
      typeof navigator !== "undefined" && navigator.webdriver
    return !isWebdriver && supportsWebGL()
  })
  const [isVisible, setIsVisible] = useState(() => {
    return typeof IntersectionObserver === "undefined"
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Lazy load: only render Canvas when component is visible
  useEffect(() => {
    if (!canRender3d) return
    if (isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "100px" } // Start loading 100px before visible
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => { observer.disconnect(); }
  }, [canRender3d, isVisible])

  return (
    <div
      ref={containerRef}
      className={`${className} relative`}
      role="img"
      aria-label="Interactive 3D model of a 4DOF robotic arm kit"
    >
      {canRender3d ? (
        <>
          {/* Loading State */}
          {(!isLoaded || !isVisible) && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10" aria-hidden="true">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-cyan-700 rounded-full animate-spin" aria-hidden="true" />
                <p className="text-sm text-slate-500 font-mono">Loading 3D Model...</p>
              </div>
            </div>
          )}

          {isVisible && (
            <ClientErrorBoundary
              fallback={
                <div
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"
                  aria-hidden="true"
                >
                  <p className="text-sm text-slate-500 font-mono">3D preview unavailable</p>
                </div>
              }
              onError={() => {
                setCanRender3d(false)
                setIsLoaded(true)
              }}
            >
              <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{ antialias: true, powerPreference: "high-performance" }}
                aria-hidden="true"
              >
                <Suspense fallback={null}>
                  <PerspectiveCamera makeDefault position={[5, 3.5, 5]} fov={40} />

                  {/* Blueprint Grid Floor (Light Mode) */}
                  <Grid
                    position={[0, -0.5, 0]}
                    args={[10, 10]}
                    cellSize={0.5}
                    cellThickness={0.5}
                    cellColor="#e2e8f0" // Slate-200
                    sectionSize={3}
                    sectionThickness={1}
                    sectionColor="#0e7490" // Cyan-700
                    fadeDistance={30}
                    fadeStrength={1}
                  />

                  {/* Studio lighting instead of HDR environment */}
                  <StudioLighting />

                  {/* Contact shadows for grounding */}
                  <ContactShadows
                    position={[0, -0.49, 0]}
                    opacity={0.4}
                    scale={10}
                    blur={2}
                    far={4}
                  />

                  <group scale={0.01} position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <Model />
                  </group>


                  <OrbitControls
                    autoRotate={!prefersReducedMotion}
                    autoRotateSpeed={0.8}
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2}
                  />
                  <LoadingIndicator onLoaded={() => { setIsLoaded(true); }} />
                </Suspense>
              </Canvas>
            </ClientErrorBoundary>
          )}
        </>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"
          aria-hidden="true"
        >
          <p className="text-sm text-slate-500 font-mono">3D preview unavailable</p>
        </div>
      )}
    </div>
  )
}

function supportsWebGL(): boolean {
  if (globalThis.window === undefined) return false
  if (typeof document === "undefined") return false
  if (typeof WebGLRenderingContext === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    return Boolean(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    )
  } catch {
    return false
  }
}
