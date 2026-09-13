import {
  hairColorFromMorph,
  MORPH_META,
  type MorphAttributes,
} from '../morphs'
import { useAtlas } from '../state/AtlasProvider'

const ORDER: (keyof MorphAttributes)[] = [
  'hairColor',
  'musculature',
  'chestSize',
  'buttSize',
  'height',
  'armLength',
]

function morphKeyAvailable(
  key: keyof MorphAttributes,
  available: ReturnType<typeof useAtlas>['availableMorphs'],
): boolean {
  if (key === 'hairColor') return available.hair
  if (key === 'musculature') return available.muscle
  if (key === 'chestSize') return available.chest
  if (key === 'buttSize') return available.butt
  if (key === 'armLength') return available.arm
  if (key === 'height') return true
  return true
}

export function MorphPanel() {
  const { morphs, setMorph, resetMorphs, availableMorphs } = useAtlas()
  const hair = hairColorFromMorph(morphs.hairColor)
  const visibleKeys = ORDER.filter((k) => morphKeyAvailable(k, availableMorphs))

  return (
    <section className="morph-panel" aria-label="Body attributes">
      <div className="morph-head">
        <h3>Body attributes</h3>
        <button type="button" className="text-btn morph-reset" onClick={resetMorphs}>
          Reset
        </button>
      </div>
      <p className="morph-blurb">
        Best-effort proportion tweaks on matching HuBMAP meshes (scale / material).
        Not a clinical or cosmetic tool.
      </p>
      {visibleKeys.length === 0 ? (
        <p className="morph-blurb">No morph targets detected on this model.</p>
      ) : (
        <ul className="morph-list">
          {visibleKeys.map((key) => {
            const meta = MORPH_META[key]
            const value = morphs[key]
            return (
              <li key={key} className="morph-row">
                <div className="morph-label-row">
                  <label htmlFor={`morph-${key}`}>{meta.label}</label>
                  <span className="morph-value">
                    {key === 'hairColor' ? (
                      <i className="hair-swatch" style={{ background: hair }} aria-hidden />
                    ) : null}
                    {value.toFixed(2)}
                  </span>
                </div>
                <input
                  id={`morph-${key}`}
                  className="morph-slider"
                  type="range"
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  value={value}
                  onChange={(e) => setMorph(key, Number(e.target.value))}
                />
                <div className="morph-ends">
                  <span>{meta.left}</span>
                  <span>{meta.right}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
