import type { Segment, LegendPosition } from '../types'
import { getPaletteColor } from '../data/palettes'
import { getStyle } from '../data/styles'
import { darkenColor, hexToRgba } from '../utils/color'

interface LegendProps {
  segments: Segment[]
  paletteId: string
  styleId: string
  legendPosition?: LegendPosition
  hoveredSegmentId?: string | null
  onSegmentHover?: (id: string | null) => void
}

export function Legend({
  segments,
  paletteId,
  styleId,
  legendPosition = 'bottom',
  hoveredSegmentId,
  onSegmentHover,
}: LegendProps) {
  const style = getStyle(styleId)
  const legendStyle = style.legend

  const getSegmentColor = (segment: Segment, index: number): string => {
    return segment.color ?? getPaletteColor(paletteId, index)
  }

  // Determine column layout based on position
  const isRightPosition = legendPosition === 'right'
  const columnCount = isRightPosition
    ? 1
    : segments.length <= 3 ? 1 : segments.length <= 8 ? 2 : 3

  // Build indicator style based on chart style
  const getIndicatorStyle = (color: string): React.CSSProperties => {
    const size = legendStyle.indicatorSize
    const baseStyle: React.CSSProperties = {
      width: `${size}px`,
      height: `${size}px`,
      flexShrink: 0,
    }

    switch (legendStyle.indicatorShape) {
      case 'rectangle':
        return {
          ...baseStyle,
          borderRadius: '2px',
          backgroundColor: color,
        }
      case 'ring':
        return {
          ...baseStyle,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: `3px solid ${color}`,
          boxSizing: 'border-box',
        }
      case 'circle':
      default:
        return {
          ...baseStyle,
          borderRadius: '50%',
          backgroundColor: color,
          border: legendStyle.stroke ? `2px solid ${darkenColor(color, 0.2)}` : 'none',
          boxShadow: legendStyle.glow ? `0 0 16px ${hexToRgba(color, 0.5)}, 0 0 30px ${hexToRgba(color, 0.3)}` : 'none',
          boxSizing: 'border-box',
        }
    }
  }

  return (
    <div
      className="legend"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, auto)`,
        gap: isRightPosition ? '12px 24px' : '16px 32px',
        justifyContent: isRightPosition ? 'flex-start' : 'center',
      }}
    >
      {segments.map((segment, index) => {
        const color = getSegmentColor(segment, index)
        const isHovered = hoveredSegmentId === segment.id
        const isDimmed = hoveredSegmentId !== null && !isHovered

        return (
          <div
            key={segment.id}
            className="legend-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: onSegmentHover ? 'pointer' : 'default',
              opacity: isDimmed ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={() => onSegmentHover?.(segment.id)}
            onMouseLeave={() => onSegmentHover?.(null)}
          >
            <span
              className="legend-dot"
              style={getIndicatorStyle(color)}
            />
            <span
              className="legend-label"
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#374151',
                whiteSpace: 'nowrap',
              }}
            >
              {segment.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// SVG version for export
export interface LegendSVGProps {
  segments: Segment[]
  paletteId: string
  styleId: string
  startY: number
  startX?: number
  width: number
  legendPosition?: LegendPosition
}

export function renderLegendSVG({
  segments,
  paletteId,
  styleId,
  startY,
  startX = 0,
  width,
  legendPosition = 'bottom',
}: LegendSVGProps): string {
  const style = getStyle(styleId)
  const legendStyleConfig = style.legend

  const getSegmentColor = (segment: Segment, index: number): string => {
    return segment.color ?? getPaletteColor(paletteId, index)
  }

  const isRightPosition = legendPosition === 'right'
  const columnCount = isRightPosition
    ? 1
    : segments.length <= 3 ? 1 : segments.length <= 8 ? 2 : 3
  const itemsPerColumn = Math.ceil(segments.length / columnCount)
  const rowHeight = 36
  const indicatorSize = legendStyleConfig.indicatorSize
  const dotRadius = indicatorSize / 2
  const dotLabelGap = 12

  const items: string[] = []

  segments.forEach((segment, index) => {
    const color = getSegmentColor(segment, index)
    let x: number, y: number

    if (isRightPosition) {
      // Vertical single-column layout for right position
      x = startX
      y = startY + index * rowHeight
    } else {
      // Horizontal grid layout for bottom position - more compact centering
      const columnIndex = Math.floor(index / itemsPerColumn)
      const rowIndex = index % itemsPerColumn
      const compactWidth = width * 0.6 // Use 60% of width for tighter grouping
      const compactColumnWidth = compactWidth / columnCount
      const startOffset = (width - compactWidth) / 2
      const columnStartX = startOffset + columnIndex * compactColumnWidth + compactColumnWidth / 4
      x = columnStartX
      y = startY + rowIndex * rowHeight
    }

    // Render different indicator shapes based on style
    let indicatorSVG: string
    switch (legendStyleConfig.indicatorShape) {
      case 'rectangle':
        indicatorSVG = `<rect x="${x - dotRadius}" y="${y - dotRadius}" width="${indicatorSize}" height="${indicatorSize}" rx="2" fill="${color}" />`
        break
      case 'ring':
        indicatorSVG = `<circle cx="${x}" cy="${y}" r="${dotRadius - 1.5}" fill="none" stroke="${color}" stroke-width="3" />`
        break
      case 'circle':
      default:
        if (legendStyleConfig.stroke) {
          const strokeColor = darkenColor(color, 0.2)
          indicatorSVG = `<circle cx="${x}" cy="${y}" r="${dotRadius - 1}" fill="${color}" stroke="${strokeColor}" stroke-width="2" />`
        } else if (legendStyleConfig.glow) {
          // Add a glow effect using a filter with lower opacity and larger blur
          const glow1 = hexToRgba(color, 0.5)
          const glow2 = hexToRgba(color, 0.3)
          indicatorSVG = `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${color}" style="filter: drop-shadow(0 0 12px ${glow1}) drop-shadow(0 0 24px ${glow2});" />`
        } else {
          indicatorSVG = `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${color}" />`
        }
        break
    }

    items.push(`
      ${indicatorSVG}
      <text
        x="${x + dotRadius + dotLabelGap}"
        y="${y}"
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="20"
        font-weight="600"
        fill="#374151"
        dominant-baseline="central"
      >${escapeXml(segment.label)}</text>
    `)
  })

  return items.join('')
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
