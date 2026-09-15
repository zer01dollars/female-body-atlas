/** Morph attribute helpers — scales / materials on HuBMAP meshes + procedural hair. */

export type MorphAttributes = {
  /** 0 fair ↔ 1 deep skin pigment. */
  skinTone: number
  /** 0 ghost ↔ 1 fully opaque skin. */
  skinOpacity: number
  /** 0–1 hair pigment. */
  hairColor: number
  /** 0 short/cropped ↔ 1 long/voluminous hair. */
  hairLength: number
  /** 0 lean ↔ 1 more developed musculature (bulk on muscle meshes). */
  musculature: number
  /** Soft-tissue chest / mammary scale. */
  chestSize: number
  /** Gluteal / lower soft-tissue scale (skin region + pelvic meshes). */
  buttSize: number
  /** Overall stature (Y scale). */
  height: number
  /** Upper-limb length stretch (skin arm band + arm bones if present). */
  armLength: number
  /** Biacromial / shoulder breadth (skin upper torso X). */
  shoulderWidth: number
}

export const DEFAULT_MORPHS: MorphAttributes = {
  skinTone: 0.42,
  skinOpacity: 1,
  hairColor: 0.32,
  hairLength: 0.55,
  musculature: 0.42,
  chestSize: 0.5,
  buttSize: 0.5,
  height: 1,
  armLength: 1,
  shoulderWidth: 1,
}

export const MORPH_META: Record<
  keyof MorphAttributes,
  { label: string; min: number; max: number; step: number; left: string; right: string }
> = {
  skinTone: {
    label: 'Skin tone',
    min: 0,
    max: 1,
    step: 0.01,
    left: 'Fair',
    right: 'Deep',
  },
  skinOpacity: {
    label: 'Skin opacity',
    min: 0,
    max: 1,
    step: 0.01,
    left: 'Ghost',
    right: 'Opaque',
  },
  hairColor: {
    label: 'Hair color',
    min: 0,
    max: 1,
    step: 0.01,
    left: 'Dark',
    right: 'Light',
  },
  hairLength: {
    label: 'Hair length',
    min: 0,
    max: 1,
    step: 0.01,
    left: 'Short',
    right: 'Long',
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
  shoulderWidth: {
    label: 'Shoulder width',
    min: 0.88,
    max: 1.14,
    step: 0.005,
    left: 'Narrower',
    right: 'Wider',
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

const SKIN_STOPS: Array<{ t: number; hex: string }> = [
  { t: 0, hex: '#f3d7c4' },
  { t: 0.18, hex: '#e8c4a8' },
  { t: 0.35, hex: '#d4a574' },
  { t: 0.5, hex: '#c48a5a' },
  { t: 0.65, hex: '#a06b45' },
  { t: 0.8, hex: '#7a4a32' },
  { t: 1, hex: '#4a2c1e' },
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

function lerpStops(stops: Array<{ t: number; hex: string }>, t: number): string {
  const x = Math.min(1, Math.max(0, t))
  let i = 0
  while (i < stops.length - 2 && stops[i + 1].t < x) i++
  const a = stops[i]
  const b = stops[i + 1]
  const u = (x - a.t) / (b.t - a.t || 1)
  const [ar, ag, ab] = hexToRgb(a.hex)
  const [br, bg, bb] = hexToRgb(b.hex)
  return rgbToHex(ar + (br - ar) * u, ag + (bg - ag) * u, ab + (bb - ab) * u)
}

export function hairColorFromMorph(t: number): string {
  return lerpStops(HAIR_STOPS, t)
}

export function skinColorFromMorph(t: number): string {
  return lerpStops(SKIN_STOPS, t)
}

/** Classify a mesh node name into morph target groups. */
export type MorphGroup = 'hair' | 'muscle' | 'chest' | 'butt' | 'arm' | 'skin' | null

export function morphGroupForName(name: string): MorphGroup {
  const n = name.toLowerCase()
  if (/hair|scalp|eyebrow|atlas_hair/.test(n)) return 'hair'
  if (/^vh_f_skin$|integument|body_shell/.test(n)) return 'skin'
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
    const b = 1 + (morphs.buttSize - 0.5) * 1.4
    sx *= b
    sy *= 1 + (morphs.buttSize - 0.5) * 0.8
    sz *= b
  }
  if (group === 'arm') {
    sy *= morphs.armLength
  }
  if (group === 'hair') {
    const len = 0.55 + morphs.hairLength * 0.9
    const vol = 0.75 + morphs.hairLength * 0.45
    sx *= vol
    sy *= len
    sz *= vol
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
  skin: boolean
} {
  const flags = {
    hair: false,
    muscle: false,
    chest: false,
    butt: false,
    arm: false,
    skin: false,
  }
  for (const name of names) {
    const g = morphGroupForName(name)
    if (g === 'hair') flags.hair = true
    if (g === 'muscle') flags.muscle = true
    if (g === 'chest') flags.chest = true
    if (g === 'butt') flags.butt = true
    if (g === 'arm') flags.arm = true
    if (g === 'skin') flags.skin = true
  }
  return flags
}
