export const SYSTEMS = [
  'skeletal',
  'muscular',
  'circulatory',
  'respiratory',
  'digestive',
  'urinary',
  'reproductive',
  'nervous',
] as const

export type AnatomySystem = (typeof SYSTEMS)[number]

export const SYSTEM_META: Record<
  AnatomySystem,
  { label: string; color: string; blurb: string }
> = {
  skeletal: {
    label: 'Skeletal',
    color: '#e6d3b4',
    blurb: 'Bones and joints that frame stature, gait, and the wider female pelvis.',
  },
  muscular: {
    label: 'Muscular',
    color: '#b24a5a',
    blurb: 'Major muscle groups that move the limbs, stabilize the trunk, and shape the hip.',
  },
  circulatory: {
    label: 'Circulatory',
    color: '#c0392b',
    blurb: 'Heart and great vessels that distribute blood through the thorax and pelvis.',
  },
  respiratory: {
    label: 'Respiratory',
    color: '#e8a5a0',
    blurb: 'Airways and lungs that exchange gases within the ribcage.',
  },
  digestive: {
    label: 'Digestive',
    color: '#c9844a',
    blurb: 'Organs that process food from esophagus to intestine.',
  },
  urinary: {
    label: 'Urinary',
    color: '#d4b45a',
    blurb: 'Kidneys, ureters, and bladder that filter blood and store urine.',
  },
  reproductive: {
    label: 'Reproductive',
    color: '#c4788a',
    blurb: 'Internal female reproductive organs and mammary glands, shown anatomically.',
  },
  nervous: {
    label: 'Nervous',
    color: '#b8a8d0',
    blurb: 'Brain and spinal cord — the central axis of sensation and control.',
  },
}

export const PRESETS = ['all', 'skeleton', 'organs', 'reproductive'] as const
export type PresetId = (typeof PRESETS)[number]

export type Vec3 = [number, number, number]

export type PrimitiveKind =
  | 'sphere'
  | 'capsule'
  | 'box'
  | 'cylinder'
  | 'torus'
  | 'cone'

export type Primitive = {
  kind: PrimitiveKind
  args: number[]
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}

export type AnatomyPart = {
  id: string
  name: string
  system: AnatomySystem
  description: string
  position: Vec3
  rotation?: Vec3
  primitives: Primitive[]
  color: string
  opacity?: number
}
