'use client'

import { Canvas, useThree } from '@react-three/fiber'
import {
  Center,
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useGLTF,
} from '@react-three/drei'
import {
  Suspense,
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
} from 'react'
import { MathUtils, NeutralToneMapping, PerspectiveCamera, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
import { ClientErrorBoundary } from '@/components/ui/client-error-boundary'

interface ProductViewer3DProps {
  modelPath: string
}

function Model({ path, onLoad }: { path: string; onLoad: () => void }) {
  const { scene } = useGLTF(path, true)

  useEffect(() => {
    if (scene) {
      onLoad()
    }
  }, [scene, onLoad])

  return <primitive object={scene} />
}

interface ModelBounds {
  height: number
  radius: number
}

// Camera sits up and to the right of the model, looking down slightly
const VIEW_DIRECTION = new Vector3(3, 2.2, 5).normalize()

// Soft studio lighting baked into an environment map. Works at any model
// scale, unlike point lights, and needs no HDR download.
function StudioLighting() {
  return (
    <Environment resolution={256}>
      <Lightformer
        form="rect"
        intensity={1.2}
        position={[0, 6, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[12, 12, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.5}
        position={[-6, 2, 4]}
        rotation={[0, Math.PI / 3, 0]}
        scale={[6, 4, 1]}
      />
      <Lightformer
        form="rect"
        intensity={0.8}
        position={[6, 1, 2]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[6, 4, 1]}
      />
      <Lightformer
        form="rect"
        intensity={0.6}
        position={[0, 2, -7]}
        scale={[12, 4, 1]}
      />
    </Environment>
  )
}

// Fits the camera to the model so it fills the frame whatever units it was exported in
function FrameCamera({ bounds }: { bounds: ModelBounds | null }) {
  const camera = useThree((state) => state.camera)
  const controls = useThree(
    (state) => state.controls,
  ) as unknown as OrbitControlsImpl | null

  useLayoutEffect(() => {
    if (!bounds || !controls || !(camera instanceof PerspectiveCamera)) return
    const fov = MathUtils.degToRad(camera.fov)
    const distance = (bounds.radius * 0.85) / Math.sin(fov / 2)
    const target = new Vector3(0, -bounds.height * 0.08, 0)
    camera.position.copy(VIEW_DIRECTION).multiplyScalar(distance).add(target)
    camera.near = distance / 100
    camera.far = distance * 100
    camera.updateProjectionMatrix()
    controls.target.copy(target)
    controls.minDistance = distance * 0.4
    controls.maxDistance = distance * 2
    controls.update()
  }, [bounds, camera, controls])

  return null
}

export default function ProductViewer3D({ modelPath }: ProductViewer3DProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [bounds, setBounds] = useState<ModelBounds | null>(null)
  // Stable so <Center> doesn't re-run its layout effect on every render
  const handleCentered = useCallback(
    ({
      height,
      boundingSphere,
    }: {
      height: number
      boundingSphere: { radius: number }
    }) => {
      setBounds({ height, radius: boundingSphere.radius })
    },
    [],
  )
  const [canRender3d, setCanRender3d] = useState(() => {
    const isWebdriver = typeof navigator !== 'undefined' && navigator.webdriver
    return !isWebdriver && supportsWebGL()
  })

  // Compute whether we should even attempt to check
  const shouldCheck = Boolean(modelPath && canRender3d)

  // null = checking, true = exists, false = doesn't exist
  const [modelExists, setModelExists] = useState<boolean | null>(() => {
    // If we shouldn't check, immediately mark as non-existent
    return shouldCheck ? null : false
  })

  // Pre-validate that the model file exists
  useEffect(() => {
    if (!shouldCheck) {
      return
    }

    // Reset to checking state when path changes
    let cancelled = false

    // Use HEAD request to check if file exists without downloading it
    fetch(modelPath, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return
        setModelExists(res.ok)
        if (!res.ok) {
          console.warn(`3D model not found: ${modelPath} (${res.status})`)
        }
      })
      .catch(() => {
        if (cancelled) return
        setModelExists(false)
        console.warn(`3D model check failed: ${modelPath}`)
      })

    return () => {
      cancelled = true
    }
  }, [modelPath, shouldCheck])

  // Not supported or model doesn't exist - show fallback
  if (!canRender3d || modelExists === false) {
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

  // Still checking if model exists
  if (modelExists === null) {
    return (
      <div
        className="relative w-full h-full overflow-hidden bg-slate-50 flex items-center justify-center"
        role="img"
        aria-label="Loading 3D preview"
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-2 border-slate-200 border-t-cyan-700 rounded-full animate-spin"
            aria-hidden="true"
          />
          <p className="text-sm font-mono text-slate-600">Loading 3D…</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-slate-50"
      role="img"
      aria-label="Interactive 3D product viewer - use mouse to rotate and zoom"
    >
      {/* Loading model */}
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

      {/* 3D canvas */}
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
          <Canvas
            camera={{ position: [3, 2.2, 5], fov: 35 }}
            dpr={[1, 2]}
            onCreated={({ gl }) => {
              // Neutral keeps filament colours true instead of washing them out
              gl.toneMapping = NeutralToneMapping
            }}
            aria-hidden="true"
          >
            <Suspense fallback={null}>
              <StudioLighting />
              <directionalLight position={[4, 6, 5]} intensity={1.4} />
              <Center onCentered={handleCentered}>
                <Model
                  path={modelPath}
                  onLoad={() => {
                    setIsLoaded(true)
                  }}
                />
              </Center>
              {bounds && (
                <ContactShadows
                  position={[0, -bounds.height / 2 - 0.001, 0]}
                  opacity={0.4}
                  blur={2.5}
                  scale={bounds.radius * 5}
                  far={bounds.height}
                  resolution={512}
                  frames={1}
                />
              )}
              <FrameCamera bounds={bounds} />
            </Suspense>
            <OrbitControls
              makeDefault
              enablePan={false}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.1}
            />
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
