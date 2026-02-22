import type { Segment, LegendPosition } from '../types'
import { getPaletteColor } from '../data/palettes'
import { LAYOUT } from '../utils/canvasLayout'

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isRightPosition ? 'column' : 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: isRightPosition ? 'flex-start' : 'center',
        gap: isRightPosition ? '8px' : '12px 24px',
        width: '100%',
      }}
    >
      {segments.map((segment, index) => {
        const color = getSegmentColor(segment, index)
        const isHovered = hoveredSegmentId === segment.id
        const isDimmed = hoveredSegmentId !== null && !isHovered

        return (
          <div
            key={segment.id}
            style={{
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
                whiteSpace: isRightPosition ? 'normal' : 'nowrap',
                wordBreak: isRightPosition ? 'break-word' : undefined,
                maxWidth: isRightPosition ? LAYOUT.LEGEND_RIGHT_WIDTH - 30 : undefined,
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
