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
  skinColorFromMorph,
  type MorphGroup,
} from '../morphs'
import { SYSTEM_META, type AnatomySystem } from '../types'
import { useAtlas } from '../state/AtlasProvider'
import { buildProceduralHair } from './ProceduralHair'

const MODEL_URL = `${import.meta.env.BASE_URL}models/female-atlas.glb`
/** Max radial explode offset (meters) at explodeAmount = 1. */
const EXPLODE_MAX = 0.35

type MeshEntry = {
  mesh: THREE.Mesh
  id: string
  system: AnatomySystem
  basePosition: THREE.Vector3
  baseScale: THREE.Vector3
  explodeDir: THREE.Vector3
  group: MorphGroup
  materials: THREE.Material[]
  /** Original local positions for skin soft morphs. */
  skinBase?: Float32Array
  skinBox?: { minY: number; maxY: number; cy: number; cx: number; cz: number }
}

function resolveSystem(mesh: THREE.Object3D): AnatomySystem {
  let p: THREE.Object3D | null = mesh
  while (p) {
    const sys = systemForMeshId(p.name)
    if (sys) return sys
    p = p.parent
  }
  if (/atlas_hair/i.test(mesh.name)) return 'integumentary'
  return 'skeletal'
}

function makeSkinMaterial(base?: THREE.Material): THREE.MeshPhysicalMaterial {
  const color =
    base &&
    (base instanceof THREE.MeshStandardMaterial ||
      base instanceof THREE.MeshPhysicalMaterial)
      ? base.color.clone()
      : new THREE.Color('#d4a574')
  // Opaque by default — transparent:true at opacity 1 breaks depth among hundreds of meshes.
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.5,
    metalness: 0.0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.5,
    sheen: 0.4,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color('#f2c4a8'),
    transmission: 0,
    thickness: 0.4,
    envMapIntensity: 0.95,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthWrite: true,
  })
}

function enhanceMaterial(mat: THREE.Material, system: AnatomySystem): THREE.Material {
  if (system === 'integumentary') {
    return makeSkinMaterial(mat)
  }
  const colorHint = new THREE.Color(SYSTEM_META[system].color)
  const softTissue = system !== 'skeletal'
  if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
    const next = mat.clone()
    next.roughness = softTissue
      ? Math.min(0.78, Math.max(0.35, (next.roughness ?? 0.55) * 0.85 + 0.12))
      : Math.min(0.88, (next.roughness ?? 0.55) * 0.9 + 0.2)
    // Soft tissue should not look metallic/muddy.
    next.metalness = softTissue ? 0 : Math.min(0.08, next.metalness ?? 0)
    if (!next.vertexColors && !next.map) {
      next.color = next.color.clone().lerp(colorHint, softTissue ? 0.48 : 0.28)
    }
    next.envMapIntensity = softTissue ? 0.55 : 0.7
    next.side = THREE.DoubleSide
    return next
  }
  return new THREE.MeshPhysicalMaterial({
    color: colorHint,
    roughness: softTissue ? 0.55 : 0.62,
    metalness: softTissue ? 0 : 0.04,
    side: THREE.DoubleSide,
  })
}

/** Dequantize a BufferAttribute (e.g. Int16 normalized) to Float32 via getX/Y/Z. */
function dequantizeAttribute(
  attr: THREE.BufferAttribute,
  itemSize: number,
): THREE.BufferAttribute {
  if (attr.array instanceof Float32Array && !attr.normalized) return attr
  const count = attr.count
  const floats = new Float32Array(count * itemSize)
  for (let i = 0; i < count; i++) {
    floats[i * itemSize] = attr.getX(i)
    if (itemSize > 1) floats[i * itemSize + 1] = attr.getY(i)
    if (itemSize > 2) floats[i * itemSize + 2] = attr.getZ(i)
    if (itemSize > 3) floats[i * itemSize + 3] = attr.getW(i)
  }
  return new THREE.BufferAttribute(floats, itemSize)
}

/**
 * Convert quantized positions to Float32 for soft morphs.
 * Preserve / dequantize original normals — computeVertexNormals() after toNonIndexed()
 * can flip winding and FrontSide-cull the exterior.
 */
function ensureFloatSkinGeometry(mesh: THREE.Mesh): THREE.BufferAttribute {
  let geo = mesh.geometry
  // Clone + de-index so we never mutate shared GLTF buffers incorrectly.
  geo = geo.index ? geo.clone().toNonIndexed() : geo.clone()
  mesh.geometry = geo

  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
  const floatPos = dequantizeAttribute(posAttr, 3)
  if (floatPos !== posAttr) geo.setAttribute('position', floatPos)

  const normalAttr = geo.getAttribute('normal') as THREE.BufferAttribute | undefined
  if (normalAttr) {
    const floatNorm = dequantizeAttribute(normalAttr, normalAttr.itemSize)
    if (floatNorm !== normalAttr) geo.setAttribute('normal', floatNorm)
  } else {
    geo.computeVertexNormals()
  }

  geo.computeBoundingSphere()
  geo.computeBoundingBox()
  mesh.frustumCulled = true
  return geo.getAttribute('position') as THREE.BufferAttribute
}

/** Soft region morphs on the body skin shell (chest / glute / shoulder / arm). */
function applySkinSoftMorph(
  entry: MeshEntry,
  morphs: {
    chestSize: number
    buttSize: number
    shoulderWidth: number
    armLength: number
  },
) {
  if (!entry.skinBase || !entry.skinBox) return
  const pos = entry.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
  const base = entry.skinBase
  const { minY, maxY, cy, cx, cz } = entry.skinBox
  const h = Math.max(1e-6, maxY - minY)
  const chestAmt = (morphs.chestSize - 0.5) * 0.22
  const buttAmt = (morphs.buttSize - 0.5) * 0.28
  const shoulderAmt = morphs.shoulderWidth - 1
  const armAmt = morphs.armLength - 1

  for (let i = 0; i < pos.count; i++) {
    const i3 = i * 3
    let x = base[i3]
    let y = base[i3 + 1]
    let z = base[i3 + 2]
    const t = (y - minY) / h // 0 feet → 1 head

    // Chest band (~0.55–0.72)
    if (t > 0.52 && t < 0.74 && z > cz - 0.02) {
      const w = 1 - Math.abs((t - 0.63) / 0.12)
      const k = Math.max(0, w) * chestAmt
      x += (x - cx) * k
      z += (z - cz) * k * 1.2
    }

    // Glute / hip band (~0.28–0.42), posterior
    if (t > 0.26 && t < 0.44 && z < cz + 0.02) {
      const w = 1 - Math.abs((t - 0.35) / 0.1)
      const k = Math.max(0, w) * buttAmt
      x += (x - cx) * k * 1.15
      z += (z - cz) * k * 1.4
    }

    // Shoulders (~0.72–0.82)
    if (t > 0.7 && t < 0.84) {
      const w = 1 - Math.abs((t - 0.77) / 0.08)
      const k = Math.max(0, w) * shoulderAmt
      x += (x - cx) * k
    }

    // Outer arm / lateral torso (~0.45–0.78, lateral)
    const lat = Math.abs(x - cx)
    if (t > 0.42 && t < 0.8 && lat > 0.12) {
      const w = Math.min(1, (lat - 0.12) / 0.2)
      y += (y - cy) * armAmt * 0.35 * w
      x += Math.sign(x - cx || 1) * armAmt * 0.04 * w
    }

    pos.setXYZ(i, x, y, z)
  }
  pos.needsUpdate = true
  entry.mesh.geometry.computeBoundingSphere()
}

export function FemaleBody() {
  const { scene } = useGLTF(MODEL_URL)
  const root = useMemo(() => scene.clone(true), [scene])
  const groupRef = useRef<THREE.Group>(null)
  const hairRef = useRef<THREE.Group | null>(null)
  const entriesRef = useRef<MeshEntry[]>([])
  const tmp = useRef(new THREE.Vector3())
  const explodeAmt = useRef(0)
  const hairBaseScale = useRef(new THREE.Vector3(1, 1, 1))
  // Skip soft morph until values leave defaults (float conversion is the real cube fix).
  const softMorphKey = useRef('0.5|0.5|1|1')

  const {
    selectedId,
    hoveredId,
    visibleSystems,
    explodeAmount,
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
    const headBox = new THREE.Box3()
    let headHits = 0

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

      // Prefer skull/cranium or upper VH_F_skin for hair bounds — Allen_ brain meshes skew the box.
      if (/skull|cranium/i.test(id)) {
        headBox.expandByObject(mesh)
        headHits++
      } else if (id === 'VH_F_skin') {
        const box = new THREE.Box3().setFromObject(mesh)
        const size = new THREE.Vector3()
        box.getSize(size)
        // Keep only the top ~18% of the body skin as a head region proxy.
        const headMinY = box.max.y - size.y * 0.18
        const tight = new THREE.Box3(
          new THREE.Vector3(box.min.x + size.x * 0.28, headMinY, box.min.z + size.z * 0.22),
          new THREE.Vector3(box.max.x - size.x * 0.28, box.max.y, box.max.z - size.z * 0.15),
        )
        headBox.union(tight)
        headHits++
      }

      const group = morphGroupForName(id)
      const entry: MeshEntry = {
        mesh,
        id,
        system,
        basePosition: mesh.position.clone(),
        baseScale: mesh.scale.clone(),
        explodeDir: new THREE.Vector3(),
        group,
        materials: enhanced,
      }

      if (group === 'skin' || id === 'VH_F_skin') {
        // Dequantize Int16-normalized HuBMAP positions before soft morphs.
        const attr = ensureFloatSkinGeometry(mesh)
        entry.skinBase = new Float32Array(attr.array as Float32Array)
        let minY = Infinity
        let maxY = -Infinity
        let sx = 0
        let sy = 0
        let sz = 0
        for (let i = 0; i < attr.count; i++) {
          const x = attr.getX(i)
          const y = attr.getY(i)
          const z = attr.getZ(i)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
          sx += x
          sy += y
          sz += z
        }
        entry.skinBox = {
          minY,
          maxY,
          cy: sy / attr.count,
          cx: sx / attr.count,
          cz: sz / attr.count,
        }
        entry.group = 'skin'
      }

      entries.push(entry)
    })

    const bodyCenter = new THREE.Vector3()
    worldBox.getCenter(bodyCenter)

    entries.forEach((entry, i) => {
      const dir = centers[i].clone().sub(bodyCenter)
      if (dir.lengthSq() < 1e-10) dir.set(0, 1, 0)
      dir.normalize()
      entry.explodeDir.copy(dir).multiplyScalar(EXPLODE_MAX)
    })

    // Procedural hair aligned to head / upper skin
    const headCenter = new THREE.Vector3()
    const headSize = new THREE.Vector3()
    if (headHits > 0 && !headBox.isEmpty()) {
      headBox.getCenter(headCenter)
      headBox.getSize(headSize)
      // Keep procedural hair on a human-scale head (brain meshes used to explode this).
      headSize.x = Math.min(Math.max(headSize.x, 0.12), 0.28)
      headSize.y = Math.min(Math.max(headSize.y, 0.12), 0.3)
      headSize.z = Math.min(Math.max(headSize.z, 0.14), 0.32)
    } else {
      headCenter.set(bodyCenter.x, worldBox.max.y - 0.08, bodyCenter.z)
      headSize.set(0.14, 0.15, 0.18)
    }

    // Remove prior hair if effect re-runs
    const existing = root.getObjectByName('atlas_hair')
    if (existing) root.remove(existing)

    const hair = buildProceduralHair(headCenter, headSize)
    root.add(hair)
    hairRef.current = hair
    hairBaseScale.current.copy(hair.scale)

    hair.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      names.push(mesh.name)
      entries.push({
        mesh,
        id: mesh.name,
        system: 'integumentary',
        basePosition: mesh.position.clone(),
        baseScale: mesh.scale.clone(),
        explodeDir: headCenter.clone().sub(bodyCenter).normalize().multiplyScalar(EXPLODE_MAX),
        group: 'hair',
        materials: mats,
      })
      mesh.userData.atlasId = mesh.name
    })

    entriesRef.current = entries
    const flags = detectAvailableMorphs(names)
    // Procedural hair + skin soft morphs always available
    flags.hair = true
    flags.skin = true
    flags.butt = true
    flags.arm = true
    flags.chest = true
    setAvailableMorphs(flags)
  }, [root, setAvailableMorphs])

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-10 * dt)
    explodeAmt.current += (explodeAmount - explodeAmt.current) * k

    if (groupRef.current) {
      const h = morphs.height
      groupRef.current.scale.setScalar(h)
    }

    const hairHex = hairColorFromMorph(morphs.hairColor)
    const skinHex = skinColorFromMorph(morphs.skinTone)
    const skinOp = morphs.skinOpacity

    const softKey = [
      morphs.chestSize,
      morphs.buttSize,
      morphs.shoulderWidth,
      morphs.armLength,
    ].join('|')
    if (softKey !== softMorphKey.current) {
      softMorphKey.current = softKey
      for (const entry of entriesRef.current) {
        if (entry.group === 'skin' || entry.id === 'VH_F_skin') {
          applySkinSoftMorph(entry, morphs)
        }
      }
    }

    // Hair group length/volume
    if (hairRef.current) {
      const len = 0.55 + morphs.hairLength * 0.95
      const vol = 0.78 + morphs.hairLength * 0.4
      hairRef.current.scale.set(
        hairBaseScale.current.x * vol,
        hairBaseScale.current.y * len,
        hairBaseScale.current.z * vol,
      )
      // Keep hair with integumentary visibility
      hairRef.current.visible = Boolean(visibleSystems.integumentary)
    }

    for (const entry of entriesRef.current) {
      const mesh = entry.mesh
      const isHair = entry.group === 'hair'
      const isSkin = entry.group === 'skin' || entry.id === 'VH_F_skin'
      const visible = visibleSystems[entry.system]
      const isSel = selectedId === entry.id
      const faded = Boolean(isolate && selectedId && !isSel)
      mesh.visible = Boolean(visible) && !faded

      const target = tmp.current
        .copy(entry.basePosition)
        .addScaledVector(entry.explodeDir, explodeAmt.current)
      mesh.position.lerp(target, k)

      if (!isHair) {
        const [mx, my, mz] = morphScaleForGroup(entry.group, morphs)
        mesh.scale.set(
          entry.baseScale.x * mx,
          entry.baseScale.y * my,
          entry.baseScale.z * mz,
        )
      }

      for (const mat of entry.materials) {
        if (
          mat instanceof THREE.MeshStandardMaterial ||
          mat instanceof THREE.MeshPhysicalMaterial
        ) {
          const highlight = isSel || hoveredId === entry.id
          mat.emissive.set(highlight ? '#d4a574' : '#000000')
          mat.emissiveIntensity = isSel ? 0.5 : hoveredId === entry.id ? 0.25 : 0

          if (isHair) {
            mat.color.set(hairHex)
            mat.vertexColors = false
          }
          if (isSkin) {
            mat.color.set(skinHex)
            mat.vertexColors = false
            // Only transparent when meaningfully translucent — avoids depth-sort disappearance.
            const translucent = skinOp < 0.98
            mat.transparent = translucent
            mat.opacity = translucent ? skinOp : 1
            mat.depthWrite = !translucent || skinOp > 0.85
            if (mat instanceof THREE.MeshPhysicalMaterial) {
              mat.transmission = skinOp < 0.55 ? (1 - skinOp) * 0.25 : 0
            }
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
