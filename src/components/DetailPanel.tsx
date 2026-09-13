import { ANATOMY_BY_ID } from '../data/anatomy'
import { SYSTEM_META } from '../types'
import { useAtlas } from '../state/AtlasProvider'

export function DetailPanel() {
  const { selectedId, select, setIsolate, isolate } = useAtlas()
  const part = selectedId ? ANATOMY_BY_ID[selectedId] : undefined

  return (
    <aside
      className={`detail ${part ? 'detail-open' : ''}`}
      aria-live="polite"
    >
      {part ? (
        <>
          <div className="detail-handle" aria-hidden="true" />
          <div className="detail-top">
            <p
              className="detail-system"
              style={{ color: SYSTEM_META[part.system].color }}
            >
              {SYSTEM_META[part.system].label}
            </p>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close details"
              onClick={() => {
                select(null)
                setIsolate(false)
              }}
            >
              ×
            </button>
          </div>
          <h2>{part.name}</h2>
          <p className="detail-id">{part.id}</p>
          <p className="detail-copy">{part.description}</p>
          <p className="detail-context">{SYSTEM_META[part.system].blurb}</p>
          <button
            type="button"
            className="text-btn"
            onClick={() => setIsolate(!isolate)}
          >
            {isolate ? 'Show surrounding structures' : 'Isolate this structure'}
          </button>
        </>
      ) : (
        <div className="detail-empty">
          <h2>Inspect a structure</h2>
          <p>
            Click or tap a part of the figure. Drag to orbit. Use systems and
            presets to peel the body into layers.
          </p>
        </div>
      )}
    </aside>
  )
}
