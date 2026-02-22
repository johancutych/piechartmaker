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

// Calculate gap width from percentage (0-100% maps to 0-20px)
export function calculateGapWidth(gapWidthPercent: number): number {
  const MAX_GAP_WIDTH = 20
  return (gapWidthPercent / 100) * MAX_GAP_WIDTH
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

// Simple point interface
interface Point {
  x: number
  y: number
}

// Interface for offset line (perpendicular offset from radial)
export interface OffsetLine {
  pointX: number  // A point the line passes through
  pointY: number
  angle: number   // Direction angle (degrees)
}

// Offset a radial line perpendicular to itself
// For start edge: use positive offset (shifts clockwise into slice)
// For end edge: use negative offset (shifts counter-clockwise into slice)
export function offsetRadialLine(
  centerX: number,
  centerY: number,
  angle: number,
  offset: number
): OffsetLine {
  // Perpendicular direction is 90 degrees from radial
  const perpAngleRad = degreesToRadians(angle + 90)
  return {
    pointX: centerX + offset * Math.cos(perpAngleRad),
    pointY: centerY + offset * Math.sin(perpAngleRad),
    angle: angle,
  }
}

// Find intersection of offset line with a circle
// Returns the intersection point in the outward direction from center
export function lineCircleIntersection(
  line: OffsetLine,
  centerX: number,
  centerY: number,
  radius: number
): { x: number; y: number } | null {
  const dx = line.pointX - centerX
  const dy = line.pointY - centerY
  const angleRad = degreesToRadians(line.angle)
  const vx = Math.cos(angleRad)
  const vy = Math.sin(angleRad)

  // Quadratic equation: at^2 + bt + c = 0
  // where t parameterizes points along the line
  const a = 1 // vx^2 + vy^2 = 1 for unit direction
  const b = 2 * (dx * vx + dy * vy)
  const c = dx * dx + dy * dy - radius * radius

  const discriminant = b * b - 4 * a * c

  if (discriminant < 0) {
    // Line doesn't intersect circle (gap too large for this radius)
    return null
  }

  // Take the intersection in the positive (outward) direction
  const t = (-b + Math.sqrt(discriminant)) / (2 * a)

  return {
    x: line.pointX + t * vx,
    y: line.pointY + t * vy,
  }
}

// Calculate minimum inner radius for solid pies with gaps
// This is where offset edges can form a valid polygon
export function calculateMinimumInnerRadius(
  gapWidth: number,
  sweepAngle: number
): number {
  const halfSweepRad = degreesToRadians(sweepAngle / 2)
  const halfGap = gapWidth / 2

  // Minimum radius where the two offset edges can meet
  // Based on geometry: r = halfGap / sin(halfSweep)
  const sinHalfSweep = Math.sin(halfSweepRad)
  if (sinHalfSweep < 0.001) {
    // Very small angle, return a safe minimum
    return halfGap * 100
  }
  return halfGap / sinHalfSweep
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
// When gapWidth > 0, generates true geometric gaps (constant-width parallel edges)
export function generateSegmentPath(
  startAngle: number,
  endAngle: number,
  sweepAngle: number,
  isOnlySegment: boolean,
  innerRadius: number = 0,
  gapWidth: number = 0
): string {
  // If only one non-zero segment, render as full circle or annulus (no gaps needed)
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

  // If gapWidth is specified, use true geometric gaps
  if (gapWidth > 0) {
    return generateGappedSegmentPath(startAngle, endAngle, sweepAngle, innerRadius, gapWidth)
  }

  // For donut segments (innerRadius > 0) without gaps
  if (innerRadius > 0) {
    return generateDonutSegmentPath(startAngle, endAngle, sweepAngle, innerRadius)
  }

  // Original solid pie wedge logic below (stroke-based gaps)

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

// Generate segment path with true geometric gaps (constant-width parallel edges)
export function generateGappedSegmentPath(
  startAngle: number,
  endAngle: number,
  sweepAngle: number,
  innerRadius: number,
  gapWidth: number
): string {
  const halfGap = gapWidth / 2

  // Calculate offset lines for both edges
  // Start edge: offset clockwise (positive perpendicular)
  // End edge: offset counter-clockwise (negative perpendicular)
  const startEdge = offsetRadialLine(CENTER_X, CENTER_Y, startAngle, halfGap)
  const endEdge = offsetRadialLine(CENTER_X, CENTER_Y, endAngle, -halfGap)

  // Find intersections with outer circle
  const startOuter = lineCircleIntersection(startEdge, CENTER_X, CENTER_Y, OUTER_RADIUS)
  const endOuter = lineCircleIntersection(endEdge, CENTER_X, CENTER_Y, OUTER_RADIUS)

  // Determine effective inner radius
  // For gaps to work, we need a minimum inner radius where offset edges can meet
  const minInnerRadius = calculateMinimumInnerRadius(gapWidth, sweepAngle)
  // Add small padding to ensure clean intersection
  const safeMinInnerRadius = Math.max(minInnerRadius, halfGap + 2)
  // Use whichever is larger: user's inner radius or the geometric minimum
  const effectiveInnerRadius = Math.max(innerRadius, safeMinInnerRadius)

  // Find intersections with inner circle
  const startInner = lineCircleIntersection(startEdge, CENTER_X, CENTER_Y, effectiveInnerRadius)
  const endInner = lineCircleIntersection(endEdge, CENTER_X, CENTER_Y, effectiveInnerRadius)

  // Check if all intersections are valid
  if (!startOuter || !endOuter || !startInner || !endInner) {
    // Fallback: segment too small for gaps, skip or render minimal
    return ''
  }

  // Calculate arc flags
  // For outer arc: need to determine the sweep direction
  const outerLargeArcFlag = sweepAngle > 180 ? 1 : 0
  const innerLargeArcFlag = sweepAngle > 180 ? 1 : 0

  // Check if segment is large enough for rounded corners
  if (sweepAngle >= 15) {
    return generateGappedSegmentWithCorners(
      startAngle, endAngle,
      startEdge, endEdge,
      startOuter, endOuter,
      startInner, endInner,
      effectiveInnerRadius,
      sweepAngle
    )
  }

  // Simple gapped path without rounded corners
  return [
    `M ${startInner.x} ${startInner.y}`,
    `L ${startOuter.x} ${startOuter.y}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${outerLargeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${effectiveInnerRadius} ${effectiveInnerRadius} 0 ${innerLargeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    'Z',
  ].join(' ')
}

// Generate gapped segment path with rounded corners on outer edge only
function generateGappedSegmentWithCorners(
  _startAngle: number,
  _endAngle: number,
  _startEdge: OffsetLine,
  _endEdge: OffsetLine,
  startOuter: { x: number; y: number },
  endOuter: { x: number; y: number },
  startInner: { x: number; y: number },
  endInner: { x: number; y: number },
  innerRadius: number,
  sweepAngle: number
): string {
  // D3 constraint: corner radius cannot exceed half the ring thickness
  const maxCornerRadius = (OUTER_RADIUS - innerRadius) / 2
  // Use consistent corner radius across all slices (don't scale by sweep angle)
  const baseCornerRadius = Math.min(CORNER_RADIUS, maxCornerRadius)

  // Calculate direction vectors for the radial edges
  const startEdgeDx = startOuter.x - startInner.x
  const startEdgeDy = startOuter.y - startInner.y
  const startEdgeLen = Math.sqrt(startEdgeDx * startEdgeDx + startEdgeDy * startEdgeDy)

  const endEdgeDx = endOuter.x - endInner.x
  const endEdgeDy = endOuter.y - endInner.y
  const endEdgeLen = Math.sqrt(endEdgeDx * endEdgeDx + endEdgeDy * endEdgeDy)

  // Inset points on radial edges (move back from outer corner by corner radius)
  const startCornerInset: Point = {
    x: startOuter.x - (startEdgeDx / startEdgeLen) * baseCornerRadius,
    y: startOuter.y - (startEdgeDy / startEdgeLen) * baseCornerRadius
  }

  const endCornerInset: Point = {
    x: endOuter.x - (endEdgeDx / endEdgeLen) * baseCornerRadius,
    y: endOuter.y - (endEdgeDy / endEdgeLen) * baseCornerRadius
  }

  // Calculate actual angles of the outer intersection points (not the original slice angles)
  // This is critical for consistent corner radius across all slice sizes
  const startOuterAngle = Math.atan2(startOuter.y - CENTER_Y, startOuter.x - CENTER_X) * (180 / Math.PI)
  const endOuterAngle = Math.atan2(endOuter.y - CENTER_Y, endOuter.x - CENTER_X) * (180 / Math.PI)

  // Points on outer arc where corners end (offset by angle equivalent to corner radius)
  const cornerAngleOffset = (baseCornerRadius / OUTER_RADIUS) * (180 / Math.PI)
  const startOuterArcPoint = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, startOuterAngle + cornerAngleOffset)
  const endOuterArcPoint = polarToCartesian(CENTER_X, CENTER_Y, OUTER_RADIUS, endOuterAngle - cornerAngleOffset)

  const largeArcFlag = sweepAngle > 180 ? 1 : 0
  // Calculate the actual arc sweep between the corner arc points
  let actualArcSweep = endOuterAngle - startOuterAngle - 2 * cornerAngleOffset
  if (actualArcSweep < 0) actualArcSweep += 360
  const adjustedLargeArcFlag = actualArcSweep > 180 ? 1 : 0

  const pathParts: string[] = []

  // Start at inner-start corner (sharp)
  pathParts.push(`M ${startInner.x} ${startInner.y}`)

  // Line along start radial edge to corner inset
  pathParts.push(`L ${startCornerInset.x} ${startCornerInset.y}`)

  // Outer-Start corner arc (quadratic bezier for smooth corner)
  pathParts.push(`Q ${startOuter.x} ${startOuter.y} ${startOuterArcPoint.x} ${startOuterArcPoint.y}`)

  // Main outer arc
  pathParts.push(`A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${adjustedLargeArcFlag} 1 ${endOuterArcPoint.x} ${endOuterArcPoint.y}`)

  // Outer-End corner arc (quadratic bezier for smooth corner)
  pathParts.push(`Q ${endOuter.x} ${endOuter.y} ${endCornerInset.x} ${endCornerInset.y}`)

  // Line along end radial edge to inner-end corner (sharp)
  pathParts.push(`L ${endInner.x} ${endInner.y}`)

  // Main inner arc (back to start)
  pathParts.push(`A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`)

  pathParts.push('Z')

  return pathParts.join(' ')
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
  return sweepAngle < 30 ? 16 : 18
}
