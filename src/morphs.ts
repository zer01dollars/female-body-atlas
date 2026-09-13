/** Morph attribute helpers — educational proportion customization. */

export type MorphAttributes = {
  /** 0–1 continuous hair pigment (dark → warm brown → auburn → blonde → light). */
  hairColor: number
  /** 0 lean ↔ 1 more developed musculature (bulk on muscle meshes). */
  musculature: number
  /** Soft-tissue chest / mammary scale. */
  chestSize: number
  /** Gluteal soft-tissue scale. */
  buttSize: number
  /** Overall stature (Y scale); feet stay grounded. */
  height: number
  /** Upper-limb length along the arm axis. */
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

/** Map hairColor slider 0–1 to a tasteful natural hair hex. */
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

export const MUSCLE_BULK_IDS = new Set([
  'trapezius',
  'deltoid-left',
  'deltoid-right',
  'pectoralis',
  'biceps-left',
  'biceps-right',
  'rectus-abdominis',
  'obliques',
  'gluteus-left',
  'gluteus-right',
  'quadriceps-left',
  'quadriceps-right',
  'hamstrings-left',
  'hamstrings-right',
  'calf-left',
  'calf-right',
])

export const CHEST_IDS = new Set(['mammary-left', 'mammary-right'])

export const BUTT_IDS = new Set(['gluteus-left', 'gluteus-right'])

/** Parts whose length stretches with armLength (bones + soft tissue along the limb). */
export const ARM_LENGTH_IDS = new Set([
  'humerus-left',
  'humerus-right',
  'forearm-left',
  'forearm-right',
  'hand-left',
  'hand-right',
  'biceps-left',
  'biceps-right',
  'deltoid-left',
  'deltoid-right',
])

/** Shoulder anchors for left / right arm chains (world units). */
export const ARM_SHOULDER: Record<'left' | 'right', [number, number, number]> = {
  left: [1.22, 13.52, 0.02],
  right: [-1.22, 13.52, 0.02],
}

export function armSide(id: string): 'left' | 'right' | null {
  if (id.endsWith('-left')) return 'left'
  if (id.endsWith('-right')) return 'right'
  return null
}

export type Vec3Tuple = [number, number, number]

/** Local mesh scale multipliers from morphs (applied on top of primitive.scale). */
export function morphScaleForPart(
  id: string,
  morphs: MorphAttributes,
): Vec3Tuple {
  let sx = 1
  let sy = 1
  let sz = 1

  if (MUSCLE_BULK_IDS.has(id)) {
    // Lean → muscular: mostly radial bulk, slight length hold
    const m = 0.78 + morphs.musculature * 0.52
    sx *= m
    sy *= 0.92 + morphs.musculature * 0.16
    sz *= m
  }

  if (CHEST_IDS.has(id)) {
    const c = 0.68 + morphs.chestSize * 0.72
    sx *= c
    sy *= 0.75 + morphs.chestSize * 0.55
    sz *= c
  }

  if (BUTT_IDS.has(id)) {
    const b = 0.7 + morphs.buttSize * 0.7
    sx *= b
    sy *= 0.82 + morphs.buttSize * 0.4
    sz *= b
  }

  if (ARM_LENGTH_IDS.has(id)) {
    // Stretch along the bone/long axis (capsules are Y-up)
    const isHand = id.startsWith('hand-')
    const isDeltoid = id.startsWith('deltoid-')
    if (isHand) {
      // Hands keep size; only position shifts via morphPositionForPart
    } else if (isDeltoid) {
      sy *= 0.94 + (morphs.armLength - 1) * 0.35
    } else {
      sy *= morphs.armLength
    }
  }

  return [sx, sy, sz]
}

/** Reposition distal arm parts so lengthening keeps the chain attached at the shoulder. */
export function morphPositionForPart(
  id: string,
  base: Vec3Tuple,
  morphs: MorphAttributes,
): Vec3Tuple {
  if (!ARM_LENGTH_IDS.has(id)) return base
  const side = armSide(id)
  if (!side) return base
  const [ax, ay, az] = ARM_SHOULDER[side]
  const k = morphs.armLength
  return [
    ax + (base[0] - ax) * k,
    ay + (base[1] - ay) * k,
    az + (base[2] - az) * k,
  ]
}
