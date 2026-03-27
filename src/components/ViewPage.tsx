import { useMemo, useState } from 'react'
import { decodeChartState, encodeChartState } from '../utils/chartUrl'
import { CanvasPreview } from './CanvasPreview'

export function ViewPage() {
  const config = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const data = params.get('d')
    if (!data) return null
    return decodeChartState(data)
  }, [])

  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null)

  if (!config) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#666' }}>
        <p>Invalid or missing chart data</p>
      </div>
    )
  }

  const editUrl = `/?d=${encodeChartState(config)}`

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <CanvasPreview
          segments={config.segments}
          paletteId={config.palette}
          styleId={config.style}
          title={config.title}
          inputMode="percentages"
          legendPosition={config.legendPosition}
          backgroundColor={config.backgroundColor}
          innerRadiusPercent={config.innerRadiusPercent}
          gapWidthPercent={config.gapWidthPercent}
          hoveredSegmentId={hoveredSegmentId}
          onSegmentHover={setHoveredSegmentId}
        />
      </div>
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontSize: '13px',
        color: '#888',
        borderTop: '1px solid #eee',
      }}>
        <span>
          Made with{' '}
          <a href="https://chartty.io" target="_blank" rel="noopener" style={{ color: '#555', textDecoration: 'underline' }}>
            Chartty
          </a>
        </span>
        <span style={{ color: '#ddd' }}>|</span>
        <a href={editUrl} style={{ color: '#555', textDecoration: 'underline' }}>
          Edit this chart
        </a>
      </div>
    </div>
  )
}
