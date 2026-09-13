import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ANATOMY_BY_ID, systemForMeshId } from '../data/anatomy'
import {
  detectAvailableMorphs,
  hairColorFromMorph,
  morphGroupForName,
  morphScaleForGroup,
  type MorphGroup,
} from '../morphs'
import { SYSTEM_META, type AnatomySystem } from '../types'
import { useAtlas } from '../state/AtlasProvider'

const MODEL_URL = `${import.meta.env.BASE_URL}models/female-atlas.glb`

type MeshEntry = {
  mesh: THREE.Mesh
  id: string
  system: AnatomySystem
  basePosition: THREE.Vector3
  baseScale: THREE.Vector3
  explodeDir: THREE.Vector3
  group: MorphGroup
  materials: THREE.Material[]
}

function resolveSystem(mesh: THREE.Object3D): AnatomySystem {
  let p: THREE.Object3D | null = mesh
  while (p) {
    const sys = systemForMeshId(p.name)
    if (sys) return sys
    p = p.parent
  }
  return 'skeletal'
}

function enhanceMaterial(mat: THREE.Material, system: AnatomySystem): THREE.Material {
  const colorHint = new THREE.Color(SYSTEM_META[system].color)
  if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
    const next = mat.clone()
    next.roughness = Math.min(0.92, (next.roughness ?? 0.55) * 0.9 + 0.25)
    next.metalness = Math.min(0.12, next.metalness ?? 0)
    if (!next.vertexColors && !next.map) {
      next.color = next.color.clone().lerp(colorHint, 0.3)
    }
    next.envMapIntensity = 0.6
    next.side = THREE.DoubleSide
    if (system === 'integumentary') {
      next.transparent = true
      next.opacity = 0.2
      next.depthWrite = false
    }
    return next
  }
  return new THREE.MeshPhysicalMaterial({
    color: colorHint,
    roughness: 0.62,
    metalness: 0.04,
    side: THREE.DoubleSide,
    transparent: system === 'integumentary',
    opacity: system === 'integumentary' ? 0.2 : 1,
    depthWrite: system !== 'integumentary',
  })
}

export function FemaleBody() {
  const { scene } = useGLTF(MODEL_URL)
  const root = useMemo(() => scene.clone(true), [scene])
  const groupRef = useRef<THREE.Group>(null)
  const entriesRef = useRef<MeshEntry[]>([])
  const tmp = useRef(new THREE.Vector3())
  const explodeAmt = useRef(0)

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
    setAvailableMorphs,
  } = useAtlas()

  useLayoutEffect(() => {
    const entries: MeshEntry[] = []
    const names: string[] = []
    const worldBox = new THREE.Box3()
    const centers: THREE.Vector3[] = []

    root.updateMatrixWorld(true)

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      if (!mesh.name && mesh.parent?.name) mesh.name = mesh.parent.name
      const id = mesh.name
      const system = resolveSystem(mesh)

      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData.atlasId = id

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      const enhanced = mats.map((m) => enhanceMaterial(m, system))
      mesh.material = enhanced.length === 1 ? enhanced[0] : enhanced

      mesh.geometry.computeBoundingSphere()
      const worldCenter = new THREE.Vector3()
      if (mesh.geometry.boundingSphere) {
        worldCenter.copy(mesh.geometry.boundingSphere.center)
        mesh.localToWorld(worldCenter)
      } else {
        mesh.getWorldPosition(worldCenter)
      }
      worldBox.expandByPoint(worldCenter)
      centers.push(worldCenter)
      names.push(id)

      entries.push({
        mesh,
        id,
        system,
        basePosition: mesh.position.clone(),
        baseScale: mesh.scale.clone(),
        explodeDir: new THREE.Vector3(),
        group: morphGroupForName(id),
        materials: enhanced,
      })
    })

    const bodyCenter = new THREE.Vector3()
    worldBox.getCenter(bodyCenter)

    entries.forEach((entry, i) => {
      const dir = centers[i].clone().sub(bodyCenter)
      if (dir.lengthSq() < 1e-10) dir.set(0, 1, 0)
      dir.normalize()
      // convert world offset direction into parent-local delta approx via base position offset
      entry.explodeDir.copy(dir).multiplyScalar(0.22)
    })

    entriesRef.current = entries
    setAvailableMorphs(detectAvailableMorphs(names))
  }, [root, setAvailableMorphs])

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-10 * dt)
    explodeAmt.current += ((explode ? 1 : 0) - explodeAmt.current) * k

    if (groupRef.current) {
      const h = morphs.height
      groupRef.current.scale.setScalar(h)
    }

    const hairHex = hairColorFromMorph(morphs.hairColor)

    for (const entry of entriesRef.current) {
      const mesh = entry.mesh
      const visible = visibleSystems[entry.system]
      const isSel = selectedId === entry.id
      const faded = Boolean(isolate && selectedId && !isSel)
      mesh.visible = Boolean(visible) && !faded

      // Explode: offset local position along precomputed direction
      const target = tmp.current
        .copy(entry.basePosition)
        .addScaledVector(entry.explodeDir, explodeAmt.current)
      mesh.position.lerp(target, k)

      const [mx, my, mz] = morphScaleForGroup(entry.group, morphs)
      mesh.scale.set(
        entry.baseScale.x * mx,
        entry.baseScale.y * my,
        entry.baseScale.z * mz,
      )

      for (const mat of entry.materials) {
        if (
          mat instanceof THREE.MeshStandardMaterial ||
          mat instanceof THREE.MeshPhysicalMaterial
        ) {
          const highlight = isSel || hoveredId === entry.id
          mat.emissive.set(highlight ? '#d4a574' : '#000000')
          mat.emissiveIntensity = isSel ? 0.5 : hoveredId === entry.id ? 0.25 : 0
          if (entry.group === 'hair') {
            mat.color.set(hairHex)
            mat.vertexColors = false
          }
        }
      }
    }
  })

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation()
        if (!wasTap()) return
        const obj = e.object as THREE.Mesh
        const id = (obj.userData?.atlasId as string) || obj.name
        if (id && ANATOMY_BY_ID[id]) select(id)
        else if (id) select(id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        const obj = e.object as THREE.Object3D
        const id = (obj.userData?.atlasId as string) || obj.name
        if (id) {
          hover(id)
          document.body.style.cursor = 'pointer'
        }
      }}
      onPointerOut={() => {
        hover(null)
        document.body.style.cursor = 'default'
      }}
    >
      <primitive object={root} />
    </group>
  )
}

useGLTF.preload(MODEL_URL)
