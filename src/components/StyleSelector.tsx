import { useRef, useState, useEffect } from 'react'
import { chartStyles } from '../data/styles'

interface StyleSelectorProps {
  selectedStyleId: string
  onSelect: (styleId: string) => void
}

export function StyleSelector({ selectedStyleId, onSelect }: StyleSelectorProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const selectedStyle = chartStyles.find((s) => s.id === selectedStyleId)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mini preview showing style characteristics - emphasized for visibility
  const StylePreviewIcon = ({ styleId }: { styleId: string }) => {
    const style = chartStyles.find((s) => s.id === styleId)
    if (!style) return null

    const color = '#6366f1'
    const darkColor = '#4338ca'
    const lightColor = '#a5b4fc'

    // Each style gets a distinct, emphasized visual
    switch (styleId) {
      case 'modern':
        // Clean solid circle
        return (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill={color} />
          </svg>
        )

      case 'soft':
        // Prominent gradient from light to dark
        return (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <defs>
              <linearGradient id={`preview-grad-${styleId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={lightColor} />
                <stop offset="100%" stopColor={darkColor} />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="9" fill={`url(#preview-grad-${styleId})`} />
          </svg>
        )

      case 'classic':
        // Square shape to emphasize no-radius classic look
        return (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" fill={color} />
          </svg>
        )

      case 'stylish':
        // Large offset shadow for 3D effect
        return (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="14" cy="14" r="8" fill={darkColor} opacity={0.6} />
            <circle cx="11" cy="11" r="8" fill={color} />
          </svg>
        )

      case 'bold':
        // Thick visible stroke
        return (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="7" fill={color} stroke={darkColor} strokeWidth="4" />
          </svg>
        )

      case 'outline':
        // Thick ring, no fill
        return (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="7" fill="none" stroke={color} strokeWidth="4" />
          </svg>
        )

      case 'neon':
        // Prominent glow effect
        return (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <defs>
              <filter id={`preview-glow-${styleId}`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="12" cy="12" r="6" fill={color} filter={`url(#preview-glow-${styleId})`} />
          </svg>
        )

      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill={color} />
          </svg>
        )
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: '6px',
        }}
      >
        Chart Style
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
          <span style={{ flex: 1 }}>{selectedStyle?.name}</span>
          <StylePreviewIcon styleId={selectedStyleId} />
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
              maxHeight: '280px',
              overflowY: 'auto',
            }}
          >
            {chartStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  onSelect(style.id)
                  setIsOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  fontFamily: 'var(--font-family)',
                  border: 'none',
                  backgroundColor:
                    style.id === selectedStyleId ? 'var(--border)' : 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (style.id !== selectedStyleId) {
                    e.currentTarget.style.backgroundColor = 'var(--bg)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (style.id !== selectedStyleId) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <span style={{ flex: 1 }}>{style.name}</span>
                <StylePreviewIcon styleId={style.id} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
