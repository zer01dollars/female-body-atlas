/** Morph attribute helpers — best-effort scales/material tweaks on HuBMAP meshes. */

export type MorphAttributes = {
  /** 0–1 hair pigment — only if a hair mesh exists. */
  hairColor: number
  /** 0 lean ↔ 1 more developed musculature (bulk on muscle meshes). */
  musculature: number
  /** Soft-tissue chest / mammary scale. */
  chestSize: number
  /** Gluteal / lower soft-tissue scale (best-effort). */
  buttSize: number
  /** Overall stature (Y scale). */
  height: number
  /** Upper-limb length stretch (best-effort if arm nodes exist). */
  armLength: number
}

export const DEFAULT_MORPHS: MorphAttributes = {
  hairColor: 0.32,
  musculature: 0.42,
  chestSize: 0.5,
  buttSize: 0.5,
  height: 1,
  armLength: 1,
}

export const MORPH_META: Record<
  keyof MorphAttributes,
  { label: string; min: number; max: number; step: number; left: string; right: string }
> = {
  hairColor: {
    label: 'Hair color',
    min: 0,
    max: 1,
    step: 0.01,
    left: 'Dark',
    right: 'Light',
  },
  musculature: {
    label: 'Musculature',
    min: 0,
    max: 1,
    step: 0.01,
    left: 'Lean',
    right: 'Muscular',
  },
  chestSize: {
    label: 'Chest size',
    min: 0,
    max: 1,
    step: 0.01,
    left: 'Smaller',
    right: 'Fuller',
  },
  buttSize: {
    label: 'Butt size',
    min: 0,
    max: 1,
    step: 0.01,
    left: 'Smaller',
    right: 'Fuller',
  },
  height: {
    label: 'Height',
    min: 0.88,
    max: 1.12,
    step: 0.005,
    left: 'Shorter',
    right: 'Taller',
  },
  armLength: {
    label: 'Arm length',
    min: 0.86,
    max: 1.16,
    step: 0.005,
    left: 'Shorter',
    right: 'Longer',
  },
}

const HAIR_STOPS: Array<{ t: number; hex: string }> = [
  { t: 0, hex: '#1a1210' },
  { t: 0.22, hex: '#2c1a14' },
  { t: 0.4, hex: '#4a2a1c' },
  { t: 0.55, hex: '#6b3a22' },
  { t: 0.7, hex: '#8a4a28' },
  { t: 0.85, hex: '#c4a06a' },
  { t: 1, hex: '#e2d2b0' },
]

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export function hairColorFromMorph(t: number): string {
  const x = Math.min(1, Math.max(0, t))
  let i = 0
  while (i < HAIR_STOPS.length - 2 && HAIR_STOPS[i + 1].t < x) i++
  const a = HAIR_STOPS[i]
  const b = HAIR_STOPS[i + 1]
  const u = (x - a.t) / (b.t - a.t || 1)
  const [ar, ag, ab] = hexToRgb(a.hex)
  const [br, bg, bb] = hexToRgb(b.hex)
  return rgbToHex(ar + (br - ar) * u, ag + (bg - ag) * u, ab + (bb - ab) * u)
}

/** Classify a mesh node name into morph target groups. */
export type MorphGroup = 'hair' | 'muscle' | 'chest' | 'butt' | 'arm' | null

export function morphGroupForName(name: string): MorphGroup {
  const n = name.toLowerCase()
  if (/hair|scalp|eyebrow/.test(n)) return 'hair'
  if (
    /mammary|nipple|areola|lactiferous|fat_[lr]$|fat_l|fat_r|areolar/.test(n)
  )
    return 'chest'
  if (/glute|butt|ischium/.test(n)) return 'butt'
  if (
    /muscle|muscular|rectus_femoris|extraocular|pectoral|deltoid|bicep|trapezius|quadriceps|hamstring|gastroc|soleus/.test(
      n,
    )
  )
    return 'muscle'
  if (
    /humerus|radius|ulna|scapula|clavicle|humer|forearm|hand_|wrist|metacarp/.test(
      n,
    )
  )
    return 'arm'
  return null
}

export type Vec3Tuple = [number, number, number]

export function morphScaleForGroup(
  group: MorphGroup,
  morphs: MorphAttributes,
): Vec3Tuple {
  let sx = 1
  let sy = 1
  let sz = 1
  if (group === 'muscle') {
    const m = 0.78 + morphs.musculature * 0.52
    sx *= m
    sy *= 0.92 + morphs.musculature * 0.16
    sz *= m
  }
  if (group === 'chest') {
    const c = 0.68 + morphs.chestSize * 0.72
    sx *= c
    sy *= 0.75 + morphs.chestSize * 0.55
    sz *= c
  }
  if (group === 'butt') {
    const b = 0.7 + morphs.buttSize * 0.7
    sx *= b
    sy *= 0.82 + morphs.buttSize * 0.4
    sz *= b
  }
  if (group === 'arm') {
    sy *= morphs.armLength
  }
  return [sx, sy, sz]
}

/** Which morph sliders have matching meshes in the loaded model. */
export function detectAvailableMorphs(names: string[]): {
  hair: boolean
  muscle: boolean
  chest: boolean
  butt: boolean
  arm: boolean
} {
  const flags = { hair: false, muscle: false, chest: false, butt: false, arm: false }
  for (const name of names) {
    const g = morphGroupForName(name)
    if (g === 'hair') flags.hair = true
    if (g === 'muscle') flags.muscle = true
    if (g === 'chest') flags.chest = true
    if (g === 'butt') flags.butt = true
    if (g === 'arm') flags.arm = true
  }
  return flags
}
