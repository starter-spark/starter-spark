'use client'

import {
  useGLTF,
  OrbitControls,
  PerspectiveCamera,
  Grid,
  ContactShadows,
} from '@react-three/drei'
import { Canvas, type ThreeElements } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'

function Model(props: ThreeElements['group']) {
  const { scene } = useGLTF('/assets/3d/arm/arm.glb', true)
  return <primitive object={scene} {...props} />
}

function LoadingIndicator({ onLoaded }: { onLoaded: () => void }) {
  useEffect(() => {
    onLoaded()
  }, [onLoaded])
  return null
}

function StudioLighting() {
  return (
    <>
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 4, -5]} intensity={0.5} />
      <directionalLight position={[0, 3, -8]} intensity={0.8} />
      <ambientLight intensity={0.4} />
    </>
  )
}

interface HeroArmSceneProps {
  prefersReducedMotion: boolean
  onLoaded: () => void
}

export default function HeroArmScene({
  prefersReducedMotion,
  onLoaded,
}: HeroArmSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[5, 3.5, 5]} fov={40} />

        <Grid
          position={[0, -0.5, 0]}
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#e2e8f0"
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#0e7490"
          fadeDistance={30}
          fadeStrength={1}
        />

        <StudioLighting />

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

        <LoadingIndicator onLoaded={onLoaded} />
      </Suspense>
    </Canvas>
  )
}
