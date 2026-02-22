import type { Segment, LegendPosition } from '../types'
import { getPaletteColor } from '../data/palettes'
import { LAYOUT, getLegendColumnCount } from '../utils/canvasLayout'

interface LegendCanvasProps {
  segments: Segment[]
  paletteId: string
  legendPosition: LegendPosition
  canvasWidth: number
  hoveredSegmentId: string | null
  onSegmentHover: (id: string | null) => void
}

export function LegendCanvas({
  segments,
  paletteId,
  legendPosition,
  canvasWidth,
  hoveredSegmentId,
  onSegmentHover,
}: LegendCanvasProps) {
  const getSegmentColor = (segment: Segment, index: number): string => {
    return segment.color ?? getPaletteColor(paletteId, index)
  }

  const isRightPosition = legendPosition === 'right'
  const columnCount = getLegendColumnCount(segments.length, legendPosition)
  const itemWidth = canvasWidth / columnCount

  return (
    <div style={{ position: 'relative' }}>
      {segments.map((segment, index) => {
        const color = getSegmentColor(segment, index)
        const isHovered = hoveredSegmentId === segment.id
        const isDimmed = hoveredSegmentId !== null && !isHovered

        let x: number
        let y: number

        if (isRightPosition) {
          // Vertical single-column layout for right position
          x = 0
          y = index * LAYOUT.LEGEND_ITEM_HEIGHT
        } else {
          // Horizontal grid layout for bottom position
          const col = index % columnCount
          const row = Math.floor(index / columnCount)
          x = col * itemWidth + itemWidth / 2 - 60
          y = row * LAYOUT.LEGEND_ITEM_HEIGHT
        }

        return (
          <div
            key={segment.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              display: 'flex',
              alignItems: 'center',
              gap: `${LAYOUT.LEGEND_DOT_LABEL_GAP - LAYOUT.LEGEND_DOT_RADIUS}px`,
              cursor: 'pointer',
              opacity: isDimmed ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={() => onSegmentHover(segment.id)}
            onMouseLeave={() => onSegmentHover(null)}
          >
            <span
              style={{
                width: LAYOUT.LEGEND_DOT_RADIUS * 2,
                height: LAYOUT.LEGEND_DOT_RADIUS * 2,
                borderRadius: '50%',
                backgroundColor: color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: LAYOUT.LEGEND_FONT_SIZE,
                fontWeight: LAYOUT.LEGEND_FONT_WEIGHT,
                color: LAYOUT.LEGEND_TEXT_COLOR,
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
