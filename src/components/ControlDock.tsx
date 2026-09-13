import { PRESETS, SYSTEMS, SYSTEM_META, type PresetId } from '../types'
import { useAtlas } from '../state/AtlasProvider'
import { MorphPanel } from './MorphPanel'

const PRESET_LABELS: Record<PresetId, string> = {
  all: 'All',
  skeleton: 'Skeleton',
  organs: 'Organs',
  reproductive: 'Reproductive',
}

export function ControlDock() {
  const {
    visibleSystems,
    toggleSystem,
    applyPreset,
    preset,
    explode,
    setExplode,
    isolate,
    setIsolate,
    selectedId,
    drawerOpen,
    setDrawerOpen,
  } = useAtlas()

  return (
    <aside
      className={`dock overlay-panel ${drawerOpen ? 'dock-open' : 'dock-closed'}`}
      aria-label="Anatomy controls"
      aria-hidden={!drawerOpen}
    >
      <div className="dock-head">
        <h2>Layers</h2>
        <button
          type="button"
          className="icon-btn"
          aria-label="Close controls"
          onClick={() => setDrawerOpen(false)}
        >
          ×
        </button>
      </div>

      <section>
        <h3>Presets</h3>
        <div className="chip-row">
          {PRESETS.map((id) => (
            <button
              key={id}
              type="button"
              className={`chip ${preset === id ? 'chip-active' : ''}`}
              onClick={() => applyPreset(id)}
            >
              {PRESET_LABELS[id]}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Systems</h3>
        <ul className="system-list">
          {SYSTEMS.map((system) => (
            <li key={system}>
              <label className="system-row">
                <input
                  type="checkbox"
                  checked={visibleSystems[system]}
                  onChange={() => toggleSystem(system)}
                />
                <span
                  className="swatch"
                  style={{ background: SYSTEM_META[system].color }}
                />
                <span>{SYSTEM_META[system].label}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <MorphPanel />

      <section className="toggles">
        <label className="toggle">
          <input
            type="checkbox"
            checked={explode}
            onChange={(e) => setExplode(e.target.checked)}
          />
          <span>Explode inventory</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={isolate}
            onChange={(e) => setIsolate(e.target.checked)}
            disabled={!selectedId && !isolate}
          />
          <span>Isolate selection</span>
        </label>
      </section>
    </aside>
  )
}
