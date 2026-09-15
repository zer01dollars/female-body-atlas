import { Canvas } from '@react-three/fiber'
import {
  Bounds,
  Center,
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  useBounds,
  useProgress,
} from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAtlas } from '../state/AtlasProvider'
import { FemaleBody } from './FemaleBody'

function Lights() {
  return (
    <>
      <ambientLight intensity={0.28} color="#f5ebe0" />
      <hemisphereLight args={['#eef2f8', '#1c1410', 0.45]} />
      {/* Key */}
      <directionalLight
        position={[3.8, 7.5, 4.5]}
        intensity={1.55}
        color="#fff6ea"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00015}
      />
      {/* Fill */}
      <directionalLight position={[-4.5, 2.8, -2.5]} intensity={0.55} color="#a8b8d8" />
      {/* Rim */}
      <directionalLight position={[0.5, 3.2, -5.5]} intensity={0.42} color="#ffd8b8" />
      <pointLight position={[0, 1.2, 2.2]} intensity={0.22} color="#ffe8d4" distance={6} />
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

function LoadingFallback() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="scene-loading" role="status" aria-live="polite">
        <div className="scene-loading-spinner" />
        <div className="scene-loading-text">
          Loading atlas… {Math.min(100, Math.round(progress))}%
        </div>
        <div className="scene-loading-track">
          <div
            className="scene-loading-bar"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </Html>
  )
}

function DomLoadingHint() {
  const { active, progress } = useProgress()
  if (!active && progress >= 100) return null
  if (!active && progress === 0) return null
  return (
    <div className="scene-loading-dom" role="status" aria-live="polite">
      Loading atlas… {Math.min(100, Math.round(progress))}%
    </div>
  )
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
        camera={{ position: [0.9, 0.35, 1.6], fov: 40, near: 0.01, far: 80 }}
        dpr={[1, 2]}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.12
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
        onPointerMissed={() => {
          if (wasTap()) select(null)
        }}
      >
        <color attach="background" args={['#0a090c']} />
        {/* Soft vertical void — less aggressive so the figure doesn’t melt into fog */}
        <fog attach="fog" args={['#0a090c', 7, 22]} />
        <Suspense fallback={<LoadingFallback />}>
          <Lights />
          <Environment preset="apartment" environmentIntensity={0.48} />
          <Bounds fit clip observe margin={1.15}>
            <Center>
              <FemaleBody />
            </Center>
            <FitBounds trigger={fitTrigger} />
          </Bounds>
          <ContactShadows
            position={[0, -0.88, 0]}
            opacity={0.42}
            scale={3.2}
            blur={2.8}
            far={2.4}
            resolution={512}
            color="#000000"
          />
        </Suspense>
        <Rig controlsRef={controlsRef} />
      </Canvas>
      <DomLoadingHint />
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
