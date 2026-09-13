export const SYSTEMS = [
  'skeletal',
  'muscular',
  'circulatory',
  'respiratory',
  'digestive',
  'urinary',
  'reproductive',
  'nervous',
  'lymphatic',
  'integumentary',
] as const

export type AnatomySystem = (typeof SYSTEMS)[number]

export const SYSTEM_META: Record<
  AnatomySystem,
  { label: string; color: string; blurb: string }
> = {
  skeletal: {
    label: 'Skeletal',
    color: '#e6d3b4',
    blurb: 'Pelvis, vertebrae, and knee complex from the HuBMAP female reference skeleton.',
  },
  muscular: {
    label: 'Muscular',
    color: '#b24a5a',
    blurb: 'Available muscle meshes in the female reference (ocular muscles and rectus femoris).',
  },
  circulatory: {
    label: 'Circulatory',
    color: '#c0392b',
    blurb: 'Heart chambers, valves, and organ-associated vasculature.',
  },
  respiratory: {
    label: 'Respiratory',
    color: '#e8a5a0',
    blurb: 'Lungs, larynx, and tracheobronchial tree.',
  },
  digestive: {
    label: 'Digestive',
    color: '#c9844a',
    blurb: 'Liver, pancreas, biliary tree, intestines, and related ducts.',
  },
  urinary: {
    label: 'Urinary',
    color: '#d4b45a',
    blurb: 'Kidneys, ureters, and urinary bladder.',
  },
  reproductive: {
    label: 'Reproductive',
    color: '#c4788a',
    blurb: 'Uterus, ovaries, fallopian tubes, vagina, placenta, and mammary gland.',
  },
  nervous: {
    label: 'Nervous',
    color: '#b8a8d0',
    blurb: 'Spinal cord, eyes, and Allen Brain Atlas regions.',
  },
  lymphatic: {
    label: 'Lymphatic',
    color: '#7a9e8a',
    blurb: 'Spleen, thymus, and lymph-node microanatomy.',
  },
  integumentary: {
    label: 'Integumentary',
    color: '#c4a882',
    blurb: 'Body skin surface. Toggle off or keep translucent to reveal organs.',
  },
}

export const PRESETS = ['all', 'skeleton', 'organs', 'reproductive'] as const
export type PresetId = (typeof PRESETS)[number]

export type AnatomyPart = {
  id: string
  name: string
  system: AnatomySystem
  description: string
  fmaId?: string | null
}

export type { MorphAttributes } from './morphs'
export { DEFAULT_MORPHS, MORPH_META } from './morphs'
