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

const ALL_VISIBLE = Object.fromEntries(SYSTEMS.map((s) => [s, true])) as Record<
  AnatomySystem,
  boolean
>

const PRESET_SYSTEMS: Record<PresetId, AnatomySystem[]> = {
  all: [...SYSTEMS],
  skeleton: ['skeletal'],
  organs: [
    'circulatory',
    'respiratory',
    'digestive',
    'urinary',
    'reproductive',
    'nervous',
  ],
  reproductive: ['reproductive', 'urinary', 'skeletal'],
}

export type AtlasContextValue = {
  selectedId: string | null
  hoveredId: string | null
  visibleSystems: Record<AnatomySystem, boolean>
  explode: boolean
  isolate: boolean
  showSilhouette: boolean
  search: string
  preset: PresetId
  morphs: MorphAttributes
  select: (id: string | null) => void
  hover: (id: string | null) => void
  toggleSystem: (system: AnatomySystem) => void
  applyPreset: (preset: PresetId) => void
  setExplode: (value: boolean) => void
  setIsolate: (value: boolean) => void
  setShowSilhouette: (value: boolean) => void
  setSearch: (query: string) => void
  setMorph: <K extends keyof MorphAttributes>(key: K, value: MorphAttributes[K]) => void
  resetMorphs: () => void
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
  const [explode, setExplode] = useState(false)
  const [isolate, setIsolate] = useState(false)
  const [showSilhouette, setShowSilhouette] = useState(true)
  const [search, setSearch] = useState('')
  const [preset, setPreset] = useState<PresetId>('all')
  const [morphs, setMorphs] = useState<MorphAttributes>(DEFAULT_MORPHS)
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
      setSelectedId('uterus')
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
        p.system.toLowerCase().includes(q),
    )
  }, [search])

  const value = useMemo<AtlasContextValue>(
    () => ({
      selectedId,
      hoveredId,
      visibleSystems,
      explode,
      isolate,
      showSilhouette,
      search,
      preset,
      morphs,
      select,
      hover,
      toggleSystem,
      applyPreset,
      setExplode,
      setIsolate,
      setShowSilhouette,
      setSearch,
      setMorph,
      resetMorphs,
      markPointerDown,
      markPointerMove,
      wasTap,
      filteredParts,
    }),
    [
      selectedId,
      hoveredId,
      visibleSystems,
      explode,
      isolate,
      showSilhouette,
      search,
      preset,
      morphs,
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
