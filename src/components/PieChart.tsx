import type { Segment, InputMode } from '../types'
import { getPaletteColor } from '../data/palettes'
import { getStyle } from '../data/styles'
import { getContrastTextColor, lightenColor, darkenColor } from '../utils/color'
import {
  SVG_SIZE,
  calculateSegmentAngles,
  generateSegmentPath,
  getLabelPosition,
  shouldShowLabel,
  getLabelFontSize,
  calculateInnerRadius,
  calculateGapWidth,
  shouldLabelBeExternal,
  getExternalLabelPosition,
} from '../utils/geometry'

interface PieChartProps {
  segments: Segment[]
  paletteId: string
  styleId: string
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
  styleId,
  inputMode,
  backgroundColor: _backgroundColor,
  innerRadiusPercent,
  gapWidthPercent,
  hoveredSegmentId,
  onSegmentHover,
}: PieChartProps) {
  // Note: _backgroundColor is kept for API compatibility but no longer used
  // since gaps are now true geometric gaps (transparent)
  const style = getStyle(styleId)
  const segmentAngles = calculateSegmentAngles(segments)
  const nonZeroCount = segments.filter((s) => s.value > 0).length
  const innerRadius = calculateInnerRadius(innerRadiusPercent)
  const baseGapWidth = calculateGapWidth(gapWidthPercent)
  const gapWidth = baseGapWidth * style.gapMultiplier

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

  // Generate gradient and filter definitions for styles that need them
  const needsGradients = style.segment.fill === 'gradient'
  const needsNeonFilter = style.segment.filter === 'neon-glow'

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      width={SVG_SIZE}
      height={SVG_SIZE}
      overflow="visible"
    >
      {/* SVG Definitions for gradients and filters */}
      <defs>
        {/* Gradient definitions for Soft style */}
        {needsGradients && segments.map((segment, index) => {
          const color = getSegmentColor(segment, index)
          const angles = segmentAngles[index]
          if (!angles || angles.sweepAngle === 0) return null

          // Calculate gradient angle based on segment position
          const gradAngle = angles.midAngle + 90
          const rad = (gradAngle * Math.PI) / 180
          const x1 = 50 - Math.cos(rad) * 50
          const y1 = 50 - Math.sin(rad) * 50
          const x2 = 50 + Math.cos(rad) * 50
          const y2 = 50 + Math.sin(rad) * 50

          return (
            <linearGradient
              key={`grad-${segment.id}`}
              id={`grad-${segment.id}`}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
            >
              <stop offset="0%" stopColor={lightenColor(color, 0.35)} />
              <stop offset="100%" stopColor={darkenColor(color, 0.1)} />
            </linearGradient>
          )
        })}

        {/* Neon glow filter */}
        {needsNeonFilter && (
          <filter id="neon-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="12" result="blur1" />
            <feComponentTransfer in="blur1" result="blur1-faded">
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="6" in="SourceGraphic" result="blur2" />
            <feComponentTransfer in="blur2" result="blur2-faded">
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="blur1-faded" />
              <feMergeNode in="blur2-faded" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Render segments */}
      {segments.map((segment, index) => {
        const angles = segmentAngles[index]
        if (!angles || angles.sweepAngle === 0) return null

        const color = getSegmentColor(segment, index)
        // Use true geometric gaps when multiple segments
        const effectiveGapWidth = nonZeroCount > 1 ? gapWidth : 0
        // Disable rounded corners when gap is 0
        const effectiveCornerRadius = gapWidthPercent === 0 ? 0 : style.segment.cornerRadius
        const path = generateSegmentPath(
          angles.startAngle,
          angles.endAngle,
          angles.sweepAngle,
          nonZeroCount === 1,
          innerRadius,
          effectiveGapWidth,
          effectiveCornerRadius
        )

        if (!path) return null

        const isHovered = hoveredSegmentId === segment.id
        const isDimmed = hoveredSegmentId !== null && !isHovered

        // Determine fill based on style
        let fill: string
        if (style.segment.fill === 'transparent') {
          fill = 'none'
        } else if (style.segment.fill === 'gradient') {
          fill = `url(#grad-${segment.id})`
        } else {
          fill = color
        }

        // Determine stroke based on style
        let stroke: string | undefined
        let strokeWidth: number | undefined
        if (style.segment.stroke) {
          strokeWidth = style.segment.stroke.width
          if (style.segment.stroke.color === 'segment') {
            stroke = darkenColor(color, style.segment.stroke.darkening)
          } else {
            stroke = style.segment.stroke.color
          }
        }

        // Build style object for shadows and filters
        const pathStyle: React.CSSProperties = {
          opacity: isDimmed ? 0.6 : 1,
          transition: 'opacity 0.2s ease',
          cursor: onSegmentHover ? 'pointer' : 'default',
        }

        // Add drop shadow for Stylish style
        if (style.segment.shadow) {
          const s = style.segment.shadow
          const shadowColor = s.color === 'segment'
            ? darkenColor(color, s.darkening)
            : s.color
          pathStyle.filter = `drop-shadow(${s.offsetX}px ${s.offsetY}px ${s.blur}px ${shadowColor})`
        }

        return (
          <path
            key={segment.id}
            d={path}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            filter={style.segment.filter ? `url(#${style.segment.filter})` : undefined}
            style={pathStyle}
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
        const isExternal = shouldLabelBeExternal(angles.sweepAngle)

        // Determine label position and anchor
        let labelPos: { x: number; y: number }
        let textAnchor: 'start' | 'middle' | 'end' = 'middle'
        let textColor: string

        if (isExternal) {
          // External labels: position outside the pie, above the slice
          const externalPos = getExternalLabelPosition(angles.midAngle)
          labelPos = { x: externalPos.x, y: externalPos.y }
          textAnchor = externalPos.textAnchor
          // External labels use segment color (they're not on top of the slice)
          textColor = color
        } else {
          // Internal labels: position inside the slice
          labelPos = getLabelPosition(angles.midAngle, innerRadius)
          // For outline style, use the segment color for text; otherwise use contrast color
          textColor = style.segment.fill === 'transparent'
            ? color
            : getContrastTextColor(color)
        }

        const fontSize = getLabelFontSize(angles.sweepAngle)

        return (
          <text
            key={`label-${segment.id}`}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor={textAnchor}
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
