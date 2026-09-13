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

export function MorphPanel() {
  const { morphs, setMorph, resetMorphs } = useAtlas()
  const hair = hairColorFromMorph(morphs.hairColor)

  return (
    <section className="morph-panel" aria-label="Body attributes">
      <div className="morph-head">
        <h2>Body attributes</h2>
        <button type="button" className="text-btn morph-reset" onClick={resetMorphs}>
          Reset
        </button>
      </div>
      <p className="morph-blurb">
        Live anatomical customization for proportion study — stylized soft-tissue
        and limb scales, not a clinical or cosmetic tool.
      </p>
      <ul className="morph-list">
        {ORDER.map((key) => {
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
                aria-valuemin={meta.min}
                aria-valuemax={meta.max}
                aria-valuenow={value}
              />
              <div className="morph-ends">
                <span>{meta.left}</span>
                <span>{meta.right}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
