import * as THREE from 'three'

/**
 * Lightweight adult-female procedural hair for HuBMAP head bounds.
 * Soft ellipsoid layers (no capsule/plane cards) — dense scalp, back volume,
 * side fall, subtle fringe. Recolorable via MeshPhysicalMaterial.color.
 */
export function buildProceduralHair(
  headCenter: THREE.Vector3,
  headSize: THREE.Vector3,
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'atlas_hair'

  const rx = Math.max(0.065, headSize.x * 0.62)
  const ry = Math.max(0.055, headSize.y * 0.55)
  const rz = Math.max(0.07, headSize.z * 0.6)

  const mat = new THREE.MeshPhysicalMaterial({
    color: '#4a2a1c',
    roughness: 0.52,
    metalness: 0.02,
    sheen: 0.45,
    sheenRoughness: 0.42,
    sheenColor: new THREE.Color('#c4a06a'),
    side: THREE.DoubleSide,
  })

  const sphere = (w = 20, h = 16, phiLen = Math.PI) =>
    new THREE.SphereGeometry(1, w, h, 0, Math.PI * 2, 0, phiLen)

  const add = (
    name: string,
    geo: THREE.BufferGeometry,
    sx: number,
    sy: number,
    sz: number,
    px: number,
    py: number,
    pz: number,
    rxA = 0,
    ryA = 0,
    rzA = 0,
  ) => {
    const mesh = new THREE.Mesh(geo, mat.clone())
    mesh.name = name
    mesh.scale.set(sx, sy, sz)
    mesh.position.set(px, py, pz)
    mesh.rotation.set(rxA, ryA, rzA)
    mesh.castShadow = true
    group.add(mesh)
  }

  // Dense scalp cap — hugs the skull (tight upper dome)
  const capGeo = sphere(32, 22, Math.PI * 0.56)
  add('atlas_hair_cap', capGeo, rx * 1.05, ry * 1.02, rz * 1.06, 0, ry * 0.2, -rz * 0.015)

  // Secondary scalp fill for density / seam coverage
  const fillGeo = sphere(28, 18, Math.PI * 0.48)
  add(
    'atlas_hair_fill',
    fillGeo,
    rx * 1.12,
    ry * 0.92,
    rz * 1.14,
    0,
    ry * 0.1,
    -rz * 0.05,
  )

  // Layered back volume (stacked soft ellipsoids)
  const backGeo = sphere(22, 16)
  const backLayers: Array<[string, number, number, number, number, number, number]> = [
    ['atlas_hair_back_0', 0.98, 0.78, 0.92, 0, -ry * 0.12, -rz * 0.4],
    ['atlas_hair_back_1', 0.9, 0.98, 0.86, 0, -ry * 0.42, -rz * 0.54],
    ['atlas_hair_back_2', 0.8, 1.12, 0.74, 0, -ry * 0.72, -rz * 0.6],
    ['atlas_hair_back_3', 0.68, 1.08, 0.6, 0, -ry * 1.0, -rz * 0.55],
  ]
  for (const [n, sx, sy, sz, px, py, pz] of backLayers) {
    add(n, backGeo, rx * sx, ry * sy, rz * sz, px, py, pz)
  }

  // Side fall — tapered temple-to-shoulder ellipsoids
  const sideGeo = sphere(16, 14)
  for (const side of [-1, 1] as const) {
    const tag = side < 0 ? 'L' : 'R'
    add(
      `atlas_hair_side_${tag}0`,
      sideGeo,
      rx * 0.36,
      ry * 0.92,
      rz * 0.4,
      side * rx * 0.9,
      -ry * 0.28,
      -rz * 0.02,
      0.08,
      side * 0.22,
      side * 0.16,
    )
    add(
      `atlas_hair_side_${tag}1`,
      sideGeo,
      rx * 0.3,
      ry * 1.12,
      rz * 0.34,
      side * rx * 0.78,
      -ry * 0.68,
      -rz * 0.1,
      0.16,
      side * 0.18,
      side * 0.1,
    )
    add(
      `atlas_hair_side_${tag}2`,
      sideGeo,
      rx * 0.26,
      ry * 0.95,
      rz * 0.3,
      side * rx * 0.62,
      -ry * 0.98,
      -rz * 0.22,
      0.22,
      side * 0.12,
      side * 0.06,
    )
  }

  // Subtle fringe / bangs — soft front band + light side sweeps
  const fringeGeo = sphere(20, 12, Math.PI * 0.4)
  add(
    'atlas_hair_fringe',
    fringeGeo,
    rx * 0.9,
    ry * 0.34,
    rz * 0.4,
    0,
    ry * 0.14,
    rz * 0.5,
    0.32,
    0,
    0,
  )
  for (const side of [-1, 1] as const) {
    add(
      side < 0 ? 'atlas_hair_fringe_L' : 'atlas_hair_fringe_R',
      fringeGeo,
      rx * 0.4,
      ry * 0.28,
      rz * 0.26,
      side * rx * 0.45,
      ry * 0.04,
      rz * 0.46,
      0.38,
      side * 0.32,
      side * 0.12,
    )
  }

  group.position.copy(headCenter)
  group.position.y += headSize.y * 0.08
  group.position.z -= headSize.z * 0.015
  group.userData.atlasHair = true
  group.userData.baseScale = new THREE.Vector3(1, 1, 1)

  return group
}
