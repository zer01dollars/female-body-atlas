import { ANATOMY } from '../data/anatomy'
import { useAtlas } from '../state/AtlasProvider'
import { AnatomyPartMesh } from './AnatomyPartMesh'
import { Silhouette } from './Silhouette'

export function FemaleBody() {
  const { morphs } = useAtlas()
  // Scale stature on Y with pivot at the feet (y ≈ 0) so the figure stays grounded.
  const h = morphs.height

  return (
    <group scale={[1, h, 1]}>
      <Silhouette />
      {ANATOMY.map((part) => (
        <AnatomyPartMesh key={part.id} part={part} />
      ))}
    </group>
  )
}
