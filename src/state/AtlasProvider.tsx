import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ANATOMY } from '../data/anatomy'
import {
  DEFAULT_MORPHS,
  type MorphAttributes,
} from '../morphs'
import {
  SYSTEMS,
  type AnatomySystem,
  type PresetId,
} from '../types'

/** Default: Normal / Complete — full person with skin on. */
const ALL_VISIBLE = Object.fromEntries(SYSTEMS.map((s) => [s, true])) as Record<
  AnatomySystem,
  boolean
>

const PRESET_SYSTEMS: Record<PresetId, AnatomySystem[]> = {
  normal: [...SYSTEMS],
  all: SYSTEMS.filter((s) => s !== 'integumentary'),
  skeleton: ['skeletal'],
  organs: [
    'circulatory',
    'respiratory',
    'digestive',
    'urinary',
    'reproductive',
    'nervous',
    'lymphatic',
  ],
  reproductive: ['reproductive', 'urinary', 'skeletal'],
}

export type AvailableMorphs = {
  hair: boolean
  muscle: boolean
  chest: boolean
  butt: boolean
  arm: boolean
  skin: boolean
}

export type AtlasContextValue = {
  selectedId: string | null
  hoveredId: string | null
  visibleSystems: Record<AnatomySystem, boolean>
  /** 0 = assembled, 1 = fully exploded. */
  explodeAmount: number
  isolate: boolean
  drawerOpen: boolean
  search: string
  preset: PresetId
  morphs: MorphAttributes
  availableMorphs: AvailableMorphs
  select: (id: string | null) => void
  hover: (id: string | null) => void
  toggleSystem: (system: AnatomySystem) => void
  applyPreset: (preset: PresetId) => void
  setExplodeAmount: (value: number) => void
  setIsolate: (value: boolean) => void
  setDrawerOpen: (value: boolean) => void
  setSearch: (query: string) => void
  setMorph: <K extends keyof MorphAttributes>(key: K, value: MorphAttributes[K]) => void
  resetMorphs: () => void
  setAvailableMorphs: (flags: AvailableMorphs) => void
  markPointerDown: (x: number, y: number) => void
  markPointerMove: (x: number, y: number) => void
  wasTap: () => boolean
  filteredParts: typeof ANATOMY
}

const AtlasContext = createContext<AtlasContextValue | null>(null)

export function AtlasProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [visibleSystems, setVisibleSystems] =
    useState<Record<AnatomySystem, boolean>>(ALL_VISIBLE)
  const [explodeAmount, setExplodeAmount] = useState(0)
  const [isolate, setIsolate] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [preset, setPreset] = useState<PresetId>('normal')
  const [morphs, setMorphs] = useState<MorphAttributes>(DEFAULT_MORPHS)
  const [availableMorphs, setAvailableMorphs] = useState<AvailableMorphs>({
    hair: true,
    muscle: true,
    chest: true,
    butt: true,
    arm: true,
    skin: true,
  })
  const pointer = useRef({ x: 0, y: 0, dragged: false })

  const select = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const hover = useCallback((id: string | null) => {
    setHoveredId(id)
  }, [])

  const toggleSystem = useCallback((system: AnatomySystem) => {
    setVisibleSystems((prev) => ({ ...prev, [system]: !prev[system] }))
    setPreset('all')
  }, [])

  const applyPreset = useCallback((next: PresetId) => {
    const enabled = new Set(PRESET_SYSTEMS[next])
    setVisibleSystems(
      Object.fromEntries(SYSTEMS.map((s) => [s, enabled.has(s)])) as Record<
        AnatomySystem,
        boolean
      >,
    )
    setPreset(next)
    if (next === 'reproductive') {
      const hit =
        ANATOMY.find((p) => p.id === 'VH_F_uterus') ||
        ANATOMY.find(
          (p) =>
            p.system === 'reproductive' &&
            /uterus/i.test(p.id) &&
            !/ligament|vasculature|blood/i.test(p.id),
        )
      if (hit) setSelectedId(hit.id)
    }
  }, [])

  const setMorph = useCallback(
    <K extends keyof MorphAttributes>(key: K, value: MorphAttributes[K]) => {
      setMorphs((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const resetMorphs = useCallback(() => {
    setMorphs({ ...DEFAULT_MORPHS })
  }, [])

  const markPointerDown = useCallback((x: number, y: number) => {
    pointer.current = { x, y, dragged: false }
  }, [])

  const markPointerMove = useCallback((x: number, y: number) => {
    const dx = x - pointer.current.x
    const dy = y - pointer.current.y
    if (dx * dx + dy * dy > 25) pointer.current.dragged = true
  }, [])

  const wasTap = useCallback(() => !pointer.current.dragged, [])

  const filteredParts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ANATOMY
    return ANATOMY.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.system.toLowerCase().includes(q) ||
        (p.fmaId && p.fmaId.toLowerCase().includes(q)),
    )
  }, [search])

  const value = useMemo<AtlasContextValue>(
    () => ({
      selectedId,
      hoveredId,
      visibleSystems,
      explodeAmount,
      isolate,
      drawerOpen,
      search,
      preset,
      morphs,
      availableMorphs,
      select,
      hover,
      toggleSystem,
      applyPreset,
      setExplodeAmount,
      setIsolate,
      setDrawerOpen,
      setSearch,
      setMorph,
      resetMorphs,
      setAvailableMorphs,
      markPointerDown,
      markPointerMove,
      wasTap,
      filteredParts,
    }),
    [
      selectedId,
      hoveredId,
      visibleSystems,
      explodeAmount,
      isolate,
      drawerOpen,
      search,
      preset,
      morphs,
      availableMorphs,
      select,
      hover,
      toggleSystem,
      applyPreset,
      setMorph,
      resetMorphs,
      markPointerDown,
      markPointerMove,
      wasTap,
      filteredParts,
    ],
  )

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>
}

export function useAtlas() {
  const ctx = useContext(AtlasContext)
  if (!ctx) throw new Error('useAtlas must be used within AtlasProvider')
  return ctx
}
