import { ANATOMY } from '../data/anatomy'
import { AnatomyPartMesh } from './AnatomyPartMesh'
import { Silhouette } from './Silhouette'

export function FemaleBody() {
  return (
    <group>
      <Silhouette />
      {ANATOMY.map((part) => (
        <AnatomyPartMesh key={part.id} part={part} />
      ))}
    </group>
  )
}
