import type { Segment } from '../types'

// Constants
export const SVG_SIZE = 500
export const CENTER_X = 250
export const CENTER_Y = 250
export const OUTER_RADIUS = 220
export const LABEL_RADIUS = OUTER_RADIUS * (2 / 3)
export const GAP_SIZE = 4 // Stroke width for gaps
export const CORNER_RADIUS = 8 // Rounded corner radius
export const START_ANGLE_DEG = -90 // 12 o'clock position
export const LABEL_HIDE_THRESHOLD_DEG = 20
export const MAX_INNER_RADIUS_PERCENT = 80

// Calculate actual inner radius from percentage
export function calculateInnerRadius(innerRadiusPercent: number): number {
  return (innerRadiusPercent / 100) * OUTER_RADIUS
}

// Convert degrees to radians
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

// Calculate point on circle
export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = degreesToRadians(angleInDegrees)
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

// Calculate segment angles from values
export interface SegmentAngle {
  id: string
  startAngle: number
  endAngle: number
  sweepAngle: number
  midAngle: number
}

export function calculateSegmentAngles(segments: Segment[]): SegmentAngle[] {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) return []

  const result: SegmentAngle[] = []
  let currentAngle = START_ANGLE_DEG

  for (const segment of segments) {
    if (segment.value === 0) {
      result.push({
        id: segment.id,
        startAngle: currentAngle,
        endAngle: currentAngle,
        sweepAngle: 0,
        midAngle: currentAngle,
      })
      continue
    }

    const sweepAngle = (segment.value / total) * 360
    const endAngle = currentAngle + sweepAngle
    const midAngle = currentAngle + sweepAngle / 2

    result.push({
      id: segment.id,
      startAngle: currentAngle,
      endAngle,
      sweepAngle,
      midAngle,
    })

    currentAngle = endAngle
  }

  return result
}

// Generate SVG path for a filled pie wedge with rounded outer corners
export function generateSegmentPath(
  startAngle: number,
  endAngle: number,
  sweepAngle: number,
  isOnlySegment: boolean,
  innerRadius: number = 0
): string {
  // If only one non-zero segment, render as full circle or annulus
  if (isOnlySegment) {
    const top = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, -90)
    const bottom = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, 90)

    if (innerRadius === 0) {
      // Solid full circle
      return [
        `M ${top.x} ${top.y}`,
        `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 1 1 ${bottom.x} ${bottom.y}`,
        `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 1 1 ${top.x} ${top.y}`,
        'Z',
      ].join(' ')
    } else {
      // Full donut (annulus) - use evenodd fill rule via two circles
      const innerTop = polarToCartesian(CENTER_X, CENTER_Y, innerRadius, -90)
      const innerBottom = polarToCartesian(CENTER_X, CENTER_Y, innerRadius, 90)
      return [
        // Outer circle clockwise
        `M ${top.x} ${top.y}`,
        `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 1 1 ${bottom.x} ${bottom.y}`,
        `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 1 1 ${top.x} ${top.y}`,
        // Inner circle counter-clockwise (creates hole)
        `M ${innerTop.x} ${innerTop.y}`,
        `A ${innerRadius} ${innerRadius} 0 1 0 ${innerBottom.x} ${innerBottom.y}`,
        `A ${innerRadius} ${innerRadius} 0 1 0 ${innerTop.x} ${innerTop.y}`,
        'Z',
      ].join(' ')
    }
  }

  // For donut segments (innerRadius > 0)
  if (innerRadius > 0) {
    return generateDonutSegmentPath(startAngle, endAngle, sweepAngle, innerRadius)
  }

  // Original solid pie wedge logic below

  // For small segments, use simple wedge without rounded corners
  if (sweepAngle < 15) {
    const startOuter = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, startAngle)
    const endOuter = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, endAngle)
    const largeArcFlag = sweepAngle > 180 ? 1 : 0

    return [
      `M ${CENTER_X} ${CENTER_Y}`,
      `L ${startOuter.x} ${startOuter.y}`,
      `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
      'Z',
    ].join(' ')
  }

  // Calculate corner radius - scale down for smaller segments
  const effectiveCornerRadius = Math.min(CORNER_RADIUS, sweepAngle * 0.8)

  // Convert corner radius to angle offset on the outer arc
  const cornerAngleOffset = (effectiveCornerRadius / OUTER_RADIUS) * (180 / Math.PI)

  // Points for rounded corners
  const startOuter = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, startAngle)
  const endOuter = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, endAngle)

  // Points where the arc begins (after the corner)
  const startArcPoint = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, startAngle + cornerAngleOffset)
  const endArcPoint = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, endAngle - cornerAngleOffset)

  // Points on the radial lines, inset for the corner
  const startCornerInner = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS - effectiveCornerRadius, startAngle)
  const endCornerInner = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS - effectiveCornerRadius, endAngle)

  const adjustedSweep = sweepAngle - 2 * cornerAngleOffset
  const largeArcFlag = adjustedSweep > 180 ? 1 : 0

  // Path with quadratic curves for rounded corners
  return [
    `M ${CENTER_X} ${CENTER_Y}`,
    `L ${startCornerInner.x} ${startCornerInner.y}`,
    `Q ${startOuter.x} ${startOuter.y} ${startArcPoint.x} ${startArcPoint.y}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArcFlag} 1 ${endArcPoint.x} ${endArcPoint.y}`,
    `Q ${endOuter.x} ${endOuter.y} ${endCornerInner.x} ${endCornerInner.y}`,
    'Z',
  ].join(' ')
}

// Generate donut segment arc path
function generateDonutSegmentPath(
  startAngle: number,
  endAngle: number,
  sweepAngle: number,
  innerRadius: number
): string {
  const largeArcFlag = sweepAngle > 180 ? 1 : 0

  // Outer arc points
  const startOuter = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, startAngle)
  const endOuter = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, endAngle)

  // Inner arc points
  const startInner = polarToCartesian(CENTER_X, CENTER_Y, innerRadius, startAngle)
  const endInner = polarToCartesian(CENTER_X, CENTER_Y, innerRadius, endAngle)

  // For small segments, use simple arc without rounded corners
  if (sweepAngle < 15) {
    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
      'Z',
    ].join(' ')
  }

  // For larger segments, add rounded corners on outer edge
  const effectiveCornerRadius = Math.min(CORNER_RADIUS, sweepAngle * 0.8)
  const cornerAngleOffset = (effectiveCornerRadius / OUTER_RADIUS) * (180 / Math.PI)

  const startArcPoint = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, startAngle + cornerAngleOffset)
  const endArcPoint = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, endAngle - cornerAngleOffset)
  const startCornerInner = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS - effectiveCornerRadius, startAngle)
  const endCornerInner = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS - effectiveCornerRadius, endAngle)

  const adjustedSweep = sweepAngle - 2 * cornerAngleOffset
  const adjustedLargeArcFlag = adjustedSweep > 180 ? 1 : 0

  return [
    `M ${startInner.x} ${startInner.y}`,
    `L ${startCornerInner.x} ${startCornerInner.y}`,
    `Q ${startOuter.x} ${startOuter.y} ${startArcPoint.x} ${startArcPoint.y}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${adjustedLargeArcFlag} 1 ${endArcPoint.x} ${endArcPoint.y}`,
    `Q ${endOuter.x} ${endOuter.y} ${endCornerInner.x} ${endCornerInner.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    'Z',
  ].join(' ')
}

// Calculate label position at 2/3 of radius, or midpoint of ring for donut
export function getLabelPosition(
  midAngle: number,
  innerRadius: number = 0
): { x: number; y: number } {
  // Position label at midpoint between inner and outer radius for donut
  const labelRadius = innerRadius > 0
    ? innerRadius + (OUTER_RADIUS - innerRadius) / 2
    : LABEL_RADIUS // Keep original 2/3 radius for solid pie
  return polarToCartesian(CENTER_X, CENTER_Y, labelRadius, midAngle)
}

// Determine if label should be shown
export function shouldShowLabel(sweepAngle: number): boolean {
  return sweepAngle >= LABEL_HIDE_THRESHOLD_DEG
}

// Get font size based on arc size
export function getLabelFontSize(sweepAngle: number): number {
  return sweepAngle < 30 ? 12 : 14
}
