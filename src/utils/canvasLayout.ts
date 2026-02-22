import type { LegendPosition } from '../types'
import { SVG_SIZE } from './geometry'

// Canvas layout constants - SINGLE SOURCE OF TRUTH
// These values must match between preview and export
export const LAYOUT = {
  // Chart dimensions
  CHART_SIZE: SVG_SIZE, // 500

  // Title
  TITLE_HEIGHT: 50,
  TITLE_FONT_SIZE: 24,
  TITLE_FONT_WEIGHT: 700,
  TITLE_COLOR: '#111827',

  // Gaps
  CHART_LEGEND_GAP_SIDE: 48,
  CHART_LEGEND_GAP_BOTTOM: 32,
  SIDE_EXTRA_PADDING: 24, // Extra padding from edge for left/right layouts

  // Legend
  LEGEND_ITEM_HEIGHT: 32,
  LEGEND_DOT_RADIUS: 8,
  LEGEND_DOT_LABEL_GAP: 16,
  LEGEND_FONT_SIZE: 18,
  LEGEND_FONT_WEIGHT: 600,
  LEGEND_TEXT_COLOR: '#374151',
  LEGEND_RIGHT_WIDTH: 250,

  // Padding
  CANVAS_PADDING: 32,

  // Bottom canvas width
  BOTTOM_CANVAS_WIDTH: 640,
} as const

export interface CanvasDimensions {
  width: number
  height: number
  chartX: number
  chartY: number
  legendX: number
  legendY: number
  titleX: number
  titleY: number
}

export function calculateCanvasDimensions(
  legendPosition: LegendPosition,
  segmentCount: number,
  hasTitle: boolean
): CanvasDimensions {
  // Title space is always reserved when title exists, positioned at top
  const titleSpace = hasTitle ? LAYOUT.TITLE_HEIGHT : 0
  const chartSize = LAYOUT.CHART_SIZE
  const padding = LAYOUT.CANVAS_PADDING

  if (legendPosition === 'right' || legendPosition === 'left') {
    // Side layout: [sidePadding][legend?][gap][chart][gap][legend?][sidePadding]
    const legendTotalHeight = segmentCount * LAYOUT.LEGEND_ITEM_HEIGHT
    const sidePadding = padding + LAYOUT.SIDE_EXTRA_PADDING
    const contentWidth = chartSize + LAYOUT.CHART_LEGEND_GAP_SIDE + LAYOUT.LEGEND_RIGHT_WIDTH
    const contentHeight = Math.max(chartSize, legendTotalHeight)

    const width = sidePadding + contentWidth + sidePadding
    const height = titleSpace + padding + contentHeight + padding

    // Center content area vertically (below title if present)
    const contentAreaTop = titleSpace + padding

    let chartX: number
    let legendX: number

    if (legendPosition === 'right') {
      // Chart on left, legend on right
      chartX = sidePadding
      legendX = sidePadding + chartSize + LAYOUT.CHART_LEGEND_GAP_SIDE
    } else {
      // Legend on left, chart on right
      legendX = sidePadding
      chartX = sidePadding + LAYOUT.LEGEND_RIGHT_WIDTH + LAYOUT.CHART_LEGEND_GAP_SIDE
    }

    const chartY = contentAreaTop + (contentHeight - chartSize) / 2
    const legendY = contentAreaTop + (contentHeight - legendTotalHeight) / 2

    return {
      width,
      height,
      chartX,
      chartY,
      legendX,
      legendY,
      titleX: width / 2,
      titleY: 32 + LAYOUT.TITLE_HEIGHT / 2,
    }
  } else {
    // Bottom layout: chart above, legend below
    const columnCount = getLegendColumnCount(segmentCount, legendPosition)
    const rows = Math.ceil(segmentCount / columnCount)
    const legendHeight = rows * LAYOUT.LEGEND_ITEM_HEIGHT

    const contentHeight = chartSize + LAYOUT.CHART_LEGEND_GAP_BOTTOM + legendHeight
    const width = LAYOUT.BOTTOM_CANVAS_WIDTH
    const height = titleSpace + padding + contentHeight + padding

    // Center content area vertically (below title if present)
    const contentAreaTop = titleSpace + padding
    const chartX = (width - chartSize) / 2
    const chartY = contentAreaTop

    return {
      width,
      height,
      chartX,
      chartY,
      legendX: 0,
      legendY: contentAreaTop + chartSize + LAYOUT.CHART_LEGEND_GAP_BOTTOM,
      titleX: width / 2,
      titleY: 32 + LAYOUT.TITLE_HEIGHT / 2,
    }
  }
}

export function getLegendColumnCount(
  segmentCount: number,
  legendPosition: LegendPosition
): number {
  if (legendPosition === 'right' || legendPosition === 'left') return 1
  // 1-2 items: single row, 3+ items: 2 columns to allow wrapping
  return segmentCount <= 2 ? segmentCount : segmentCount <= 8 ? 2 : 3
}
