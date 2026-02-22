import type { Segment, InputMode, LegendPosition } from '../types'
import { getPaletteColor } from '../data/palettes'
import { getContrastTextColor } from './color'
import {
  calculateSegmentAngles,
  generateSegmentPath,
  getLabelPosition,
  shouldShowLabel,
  getLabelFontSize,
  calculateInnerRadius,
  calculateGapWidth,
} from './geometry'
import { calculateCanvasDimensions, LAYOUT, getLegendColumnCount } from './canvasLayout'

// Font data will be loaded dynamically
let fontDataCache: {
  regular: string
  semiBold: string
  bold: string
} | null = null

async function loadFontData(): Promise<typeof fontDataCache> {
  if (fontDataCache) return fontDataCache

  try {
    const [regularResponse, semiBoldResponse, boldResponse] = await Promise.all([
      fetch(new URL('../fonts/Inter-Regular.woff2', import.meta.url).href),
      fetch(new URL('../fonts/Inter-SemiBold.woff2', import.meta.url).href),
      fetch(new URL('../fonts/Inter-Bold.woff2', import.meta.url).href),
    ])

    const [regularBuffer, semiBoldBuffer, boldBuffer] = await Promise.all([
      regularResponse.arrayBuffer(),
      semiBoldResponse.arrayBuffer(),
      boldResponse.arrayBuffer(),
    ])

    fontDataCache = {
      regular: arrayBufferToBase64(regularBuffer),
      semiBold: arrayBufferToBase64(semiBoldBuffer),
      bold: arrayBufferToBase64(boldBuffer),
    }

    return fontDataCache
  } catch (error) {
    console.error('Failed to load font data:', error)
    return null
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function generateEmbeddedFontCSS(fontData: NonNullable<typeof fontDataCache>): string {
  return `
    @font-face {
      font-family: 'Inter';
      font-weight: 400;
      src: url(data:font/woff2;base64,${fontData.regular}) format('woff2');
    }
    @font-face {
      font-family: 'Inter';
      font-weight: 600;
      src: url(data:font/woff2;base64,${fontData.semiBold}) format('woff2');
    }
    @font-face {
      font-family: 'Inter';
      font-weight: 700;
      src: url(data:font/woff2;base64,${fontData.bold}) format('woff2');
    }
  `
}

interface ExportOptions {
  segments: Segment[]
  paletteId: string
  title: string
  inputMode: InputMode
  legendPosition: LegendPosition
  backgroundColor: string
  innerRadiusPercent: number
  gapWidthPercent: number
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generateExportSVG(
  options: ExportOptions,
  fontCSS: string | null,
  format: ExportFormat
): string {
  const { segments, paletteId, title, inputMode, legendPosition, backgroundColor, innerRadiusPercent, gapWidthPercent } = options
  const segmentAngles = calculateSegmentAngles(segments)
  const nonZeroCount = segments.filter((s) => s.value > 0).length
  const innerRadius = calculateInnerRadius(innerRadiusPercent)

  // Use true geometric gaps for all formats
  const gapWidth = nonZeroCount > 1 ? calculateGapWidth(gapWidthPercent) : 0

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

  const isRightPosition = legendPosition === 'right'

  // Use shared layout calculator for consistent dimensions
  const dims = calculateCanvasDimensions(legendPosition, segments.length, !!title)
  const totalWidth = dims.width
  const totalHeight = dims.height
  const chartOffsetX = dims.chartX
  const chartOffsetY = dims.chartY
  const legendStartX = dims.legendX
  const legendStartY = dims.legendY

  // Background rect (only for non-PNG formats)
  const bgRect = format !== 'png'
    ? `<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="${backgroundColor}" />`
    : ''

  // Generate segment paths with true geometric gaps
  const segmentPaths = segments
    .map((segment, index) => {
      const angles = segmentAngles[index]
      if (!angles || angles.sweepAngle === 0) return ''

      const color = getSegmentColor(segment, index)
      const path = generateSegmentPath(
        angles.startAngle,
        angles.endAngle,
        angles.sweepAngle,
        nonZeroCount === 1,
        innerRadius,
        gapWidth
      )

      if (!path) return ''

      return `<path d="${path}" fill="${color}" />`
    })
    .join('')

  // Generate labels
  const labels = segments
    .map((segment, index) => {
      const angles = segmentAngles[index]
      if (!angles || angles.sweepAngle === 0) return ''
      if (!shouldShowLabel(angles.sweepAngle)) return ''

      const color = getSegmentColor(segment, index)
      const textColor = getContrastTextColor(color)
      const labelPos = getLabelPosition(angles.midAngle, innerRadius)
      const fontSize = getLabelFontSize(angles.sweepAngle)

      return `
        <text
          x="${labelPos.x}"
          y="${labelPos.y}"
          text-anchor="middle"
          dominant-baseline="central"
          fill="${textColor}"
          font-size="${fontSize}"
          font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          font-weight="600"
        >${escapeXml(formatLabel(segment.value))}</text>
      `
    })
    .join('')

  // Generate legend using shared constants
  let legendSvg: string
  if (isRightPosition) {
    // Vertical single-column layout for right position
    legendSvg = segments
      .map((segment, index) => {
        const color = getSegmentColor(segment, index)
        const x = legendStartX
        const y = legendStartY + index * LAYOUT.LEGEND_ITEM_HEIGHT

        return `
          <circle cx="${x}" cy="${y + LAYOUT.LEGEND_DOT_RADIUS}" r="${LAYOUT.LEGEND_DOT_RADIUS}" fill="${color}" />
          <text
            x="${x + LAYOUT.LEGEND_DOT_LABEL_GAP}"
            y="${y + LAYOUT.LEGEND_DOT_RADIUS}"
            font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            font-size="${LAYOUT.LEGEND_FONT_SIZE}"
            font-weight="${LAYOUT.LEGEND_FONT_WEIGHT}"
            fill="${LAYOUT.LEGEND_TEXT_COLOR}"
            dominant-baseline="central"
          >${escapeXml(segment.label)}</text>
        `
      })
      .join('')
  } else {
    // Horizontal grid layout for bottom position
    const columnCount = getLegendColumnCount(segments.length, legendPosition)
    const itemWidth = totalWidth / columnCount
    legendSvg = segments
      .map((segment, index) => {
        const color = getSegmentColor(segment, index)
        const col = index % columnCount
        const row = Math.floor(index / columnCount)
        const x = col * itemWidth + itemWidth / 2 - 60
        const y = legendStartY + row * LAYOUT.LEGEND_ITEM_HEIGHT

        return `
          <circle cx="${x}" cy="${y + LAYOUT.LEGEND_DOT_RADIUS}" r="${LAYOUT.LEGEND_DOT_RADIUS}" fill="${color}" />
          <text
            x="${x + LAYOUT.LEGEND_DOT_LABEL_GAP}"
            y="${y + LAYOUT.LEGEND_DOT_RADIUS}"
            font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            font-size="${LAYOUT.LEGEND_FONT_SIZE}"
            font-weight="${LAYOUT.LEGEND_FONT_WEIGHT}"
            fill="${LAYOUT.LEGEND_TEXT_COLOR}"
            dominant-baseline="central"
          >${escapeXml(segment.label)}</text>
        `
      })
      .join('')
  }

  // Generate title using shared constants
  const titleSvg = title
    ? `
      <text
        x="${dims.titleX}"
        y="${dims.titleY}"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="${LAYOUT.TITLE_FONT_SIZE}"
        font-weight="${LAYOUT.TITLE_FONT_WEIGHT}"
        fill="${LAYOUT.TITLE_COLOR}"
      >${escapeXml(title)}</text>
    `
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  ${fontCSS ? `<defs><style>${fontCSS}</style></defs>` : ''}
  ${bgRect}
  ${titleSvg}
  <g transform="translate(${chartOffsetX}, ${chartOffsetY})">
    ${segmentPaths}
    ${labels}
  </g>
  ${legendSvg}
</svg>`
}

async function svgToCanvas(
  svgString: string,
  width: number,
  height: number,
  scale: number = 2
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const img = new Image()
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export type ExportFormat = 'png' | 'jpeg' | 'svg'

export async function exportChart(
  format: ExportFormat,
  options: ExportOptions
): Promise<void> {
  // Load font data for embedding
  const fontData = await loadFontData()
  const fontCSS = fontData ? generateEmbeddedFontCSS(fontData) : null

  // Generate SVG with format-specific settings
  const svgString = generateExportSVG(options, fontCSS, format)

  // Use shared dimension calculator
  const dims = calculateCanvasDimensions(options.legendPosition, options.segments.length, !!options.title)
  const totalWidth = dims.width
  const totalHeight = dims.height

  if (format === 'svg') {
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    downloadBlob(blob, 'PieChartMaker.svg')
    return
  }

  // PNG or JPEG
  const canvas = await svgToCanvas(svgString, totalWidth, totalHeight, 2)

  canvas.toBlob(
    (blob) => {
      if (blob) {
        downloadBlob(blob, `PieChartMaker.${format}`)
      }
    },
    format === 'jpeg' ? 'image/jpeg' : 'image/png',
    format === 'jpeg' ? 0.95 : undefined
  )
}
