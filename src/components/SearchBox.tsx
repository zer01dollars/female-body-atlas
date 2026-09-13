import { useEffect, useRef, useState } from 'react'
import { SYSTEM_META } from '../types'
import { useAtlas } from '../state/AtlasProvider'

export function SearchBox() {
  const { search, setSearch, filteredParts, select, setIsolate } = useAtlas()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const show = open && search.trim().length > 0

  return (
    <div className="search-wrap" ref={wrap}>
      <input
        type="search"
        value={search}
        placeholder="Search structures…"
        aria-label="Search anatomical structures"
        onChange={(e) => {
          setSearch(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        className="search-input"
      />
      {show ? (
        <ul className="search-results" role="listbox">
          {filteredParts.length === 0 ? (
            <li className="search-empty">No matching structures</li>
          ) : (
            filteredParts.slice(0, 12).map((part) => (
              <li key={part.id}>
                <button
                  type="button"
                  className="search-item"
                  onClick={() => {
                    select(part.id)
                    setIsolate(true)
                    setSearch(part.name)
                    setOpen(false)
                  }}
                >
                  <span>{part.name}</span>
                  <span
                    className="search-system"
                    style={{ color: SYSTEM_META[part.system].color }}
                  >
                    {SYSTEM_META[part.system].label}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
