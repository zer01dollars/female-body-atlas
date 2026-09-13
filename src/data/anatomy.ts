import type { AnatomyPart, AnatomySystem } from '../types'
import { MESH_CATALOG } from './mesh-catalog'

export const ANATOMY: AnatomyPart[] = MESH_CATALOG

export const ANATOMY_BY_ID: Record<string, AnatomyPart> = Object.fromEntries(
  ANATOMY.map((p) => [p.id, p]),
)

export function systemForMeshId(id: string): AnatomySystem | null {
  return ANATOMY_BY_ID[id]?.system ?? null
}
