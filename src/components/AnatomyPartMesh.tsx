import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Group } from 'three'
import { BODY_CENTER } from '../data/anatomy'
import {
  hairColorFromMorph,
  morphPositionForPart,
  morphScaleForPart,
} from '../morphs'
import { useAtlas } from '../state/AtlasProvider'
import type { AnatomyPart, Primitive } from '../types'

const EXPLODE = 0.95
const EXPLODE_Y = 0.55

function Geometry({ primitive }: { primitive: Primitive }) {
  const { kind, args } = primitive
  switch (kind) {
    case 'sphere':
      return <sphereGeometry args={args as [number, number, number]} />
    case 'capsule':
      return <capsuleGeometry args={args as [number, number, number, number]} />
    case 'box':
      return <boxGeometry args={args as [number, number, number]} />
    case 'cylinder':
      return <cylinderGeometry args={args as [number, number, number, number]} />
    case 'torus':
      return (
        <torusGeometry
          args={args as [number, number, number, number, number]}
        />
      )
    case 'cone':
      return <coneGeometry args={args as [number, number, number]} />
    default:
      return <sphereGeometry args={[0.2, 12, 10]} />
  }
}

export function AnatomyPartMesh({ part }: { part: AnatomyPart }) {
  const group = useRef<Group>(null)
  const explodeK = useRef(0)
  const {
    selectedId,
    hoveredId,
    visibleSystems,
    explode,
    isolate,
    morphs,
    select,
    hover,
    wasTap,
  } = useAtlas()

  const visible = visibleSystems[part.system]
  const isSelected = selectedId === part.id
  const isHovered = hoveredId === part.id
  const faded = Boolean(isolate && selectedId && selectedId !== part.id)

  const basePos = useMemo(
    () => morphPositionForPart(part.id, part.position, morphs),
    [part.id, part.position, morphs],
  )

  const partMorphScale = useMemo(
    () => morphScaleForPart(part.id, morphs),
    [part.id, morphs],
  )

  const offset = useMemo(() => {
    const dx = basePos[0] - BODY_CENTER[0]
    const dy = basePos[1] - BODY_CENTER[1]
    const dz = basePos[2] - BODY_CENTER[2]
    return [
      dx * EXPLODE,
      dy * EXPLODE_Y,
      dz * EXPLODE + Math.sign(dx || 1) * 0.12,
    ] as const
  }, [basePos])

  useFrame((_, dt) => {
    const target = explode ? 1 : 0
    explodeK.current += (target - explodeK.current) * Math.min(1, dt * 4.2)
    if (!group.current) return
    group.current.position.set(
      basePos[0] + offset[0] * explodeK.current,
      basePos[1] + offset[1] * explodeK.current,
      basePos[2] + offset[2] * explodeK.current,
    )
    group.current.scale.set(
      partMorphScale[0],
      partMorphScale[1],
      partMorphScale[2],
    )
    group.current.visible = visible
  })

  if (!visible) return null

  const opacity = faded ? 0.07 : (part.opacity ?? 0.92)
  const morphHair =
    part.id === 'scalp-hair' ? hairColorFromMorph(morphs.hairColor) : null
  const baseColor = morphHair ?? part.color
  const color = isSelected ? '#f3ddb8' : isHovered ? '#f0d2c0' : baseColor
  const emissive = isSelected ? '#c9a24a' : isHovered ? '#8a6040' : '#000000'
  const emissiveIntensity = isSelected ? 0.4 : isHovered ? 0.18 : 0
  const roughness = part.id === 'scalp-hair' ? 0.78 : 0.48

  return (
    <group
      ref={group}
      position={basePos}
      rotation={part.rotation}
      scale={partMorphScale}
      onPointerOver={(e) => {
        e.stopPropagation()
        hover(part.id)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        hover(null)
        document.body.style.cursor = 'auto'
      }}
      onPointerUp={(e) => {
        e.stopPropagation()
        if (wasTap()) select(part.id)
      }}
    >
      {part.primitives.map((primitive, i) => (
        <mesh
          key={`${part.id}-${i}`}
          position={primitive.position}
          rotation={primitive.rotation}
          scale={primitive.scale}
          castShadow
          receiveShadow
        >
          <Geometry primitive={primitive} />
          <meshStandardMaterial
            color={color}
            roughness={roughness}
            metalness={0.08}
            transparent
            opacity={opacity}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            depthWrite={opacity > 0.35}
            envMapIntensity={0.55}
          />
        </mesh>
      ))}
      {isSelected ? (
        <Html
          position={[0, 0.55, 0]}
          center
          distanceFactor={12}
          style={{ pointerEvents: 'none' }}
        >
          <div className="label-chip">{part.name}</div>
        </Html>
      ) : null}
    </group>
  )
}
