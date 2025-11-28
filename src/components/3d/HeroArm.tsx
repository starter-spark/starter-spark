"use client"

import { useGLTF, Stage, OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei"
import { Canvas, ThreeElements } from "@react-three/fiber"
import { Suspense, useState, useEffect } from "react"

function Model(props: ThreeElements["group"]) {
  const { scene } = useGLTF("/assets/3d/arm/arm.glb")
  return <primitive object={scene} {...props} />
}

function LoadingIndicator({ onLoaded }: { onLoaded: () => void }) {
  useEffect(() => {
    onLoaded()
  }, [onLoaded])
  return null
}

export default function HeroArm({ className }: { className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className={`${className} relative`}>
      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-cyan-700 rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-mono">Loading 3D Model...</p>
          </div>
        </div>
      )}
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
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

          <Stage
            environment="city"
            intensity={0.8}
            shadows="contact"
            adjustCamera={false}
          >
            <Model scale={0.85} />
          </Stage>

          <OrbitControls
            autoRotate
            autoRotateSpeed={0.8}
            enableZoom={false}
            enablePan={false}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2}
          />
          <LoadingIndicator onLoaded={() => setIsLoaded(true)} />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Preload the model
useGLTF.preload("/assets/3d/arm/arm.glb")