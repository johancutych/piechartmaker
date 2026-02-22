import { useRef, useState, useEffect } from 'react'
import { palettes } from '../data/palettes'

interface PaletteSelectorProps {
  selectedPaletteId: string
  onSelect: (paletteId: string) => void
}

export function PaletteSelector({
  selectedPaletteId,
  onSelect,
}: PaletteSelectorProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const selectedPalette = palettes.find((p) => p.id === selectedPaletteId)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: '6px',
        }}
      >
        Color Palette
      </label>
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        {/* Dropdown trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            height: '40px',
            padding: '0 12px',
            fontSize: '14px',
            fontFamily: 'var(--font-family)',
            border: '2px solid var(--border)',
            borderRadius: '10px',
            backgroundColor: 'var(--bg)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            textAlign: 'left',
            fontWeight: 400,
            textTransform: 'none',
            letterSpacing: 'normal',
          }}
        >
          <span style={{ flex: 1 }}>{selectedPalette?.name}</span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {selectedPalette?.colors.slice(0, 6).map((color, i) => (
              <span
                key={i}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  backgroundColor: color,
                }}
              />
            ))}
          </div>
          <span style={{ marginLeft: '4px', opacity: 0.6 }}>{isOpen ? '▲' : '▼'}</span>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--border)',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 100,
              maxHeight: '240px',
              overflowY: 'auto',
            }}
          >
            {palettes.map((palette) => (
              <button
                key={palette.id}
                onClick={() => {
                  onSelect(palette.id)
                  setIsOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  fontFamily: 'var(--font-family)',
                  border: 'none',
                  backgroundColor:
                    palette.id === selectedPaletteId ? 'var(--border)' : 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (palette.id !== selectedPaletteId) {
                    e.currentTarget.style.backgroundColor = 'var(--bg)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (palette.id !== selectedPaletteId) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <span style={{ flex: 1 }}>{palette.name}</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {palette.colors.slice(0, 6).map((color, i) => (
                    <span
                      key={i}
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '3px',
                        backgroundColor: color,
                      }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
