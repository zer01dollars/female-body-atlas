import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { useAtlas } from '../state/AtlasProvider'
import { FemaleBody } from './FemaleBody'

function Lights() {
  return (
    <>
      <ambientLight intensity={0.32} color="#f0e6dc" />
      <directionalLight
        position={[7, 16, 10]}
        intensity={1.15}
        color="#fff4e8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-8, 6, -4]} intensity={0.35} color="#9bb0d8" />
      <spotLight
        position={[0, 20, 8]}
        intensity={0.55}
        angle={0.42}
        penumbra={0.7}
        color="#ffe8c8"
      />
    </>
  )
}

function Rig() {
  const { morphs } = useAtlas()
  const h = morphs.height
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={28}
      target={[0, 8.6 * h, 0]}
      maxPolarAngle={Math.PI * 0.92}
    />
  )
}

export function Scene() {
  const { select, wasTap, markPointerDown, markPointerMove } = useAtlas()

  return (
    <div
      className="scene-root"
      onPointerDown={(e) => markPointerDown(e.clientX, e.clientY)}
      onPointerMove={(e) => markPointerMove(e.clientX, e.clientY)}
    >
      <Canvas
        camera={{ position: [5.5, 10.2, 16.5], fov: 38, near: 0.1, far: 80 }}
        dpr={[1, 1.75]}
        shadows
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => {
          if (wasTap()) select(null)
        }}
      >
        <color attach="background" args={['#0a090c']} />
        <fog attach="fog" args={['#0a090c', 18, 42]} />
        <Suspense fallback={null}>
          <Lights />
          <Environment preset="city" environmentIntensity={0.28} />
          <FemaleBody />
          <ContactShadows
            position={[0, -0.02, 0]}
            opacity={0.42}
            scale={28}
            blur={2.4}
            far={12}
          />
        </Suspense>
        <Rig />
      </Canvas>
    </div>
  )
}
