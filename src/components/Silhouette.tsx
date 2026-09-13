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
  const { showSilhouette, explode, isolate } = useAtlas()
  if (!showSilhouette || explode || isolate) return null

  return (
    <group>
      <Ghost position={[0, 15.55, 0]} args={[0.74, 24, 18]} scale={[0.95, 1.08, 1]} />
      <Ghost position={[0, 14.2, 0]} args={[0.16, 0.35, 4, 8]} kind="capsule" />
      <Ghost position={[0, 12.35, 0.08]} args={[0.95, 20, 16]} scale={[1.05, 1.35, 0.72]} />
      <Ghost position={[0.42, 12.5, 0.68]} args={[0.3, 16, 12]} scale={[1.05, 0.92, 0.9]} />
      <Ghost position={[-0.42, 12.5, 0.68]} args={[0.3, 16, 12]} scale={[1.05, 0.92, 0.9]} />
      <Ghost position={[0, 10.55, 0.06]} args={[0.62, 16, 12]} scale={[1.05, 1.15, 0.7]} />
      <Ghost position={[0, 8.85, 0.02]} args={[0.95, 20, 16]} scale={[1.35, 0.85, 0.8]} />
      <Ghost position={[1.24, 11.9, 0.02]} args={[0.16, 2.1, 4, 8]} kind="capsule" />
      <Ghost position={[-1.24, 11.9, 0.02]} args={[0.16, 2.1, 4, 8]} kind="capsule" />
      <Ghost position={[1.34, 9.5, 0.06]} args={[0.13, 1.8, 4, 8]} kind="capsule" />
      <Ghost position={[-1.34, 9.5, 0.06]} args={[0.13, 1.8, 4, 8]} kind="capsule" />
      <Ghost position={[0.88, 6.65, 0]} args={[0.22, 2.7, 4, 8]} kind="capsule" rotation={[0, 0, 0.12]} />
      <Ghost position={[-0.88, 6.65, 0]} args={[0.22, 2.7, 4, 8]} kind="capsule" rotation={[0, 0, -0.12]} />
      <Ghost position={[0.7, 3.15, 0]} args={[0.16, 2.55, 4, 8]} kind="capsule" />
      <Ghost position={[-0.7, 3.15, 0]} args={[0.16, 2.55, 4, 8]} kind="capsule" />
    </group>
  )
}
