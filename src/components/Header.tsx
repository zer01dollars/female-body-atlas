import { SearchBox } from './SearchBox'
import { useAtlas } from '../state/AtlasProvider'

export function Header() {
  const { drawerOpen, setDrawerOpen } = useAtlas()
  return (
    <header className="app-header overlay-panel">
      <button
        type="button"
        className="icon-btn drawer-toggle"
        aria-label={drawerOpen ? 'Hide controls' : 'Show controls'}
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        ☰
      </button>
      <div className="brand">
        <svg
          className="brand-mark"
          viewBox="0 0 32 32"
          aria-hidden="true"
          width="26"
          height="26"
        >
          <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M16 6.5c2.2 0 3.6 1.8 3.6 3.6 0 1.4-.7 2.5-1.8 3.2 2.4.7 4.1 2.8 4.1 5.4v.6c0 2.6-2.6 4.2-5.9 4.2s-5.9-1.6-5.9-4.2v-.6c0-2.6 1.7-4.7 4.1-5.4-1.1-.7-1.8-1.8-1.8-3.2 0-1.8 1.4-3.6 3.6-3.6z"
            fill="currentColor"
            opacity="0.88"
          />
        </svg>
        <div>
          <h1>Femora Atlas</h1>
          <p>HuBMAP female 3D reference</p>
        </div>
      </div>
      <SearchBox />
    </header>
  )
}
