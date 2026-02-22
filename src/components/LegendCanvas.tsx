import type { Segment, LegendPosition } from '../types'
import { getPaletteColor } from '../data/palettes'
import { getStyle } from '../data/styles'
import { darkenColor, hexToRgba, getContrastTextColor } from '../utils/color'
import { LAYOUT } from '../utils/canvasLayout'

interface LegendCanvasProps {
  segments: Segment[]
  paletteId: string
  styleId: string
  legendPosition: LegendPosition
  canvasWidth: number
  backgroundColor: string
  hoveredSegmentId: string | null
  onSegmentHover: (id: string | null) => void
}

export function LegendCanvas({
  segments,
  paletteId,
  styleId,
  legendPosition,
  canvasWidth: _canvasWidth,
  backgroundColor,
  hoveredSegmentId,
  onSegmentHover,
}: LegendCanvasProps) {
  const style = getStyle(styleId)
  const legendStyleConfig = style.legend
  const textColor = backgroundColor === 'transparent' ? LAYOUT.LEGEND_TEXT_COLOR : getContrastTextColor(backgroundColor)

  const getSegmentColor = (segment: Segment, index: number): string => {
    return segment.color ?? getPaletteColor(paletteId, index)
  }

  const isSidePosition = legendPosition === 'right' || legendPosition === 'left'

  // Build indicator style based on chart style
  const getIndicatorStyle = (color: string): React.CSSProperties => {
    const size = legendStyleConfig.indicatorSize
    const baseStyle: React.CSSProperties = {
      width: `${size}px`,
      height: `${size}px`,
      flexShrink: 0,
    }

    switch (legendStyleConfig.indicatorShape) {
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
          border: legendStyleConfig.stroke ? `2px solid ${darkenColor(color, 0.2)}` : 'none',
          boxShadow: legendStyleConfig.glow ? `0 0 16px ${hexToRgba(color, 0.5)}, 0 0 30px ${hexToRgba(color, 0.3)}` : 'none',
          boxSizing: 'border-box',
        }
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isSidePosition ? 'column' : 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: isSidePosition ? 'flex-start' : 'center',
        gap: isSidePosition ? '8px' : '12px 24px',
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
              gap: `${LAYOUT.LEGEND_DOT_LABEL_GAP - legendStyleConfig.indicatorSize / 2}px`,
              cursor: 'pointer',
              opacity: isDimmed ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={() => onSegmentHover(segment.id)}
            onMouseLeave={() => onSegmentHover(null)}
          >
            <span style={getIndicatorStyle(color)} />
            <span
              style={{
                fontSize: LAYOUT.LEGEND_FONT_SIZE,
                fontWeight: LAYOUT.LEGEND_FONT_WEIGHT,
                color: textColor,
                whiteSpace: isSidePosition ? 'normal' : 'nowrap',
                wordBreak: isSidePosition ? 'break-word' : undefined,
                maxWidth: isSidePosition ? LAYOUT.LEGEND_RIGHT_WIDTH - 30 : undefined,
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
