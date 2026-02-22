import type { Segment, InputMode } from '../types'

export interface PlaceholderResult {
  segmentId: string
  placeholderValue: number
}

/**
 * Calculate placeholder values for empty/placeholder segments in percentages mode.
 * Distributes remaining percentage evenly among placeholder segments.
 */
export function calculatePlaceholders(
  segments: Segment[],
  inputMode: InputMode
): PlaceholderResult[] {
  if (inputMode === 'values') {
    // In values mode, no placeholder calculation needed
    return []
  }

  // Percentages mode logic:
  // Find segments with explicit user-entered values vs placeholders
  const filledSegments = segments.filter(s => !s.isPlaceholder && s.value > 0)
  const placeholderSegments = segments.filter(s => s.isPlaceholder)

  const filledTotal = filledSegments.reduce((sum, s) => sum + s.value, 0)
  const remaining = Math.max(0, 100 - filledTotal)

  if (placeholderSegments.length === 0 || remaining <= 0) {
    return []
  }

  // Distribute remaining percentage evenly among placeholder segments
  const perSegment = remaining / placeholderSegments.length
  // Round to 1 decimal place for display
  const roundedValue = Math.round(perSegment * 10) / 10

  return placeholderSegments.map(segment => ({
    segmentId: segment.id,
    placeholderValue: roundedValue,
  }))
}

/**
 * Calculate the total of all segment values.
 */
export function calculateTotal(segments: Segment[]): number {
  return segments.reduce((sum, s) => sum + s.value, 0)
}

/**
 * Get the display values for segments, incorporating placeholder calculations.
 * Returns a map of segmentId -> displayValue
 */
export function getSegmentDisplayValues(
  segments: Segment[],
  inputMode: InputMode
): Map<string, number> {
  const displayValues = new Map<string, number>()
  const placeholders = calculatePlaceholders(segments, inputMode)

  for (const segment of segments) {
    const placeholder = placeholders.find(p => p.segmentId === segment.id)
    displayValues.set(segment.id, placeholder?.placeholderValue ?? segment.value)
  }

  return displayValues
}

/**
 * Check if auto-fill should be applied to a segment.
 * Returns the segment ID and value if exactly one placeholder remains and total is under 100%.
 */
export function getAutoFillTarget(
  segments: Segment[],
  inputMode: InputMode
): { segmentId: string; value: number } | null {
  if (inputMode !== 'percentages') {
    return null
  }

  const placeholderSegments = segments.filter(s => s.isPlaceholder)

  // Only auto-fill when exactly one placeholder remains
  if (placeholderSegments.length !== 1) {
    return null
  }

  const filledTotal = segments
    .filter(s => !s.isPlaceholder)
    .reduce((sum, s) => sum + s.value, 0)

  const remaining = 100 - filledTotal

  // Only auto-fill if there's a positive remainder
  if (remaining <= 0) {
    return null
  }

  const targetSegment = placeholderSegments[0]
  if (!targetSegment) {
    return null
  }

  return {
    segmentId: targetSegment.id,
    value: Math.round(remaining * 10) / 10,
  }
}
