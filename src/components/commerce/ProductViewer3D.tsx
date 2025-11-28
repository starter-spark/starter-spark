"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stage, useGLTF } from "@react-three/drei"
import { Suspense, useState, useEffect } from "react"

interface ProductViewer3DProps {
  modelPath: string
}

function Model({ path }: { path: string }) {
  const { scene } = useGLTF(path)
  return <primitive object={scene} />
}

function LoadingIndicator({ onLoaded }: { onLoaded: () => void }) {
  useEffect(() => {
    onLoaded()
  }, [onLoaded])
  return null
}

export default function ProductViewer3D({ modelPath }: ProductViewer3DProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className="relative w-full h-full">
      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-10 rounded">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-cyan-700 rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-mono">Loading 3D Model...</p>
          </div>
        </div>
      )}
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <Stage
            intensity={0.8}
            environment="city"
            shadows="contact"
            adjustCamera={false}
          >
            <Model path={modelPath} />
          </Stage>
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
          />
          <LoadingIndicator onLoaded={() => setIsLoaded(true)} />
        </Suspense>
      </Canvas>
    </div>
  )
}
