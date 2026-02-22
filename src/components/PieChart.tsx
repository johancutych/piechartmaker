import type { Segment, InputMode } from '../types'
import { getPaletteColor } from '../data/palettes'
import { getContrastTextColor } from '../utils/color'
import {
  SVG_SIZE,
  calculateSegmentAngles,
  generateSegmentPath,
  getLabelPosition,
  shouldShowLabel,
  getLabelFontSize,
  calculateInnerRadius,
  calculateGapWidth,
} from '../utils/geometry'

interface PieChartProps {
  segments: Segment[]
  paletteId: string
  inputMode: InputMode
  backgroundColor: string
  innerRadiusPercent: number
  gapWidthPercent: number
  hoveredSegmentId?: string | null
  onSegmentHover?: (id: string | null) => void
}

export function PieChart({
  segments,
  paletteId,
  inputMode,
  backgroundColor: _backgroundColor,
  innerRadiusPercent,
  gapWidthPercent,
  hoveredSegmentId,
  onSegmentHover,
}: PieChartProps) {
  // Note: _backgroundColor is kept for API compatibility but no longer used
  // since gaps are now true geometric gaps (transparent)
  const segmentAngles = calculateSegmentAngles(segments)
  const nonZeroCount = segments.filter((s) => s.value > 0).length
  const innerRadius = calculateInnerRadius(innerRadiusPercent)
  const gapWidth = calculateGapWidth(gapWidthPercent)

  const getSegmentColor = (segment: Segment, index: number): string => {
    return segment.color ?? getPaletteColor(paletteId, index)
  }

  const formatLabel = (value: number): string => {
    if (inputMode === 'values') {
      // Values mode: show raw numbers
      return value.toString()
    }
    // Percentages mode: show percentage symbol (value IS the percentage)
    const rounded = Math.round(value * 10) / 10
    const formatted = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)
    return `${formatted}%`
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      width={SVG_SIZE}
      height={SVG_SIZE}
    >
      {/* Render segments */}
      {segments.map((segment, index) => {
        const angles = segmentAngles[index]
        if (!angles || angles.sweepAngle === 0) return null

        const color = getSegmentColor(segment, index)
        // Use true geometric gaps when multiple segments
        const effectiveGapWidth = nonZeroCount > 1 ? gapWidth : 0
        const path = generateSegmentPath(
          angles.startAngle,
          angles.endAngle,
          angles.sweepAngle,
          nonZeroCount === 1,
          innerRadius,
          effectiveGapWidth
        )

        if (!path) return null

        const isHovered = hoveredSegmentId === segment.id
        const isDimmed = hoveredSegmentId !== null && !isHovered

        return (
          <path
            key={segment.id}
            d={path}
            fill={color}
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
            fontWeight={700}
            style={{ pointerEvents: 'none' }}
          >
            {formatLabel(segment.value)}
          </text>
        )
      })}
    </svg>
  )
}
