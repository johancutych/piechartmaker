import type { Segment, LabelMode } from '../types'
import { getPaletteColor } from '../data/palettes'
import { getContrastTextColor } from '../utils/color'
import {
  SVG_SIZE,
  CENTER_X,
  CENTER_Y,
  GAP_SIZE,
  calculateSegmentAngles,
  generateSegmentPath,
  getLabelPosition,
  shouldShowLabel,
  getLabelFontSize,
  calculateInnerRadius,
} from '../utils/geometry'

interface PieChartProps {
  segments: Segment[]
  paletteId: string
  labelMode: LabelMode
  backgroundColor: string
  innerRadiusPercent: number
  hoveredSegmentId?: string | null
  onSegmentHover?: (id: string | null) => void
}

export function PieChart({
  segments,
  paletteId,
  labelMode,
  backgroundColor,
  innerRadiusPercent,
  hoveredSegmentId,
  onSegmentHover,
}: PieChartProps) {
  const segmentAngles = calculateSegmentAngles(segments)
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const nonZeroCount = segments.filter((s) => s.value > 0).length
  const innerRadius = calculateInnerRadius(innerRadiusPercent)

  const getSegmentColor = (segment: Segment, index: number): string => {
    return segment.color ?? getPaletteColor(paletteId, index)
  }

  const formatLabel = (value: number): string => {
    if (labelMode === 'value') {
      return value.toString()
    }
    // Percentage mode
    const percentage = total > 0 ? (value / total) * 100 : 0
    // Round to 1 decimal, drop .0
    const rounded = Math.round(percentage * 10) / 10
    const formatted = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)
    return `${formatted}%`
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      width="100%"
      height="100%"
      style={{ maxWidth: '400px', maxHeight: '400px' }}
    >
      {/* Render segments */}
      {segments.map((segment, index) => {
        const angles = segmentAngles[index]
        if (!angles || angles.sweepAngle === 0) return null

        const color = getSegmentColor(segment, index)
        const path = generateSegmentPath(
          angles.startAngle,
          angles.endAngle,
          angles.sweepAngle,
          nonZeroCount === 1,
          innerRadius
        )

        if (!path) return null

        const isHovered = hoveredSegmentId === segment.id
        const isDimmed = hoveredSegmentId !== null && !isHovered

        return (
          <path
            key={segment.id}
            d={path}
            fill={color}
            stroke={backgroundColor}
            strokeWidth={nonZeroCount > 1 ? GAP_SIZE : 0}
            strokeLinejoin="round"
            style={{
              opacity: isDimmed ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
              cursor: onSegmentHover ? 'pointer' : 'default',
            }}
            onMouseEnter={() => onSegmentHover?.(segment.id)}
            onMouseLeave={() => onSegmentHover?.(null)}
          />
        )
      })}

      {/* Center circle to cover stroke junction (solid pie only) */}
      {nonZeroCount > 1 && innerRadius === 0 && (
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={GAP_SIZE + 2}
          fill={backgroundColor}
        />
      )}

      {/* Donut hole */}
      {innerRadius > 0 && (
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={innerRadius}
          fill={backgroundColor}
        />
      )}

      {/* Render labels */}
      {segments.map((segment, index) => {
        const angles = segmentAngles[index]
        if (!angles || angles.sweepAngle === 0) return null
        if (!shouldShowLabel(angles.sweepAngle)) return null

        const color = getSegmentColor(segment, index)
        const textColor = getContrastTextColor(color)
        const labelPos = getLabelPosition(angles.midAngle, innerRadius)
        const fontSize = getLabelFontSize(angles.sweepAngle)

        return (
          <text
            key={`label-${segment.id}`}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize={fontSize}
            fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            fontWeight={600}
            style={{ pointerEvents: 'none' }}
          >
            {formatLabel(segment.value)}
          </text>
        )
      })}
    </svg>
  )
}
