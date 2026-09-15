import {
  hairColorFromMorph,
  MORPH_META,
  skinColorFromMorph,
  type MorphAttributes,
} from '../morphs'
import { useAtlas } from '../state/AtlasProvider'

const ORDER: (keyof MorphAttributes)[] = [
  'skinTone',
  'skinOpacity',
  'hairColor',
  'hairLength',
  'musculature',
  'chestSize',
  'buttSize',
  'height',
  'shoulderWidth',
  'armLength',
]

function morphKeyAvailable(
  key: keyof MorphAttributes,
  available: ReturnType<typeof useAtlas>['availableMorphs'],
): boolean {
  if (key === 'skinTone' || key === 'skinOpacity') return available.skin
  if (key === 'hairColor' || key === 'hairLength') return available.hair
  if (key === 'musculature') return available.muscle
  if (key === 'chestSize') return available.chest
  if (key === 'buttSize') return available.butt
  if (key === 'armLength' || key === 'shoulderWidth') return available.arm
  if (key === 'height') return true
  return true
}

export function MorphPanel() {
  const { morphs, setMorph, resetMorphs, availableMorphs } = useAtlas()
  const hair = hairColorFromMorph(morphs.hairColor)
  const skin = skinColorFromMorph(morphs.skinTone)
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
        Live morphs on HuBMAP skin/organs plus procedural hair. Best-effort proportions — not clinical
        or cosmetic advice.
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
                    {key === 'skinTone' ? (
                      <i className="hair-swatch" style={{ background: skin }} aria-hidden />
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
