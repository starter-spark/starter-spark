'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, useGLTF } from '@react-three/drei'
import { Suspense, useState, useEffect } from 'react'
import { ClientErrorBoundary } from '@/components/ui/client-error-boundary'

interface ProductViewer3DProps {
  modelPath: string
}

function Model({ path, onLoad }: { path: string; onLoad: () => void }) {
  const { scene } = useGLTF(path, true)

  useEffect(() => {
    // Scene loaded, call onLoad
    if (scene) {
      onLoad()
    }
  }, [scene, onLoad])

  return <primitive object={scene} />
}

export default function ProductViewer3D({ modelPath }: ProductViewer3DProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [canRender3d, setCanRender3d] = useState(() => {
    const isWebdriver = typeof navigator !== 'undefined' && navigator.webdriver
    return !isWebdriver && supportsWebGL()
  })

  if (!canRender3d) {
    return (
      <div
        className="relative w-full h-full overflow-hidden bg-slate-50 flex items-center justify-center"
        role="img"
        aria-label="3D preview unavailable"
      >
        <p className="text-sm font-mono text-slate-600">
          3D preview unavailable
        </p>
      </div>
    )
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-slate-50"
      role="img"
      aria-label="Interactive 3D product viewer - use mouse to rotate and zoom"
    >
      {/* Loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 border-2 border-slate-200 border-t-cyan-700 rounded-full animate-spin"
              aria-hidden="true"
            />
            <p className="text-sm font-mono text-slate-600">Loading 3D…</p>
          </div>
        </div>
      )}

      {/* 3D canvas (no fades) */}
      <div className="absolute inset-0">
        <ClientErrorBoundary
          fallback={
            <div
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <p className="text-sm font-mono text-slate-600">
                3D preview unavailable
              </p>
            </div>
          }
          onError={() => {
            setCanRender3d(false)
            setIsLoaded(true)
          }}
        >
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }} aria-hidden="true">
            <Suspense fallback={null}>
              <Stage
                intensity={0.8}
                environment={null}
                shadows="contact"
                adjustCamera={false}
              >
                <Model
                  path={modelPath}
                  onLoad={() => {
                    setIsLoaded(true)
                  }}
                />
              </Stage>
              <OrbitControls
                enableZoom={true}
                enablePan={false}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.5}
              />
            </Suspense>
          </Canvas>
        </ClientErrorBoundary>
      </div>
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
