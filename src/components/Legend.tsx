import type { Segment, LegendPosition } from '../types'
import { getPaletteColor } from '../data/palettes'

interface LegendProps {
  segments: Segment[]
  paletteId: string
  legendPosition?: LegendPosition
  hoveredSegmentId?: string | null
  onSegmentHover?: (id: string | null) => void
}

export function Legend({
  segments,
  paletteId,
  legendPosition = 'bottom',
  hoveredSegmentId,
  onSegmentHover,
}: LegendProps) {
  const getSegmentColor = (segment: Segment, index: number): string => {
    return segment.color ?? getPaletteColor(paletteId, index)
  }

  // Determine column layout based on position
  const isRightPosition = legendPosition === 'right'
  const columnCount = isRightPosition
    ? 1
    : segments.length <= 3 ? 1 : segments.length <= 8 ? 2 : 3

  return (
    <div
      className="legend"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, auto)`,
        gap: isRightPosition ? '8px 24px' : '12px 24px',
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
              gap: '8px',
              cursor: onSegmentHover ? 'pointer' : 'default',
              opacity: isDimmed ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={() => onSegmentHover?.(segment.id)}
            onMouseLeave={() => onSegmentHover?.(null)}
          >
            <span
              className="legend-dot"
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: color,
                flexShrink: 0,
              }}
            />
            <span
              className="legend-label"
              style={{
                fontSize: '16px',
                fontWeight: 400,
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
  startY: number
  startX?: number
  width: number
  legendPosition?: LegendPosition
}

export function renderLegendSVG({
  segments,
  paletteId,
  startY,
  startX = 0,
  width,
  legendPosition = 'bottom',
}: LegendSVGProps): string {
  const getSegmentColor = (segment: Segment, index: number): string => {
    return segment.color ?? getPaletteColor(paletteId, index)
  }

  const isRightPosition = legendPosition === 'right'
  const columnCount = isRightPosition
    ? 1
    : segments.length <= 3 ? 1 : segments.length <= 8 ? 2 : 3
  const itemsPerColumn = Math.ceil(segments.length / columnCount)
  const columnWidth = width / columnCount
  const rowHeight = 28
  const dotRadius = 6
  const dotLabelGap = 10

  const items: string[] = []

  segments.forEach((segment, index) => {
    const color = getSegmentColor(segment, index)
    let x: number, y: number

    if (isRightPosition) {
      // Vertical single-column layout for right position
      x = startX
      y = startY + index * rowHeight
    } else {
      // Horizontal grid layout for bottom position
      const columnIndex = Math.floor(index / itemsPerColumn)
      const rowIndex = index % itemsPerColumn
      const columnStartX = (width - columnCount * columnWidth) / 2 + columnIndex * columnWidth + columnWidth / 4
      x = columnStartX
      y = startY + rowIndex * rowHeight
    }

    items.push(`
      <circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${color}" />
      <text
        x="${x + dotRadius + dotLabelGap}"
        y="${y}"
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="16"
        font-weight="400"
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
