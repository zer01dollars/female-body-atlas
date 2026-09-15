import * as THREE from 'three'

/** Build a lightweight hair cap + strand cards aligned to HuBMAP head bounds. */
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
    roughness: 0.55,
    metalness: 0.02,
    sheen: 0.4,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color('#c4a06a'),
    side: THREE.DoubleSide,
  })

  const capGeo = new THREE.SphereGeometry(1, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.72)
  const cap = new THREE.Mesh(capGeo, mat.clone())
  cap.name = 'atlas_hair_cap'
  cap.scale.set(rx * 1.08, ry * 1.12, rz * 1.1)
  cap.position.set(0, ry * 0.12, -rz * 0.04)
  cap.castShadow = true
  group.add(cap)

  const bunGeo = new THREE.SphereGeometry(1, 20, 16)
  const back = new THREE.Mesh(bunGeo, mat.clone())
  back.name = 'atlas_hair_back'
  back.scale.set(rx * 0.88, ry * 1.0, rz * 0.95)
  back.position.set(0, -ry * 0.28, -rz * 0.48)
  back.castShadow = true
  group.add(back)

  const cardGeo = new THREE.PlaneGeometry(1, 1.4, 1, 4)
  for (const side of [-1, 1] as const) {
    const card = new THREE.Mesh(cardGeo, mat.clone())
    card.name = side < 0 ? 'atlas_hair_card_L' : 'atlas_hair_card_R'
    card.scale.set(rx * 0.48, ry * 1.35, 1)
    card.position.set(side * rx * 0.85, -ry * 0.45, -rz * 0.08)
    card.rotation.y = side * 0.35
    card.rotation.z = side * 0.12
    card.castShadow = true
    group.add(card)
  }

  const fringeGeo = new THREE.SphereGeometry(1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45)
  const fringe = new THREE.Mesh(fringeGeo, mat.clone())
  fringe.name = 'atlas_hair_fringe'
  fringe.scale.set(rx * 0.95, ry * 0.48, rz * 0.48)
  fringe.position.set(0, ry * 0.02, rz * 0.48)
  fringe.castShadow = true
  group.add(fringe)

  const lengthGeo = new THREE.CapsuleGeometry(0.35, 1.4, 4, 10)
  for (let i = 0; i < 5; i++) {
    const t = (i - 2) / 2
    const strand = new THREE.Mesh(lengthGeo, mat.clone())
    strand.name = `atlas_hair_strand_${i}`
    strand.scale.set(rx * 0.58, ry * 1.25, rz * 0.48)
    strand.position.set(t * rx * 0.45, -ry * 0.95, -rz * 0.58 - Math.abs(t) * 0.02)
    strand.rotation.x = 0.15
    strand.rotation.z = t * 0.08
    strand.castShadow = true
    group.add(strand)
  }

  group.position.copy(headCenter)
  group.position.y += headSize.y * 0.08
  group.position.z -= headSize.z * 0.015
  group.userData.atlasHair = true
  group.userData.baseScale = new THREE.Vector3(1, 1, 1)

  return group
}
