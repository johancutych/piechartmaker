import { useMemo, useState } from 'react'
import { decodeChartState } from '../utils/chartUrl'
import { CanvasPreview } from './CanvasPreview'

export function EmbedPage() {
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

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
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
      <a
        href="https://chartty.io"
        target="_blank"
        rel="noopener"
        style={{
          position: 'absolute',
          bottom: 6,
          right: 10,
          fontSize: '10px',
          color: '#aaa',
          textDecoration: 'none',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        chartty.io
      </a>
    </div>
  )
}
