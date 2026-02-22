import type { Segment, LabelMode } from '../types'
import { getPaletteColor } from '../data/palettes'
import { getContrastTextColor } from './color'
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
} from './geometry'

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
  labelMode: LabelMode
  backgroundColor: string
  innerRadiusPercent: number
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
  const { segments, paletteId, title, labelMode, backgroundColor, innerRadiusPercent } = options
  const segmentAngles = calculateSegmentAngles(segments)
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const nonZeroCount = segments.filter((s) => s.value > 0).length
  const innerRadius = calculateInnerRadius(innerRadiusPercent)

  // For PNG, use transparent gaps; for JPEG/SVG use backgroundColor
  const gapColor = format === 'png' ? 'transparent' : backgroundColor

  const getSegmentColor = (segment: Segment, index: number): string => {
    return segment.color ?? getPaletteColor(paletteId, index)
  }

  const formatLabel = (value: number): string => {
    if (labelMode === 'value') {
      return value.toString()
    }
    const percentage = total > 0 ? (value / total) * 100 : 0
    const rounded = Math.round(percentage * 10) / 10
    const formatted = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)
    return `${formatted}%`
  }

  // Calculate legend dimensions
  const legendItems = segments.length
  const columnCount = legendItems <= 3 ? legendItems : legendItems <= 8 ? 2 : 3
  const rows = Math.ceil(legendItems / columnCount)
  const legendHeight = rows * 24 + 20

  // Total height: chart + gap + legend + optional title
  const titleHeight = title ? 50 : 0
  const chartSize = SVG_SIZE
  const gap = 40
  const totalHeight = titleHeight + chartSize + gap + legendHeight
  const totalWidth = 600

  // Background rect (only for non-PNG formats)
  const bgRect = format !== 'png'
    ? `<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="${backgroundColor}" />`
    : ''

  // Generate segment paths
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
        innerRadius
      )

      if (!path) return ''

      const strokeAttr = nonZeroCount > 1
        ? `stroke="${gapColor}" stroke-width="${GAP_SIZE}" stroke-linejoin="round"`
        : ''
      return `<path d="${path}" fill="${color}" ${strokeAttr} />`
    })
    .join('')

  // Center circle to cover stroke junction (solid pie only)
  const centerCircle = nonZeroCount > 1 && innerRadius === 0
    ? `<circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${GAP_SIZE + 2}" fill="${gapColor}" />`
    : ''

  // Donut hole
  const donutHole = innerRadius > 0
    ? `<circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${innerRadius}" fill="${gapColor}" />`
    : ''

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

  // Generate legend
  const legendStartY = titleHeight + chartSize + gap
  const itemWidth = totalWidth / columnCount
  const legendSvg = segments
    .map((segment, index) => {
      const color = getSegmentColor(segment, index)
      const col = index % columnCount
      const row = Math.floor(index / columnCount)
      const x = col * itemWidth + itemWidth / 2 - 60
      const y = legendStartY + row * 24

      return `
        <circle cx="${x}" cy="${y + 5}" r="5" fill="${color}" />
        <text
          x="${x + 13}"
          y="${y + 5}"
          font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          font-size="13"
          font-weight="400"
          fill="#374151"
          dominant-baseline="central"
        >${escapeXml(segment.label)}</text>
      `
    })
    .join('')

  // Generate title
  const titleSvg = title
    ? `
      <text
        x="${totalWidth / 2}"
        y="30"
        text-anchor="middle"
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="24"
        font-weight="700"
        fill="#111827"
      >${escapeXml(title)}</text>
    `
    : ''

  // Chart offset to center it
  const chartOffsetX = (totalWidth - chartSize) / 2
  const chartOffsetY = titleHeight

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  ${fontCSS ? `<defs><style>${fontCSS}</style></defs>` : ''}
  ${bgRect}
  ${titleSvg}
  <g transform="translate(${chartOffsetX}, ${chartOffsetY})">
    ${segmentPaths}
    ${centerCircle}
    ${donutHole}
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

  // Calculate dimensions
  const titleHeight = options.title ? 50 : 0
  const legendItems = options.segments.length
  const rows = Math.ceil(legendItems / (legendItems <= 3 ? legendItems : legendItems <= 8 ? 2 : 3))
  const legendHeight = rows * 24 + 20
  const totalHeight = titleHeight + SVG_SIZE + 40 + legendHeight
  const totalWidth = 600

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
