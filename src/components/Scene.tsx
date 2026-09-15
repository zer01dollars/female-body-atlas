import { Canvas } from '@react-three/fiber'
import {
  Bounds,
  Center,
  ContactShadows,
  Environment,
  OrbitControls,
  useBounds,
} from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAtlas } from '../state/AtlasProvider'
import { FemaleBody } from './FemaleBody'

function Lights() {
  return (
    <>
      <ambientLight intensity={0.32} color="#f2e8de" />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.45}
        color="#fff4e8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 3, -3]} intensity={0.45} color="#9bb0d8" />
      <directionalLight position={[0, 2, -6]} intensity={0.3} color="#ffe0c0" />
      <hemisphereLight args={['#e8eef8', '#1a1210', 0.4]} />
    </>
  )
}

function FitBounds({ trigger }: { trigger: number }) {
  const api = useBounds()
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      api.refresh().fit()
    })
    return () => cancelAnimationFrame(id)
  }, [api, trigger])
  return null
}

function Rig({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={0.35}
      maxDistance={8}
      maxPolarAngle={Math.PI * 0.95}
      target={[0, 0, 0]}
    />
  )
}

function HoverLabel() {
  const { hoveredId, selectedId } = useAtlas()
  const id = hoveredId || selectedId
  if (!id) return null
  const label = id.replace(/^VH_F_/, '').replace(/^atlas_/, '').replace(/_/g, ' ')
  return <div className="hover-label">{label}</div>
}

export function Scene() {
  const { select, wasTap, markPointerDown, markPointerMove, selectedId } = useAtlas()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const [fitTrigger, setFitTrigger] = useState(0)

  function resetView() {
    setFitTrigger((n) => n + 1)
    controlsRef.current?.reset()
  }

  return (
    <div
      className="scene-root"
      onPointerDown={(e) => markPointerDown(e.clientX, e.clientY)}
      onPointerMove={(e) => markPointerMove(e.clientX, e.clientY)}
    >
      <Canvas
        camera={{ position: [0.9, 0.35, 1.6], fov: 40, near: 0.01, far: 50 }}
        dpr={[1, 1.75]}
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => {
          if (wasTap()) select(null)
        }}
      >
        <color attach="background" args={['#0a090c']} />
        <fog attach="fog" args={['#0a090c', 4, 12]} />
        <Suspense fallback={null}>
          <Lights />
          <Environment preset="city" environmentIntensity={0.42} />
          <Bounds fit clip observe margin={1.15}>
            <Center>
              <FemaleBody />
            </Center>
            <FitBounds trigger={fitTrigger} />
          </Bounds>
          <ContactShadows
            position={[0, -0.85, 0]}
            opacity={0.5}
            scale={3}
            blur={2.6}
            far={2}
          />
        </Suspense>
        <Rig controlsRef={controlsRef} />
      </Canvas>
      <HoverLabel />
      <div className="view-toolbar">
        <button type="button" className="text-btn view-btn" onClick={resetView}>
          Reset view
        </button>
        {selectedId ? (
          <span className="view-hint">Selected — isolate in Layers</span>
        ) : null}
      </div>
      <div className="load-hint" aria-hidden>
        Drag to orbit · Scroll to zoom · Click to select
      </div>
    </div>
  )
}
