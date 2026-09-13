import { useMemo } from 'react'
import { useAtlas } from '../state/AtlasProvider'

function Ghost({
  position,
  args,
  kind = 'sphere',
  rotation,
  scale,
}: {
  position: [number, number, number]
  args: number[]
  kind?: 'sphere' | 'capsule' | 'box'
  rotation?: [number, number, number]
  scale?: [number, number, number]
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      raycast={() => null}
    >
      {kind === 'capsule' ? (
        <capsuleGeometry args={args as [number, number, number, number]} />
      ) : kind === 'box' ? (
        <boxGeometry args={args as [number, number, number]} />
      ) : (
        <sphereGeometry args={args as [number, number, number]} />
      )}
      <meshStandardMaterial
        color="#e8c4b8"
        transparent
        opacity={0.055}
        roughness={0.85}
        depthWrite={false}
      />
    </mesh>
  )
}

export function Silhouette() {
  const { showSilhouette, explode, isolate, morphs } = useAtlas()

  const chest = 0.75 + morphs.chestSize * 0.55
  const butt = 0.78 + morphs.buttSize * 0.5
  const muscle = 0.88 + morphs.musculature * 0.28
  const arm = morphs.armLength

  const arms = useMemo(() => {
    const shoulderY = 13.52
    const upperLen = 2.1 * arm
    const foreLen = 1.8 * arm
    const upperY = shoulderY - upperLen * 0.45
    const foreY = shoulderY - upperLen * 0.95 - foreLen * 0.4
    const upperX = 1.24 * (0.92 + arm * 0.08)
    const foreX = 1.34 * (0.9 + arm * 0.1)
    return { upperLen, foreLen, upperY, foreY, upperX, foreX }
  }, [arm])

  if (!showSilhouette || explode || isolate) return null

  return (
    <group>
      <Ghost position={[0, 15.55, 0]} args={[0.74, 24, 18]} scale={[0.95, 1.08, 1]} />
      <Ghost position={[0, 14.2, 0]} args={[0.16, 0.35, 4, 8]} kind="capsule" />
      <Ghost
        position={[0, 12.35, 0.08]}
        args={[0.95, 20, 16]}
        scale={[1.05 * muscle, 1.35, 0.72 * muscle]}
      />
      <Ghost
        position={[0.42, 12.5, 0.68]}
        args={[0.3, 16, 12]}
        scale={[1.05 * chest, 0.92 * chest, 0.9 * chest]}
      />
      <Ghost
        position={[-0.42, 12.5, 0.68]}
        args={[0.3, 16, 12]}
        scale={[1.05 * chest, 0.92 * chest, 0.9 * chest]}
      />
      <Ghost
        position={[0, 10.55, 0.06]}
        args={[0.62, 16, 12]}
        scale={[1.05 * muscle, 1.15, 0.7 * muscle]}
      />
      <Ghost
        position={[0, 8.85, 0.02]}
        args={[0.95, 20, 16]}
        scale={[1.35 * butt, 0.85 * butt, 0.8 * butt]}
      />
      <Ghost
        position={[arms.upperX, arms.upperY, 0.02]}
        args={[0.16 * muscle, arms.upperLen, 4, 8]}
        kind="capsule"
      />
      <Ghost
        position={[-arms.upperX, arms.upperY, 0.02]}
        args={[0.16 * muscle, arms.upperLen, 4, 8]}
        kind="capsule"
      />
      <Ghost
        position={[arms.foreX, arms.foreY, 0.06]}
        args={[0.13 * muscle, arms.foreLen, 4, 8]}
        kind="capsule"
      />
      <Ghost
        position={[-arms.foreX, arms.foreY, 0.06]}
        args={[0.13 * muscle, arms.foreLen, 4, 8]}
        kind="capsule"
      />
      <Ghost
        position={[0.88, 6.65, 0]}
        args={[0.22 * muscle, 2.7, 4, 8]}
        kind="capsule"
        rotation={[0, 0, 0.12]}
      />
      <Ghost
        position={[-0.88, 6.65, 0]}
        args={[0.22 * muscle, 2.7, 4, 8]}
        kind="capsule"
        rotation={[0, 0, -0.12]}
      />
      <Ghost position={[0.7, 3.15, 0]} args={[0.16 * muscle, 2.55, 4, 8]} kind="capsule" />
      <Ghost position={[-0.7, 3.15, 0]} args={[0.16 * muscle, 2.55, 4, 8]} kind="capsule" />
    </group>
  )
}
