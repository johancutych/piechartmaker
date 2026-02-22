import type { Segment, InputMode, LegendPosition } from '../types'
import { getPaletteColor } from '../data/palettes'
import { getStyle } from '../data/styles'
import { getContrastTextColor, lightenColor, darkenColor, hexToRgba } from './color'
import {
  calculateSegmentAngles,
  generateSegmentPath,
  getLabelPosition,
  shouldShowLabel,
  getLabelFontSize,
  calculateInnerRadius,
  calculateGapWidth,
  shouldLabelBeExternal,
  getExternalLabelPosition,
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
  styleId: string
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
  const { segments, paletteId, styleId, title, inputMode, legendPosition, backgroundColor, innerRadiusPercent, gapWidthPercent } = options
  const style = getStyle(styleId)
  const segmentAngles = calculateSegmentAngles(segments)
  const nonZeroCount = segments.filter((s) => s.value > 0).length
  const innerRadius = calculateInnerRadius(innerRadiusPercent)

  // Use true geometric gaps for all formats, scaled by style
  const baseGapWidth = calculateGapWidth(gapWidthPercent)
  const gapWidth = nonZeroCount > 1 ? baseGapWidth * style.gapMultiplier : 0

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

  const isSidePosition = legendPosition === 'right' || legendPosition === 'left'

  // Calculate text color based on background contrast
  const textColor = backgroundColor === 'transparent' ? LAYOUT.TITLE_COLOR : getContrastTextColor(backgroundColor)
  const legendTextColor = backgroundColor === 'transparent' ? LAYOUT.LEGEND_TEXT_COLOR : getContrastTextColor(backgroundColor)

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

  // Generate gradient and filter definitions
  const needsGradients = style.segment.fill === 'gradient'
  const needsNeonFilter = style.segment.filter === 'neon-glow'

  let gradientDefs = ''
  if (needsGradients) {
    gradientDefs = segments.map((segment, index) => {
      const color = getSegmentColor(segment, index)
      const angles = segmentAngles[index]
      if (!angles || angles.sweepAngle === 0) return ''

      // Calculate gradient angle based on segment position
      const gradAngle = angles.midAngle + 90
      const rad = (gradAngle * Math.PI) / 180
      const x1 = 50 - Math.cos(rad) * 50
      const y1 = 50 - Math.sin(rad) * 50
      const x2 = 50 + Math.cos(rad) * 50
      const y2 = 50 + Math.sin(rad) * 50

      return `
        <linearGradient id="grad-${segment.id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
          <stop offset="0%" stop-color="${lightenColor(color, 0.35)}" />
          <stop offset="100%" stop-color="${darkenColor(color, 0.1)}" />
        </linearGradient>
      `
    }).join('')
  }

  const neonFilterDef = needsNeonFilter
    ? `<filter id="neon-glow" x="-100%" y="-100%" width="300%" height="300%">
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
      </filter>`
    : ''

  // Generate segment paths with true geometric gaps and style
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
        gapWidth,
        style.segment.cornerRadius
      )

      if (!path) return ''

      // Determine fill
      let fill: string
      if (style.segment.fill === 'transparent') {
        fill = 'none'
      } else if (style.segment.fill === 'gradient') {
        fill = `url(#grad-${segment.id})`
      } else {
        fill = color
      }

      // Determine stroke
      let strokeAttr = ''
      if (style.segment.stroke) {
        const strokeColor = style.segment.stroke.color === 'segment'
          ? darkenColor(color, style.segment.stroke.darkening)
          : style.segment.stroke.color
        strokeAttr = `stroke="${strokeColor}" stroke-width="${style.segment.stroke.width}"`
      }

      // Determine filter
      let filterAttr = ''
      if (style.segment.filter) {
        filterAttr = `filter="url(#${style.segment.filter})"`
      }

      // Determine style for shadow
      let styleAttr = ''
      if (style.segment.shadow) {
        const s = style.segment.shadow
        const shadowColor = s.color === 'segment'
          ? darkenColor(color, s.darkening)
          : s.color
        styleAttr = `style="filter: drop-shadow(${s.offsetX}px ${s.offsetY}px ${s.blur}px ${shadowColor})"`
      }

      return `<path d="${path}" fill="${fill}" ${strokeAttr} ${filterAttr} ${styleAttr} />`
    })
    .join('')

  // Generate labels
  const labels = segments
    .map((segment, index) => {
      const angles = segmentAngles[index]
      if (!angles || angles.sweepAngle === 0) return ''
      if (!shouldShowLabel(angles.sweepAngle)) return ''

      const color = getSegmentColor(segment, index)
      const isExternal = shouldLabelBeExternal(angles.sweepAngle)

      let labelPos: { x: number; y: number }
      let textAnchor: 'start' | 'middle' | 'end' = 'middle'
      let textColor: string

      if (isExternal) {
        // External labels: position outside the pie
        const externalPos = getExternalLabelPosition(angles.midAngle)
        labelPos = { x: externalPos.x, y: externalPos.y }
        textAnchor = externalPos.textAnchor
        // External labels use segment color (not on top of slice)
        textColor = color
      } else {
        // Internal labels: position inside the slice
        labelPos = getLabelPosition(angles.midAngle, innerRadius)
        // For outline style, use segment color; otherwise use contrast color
        textColor = style.segment.fill === 'transparent'
          ? color
          : getContrastTextColor(color)
      }

      const fontSize = getLabelFontSize(angles.sweepAngle)

      return `
        <text
          x="${labelPos.x}"
          y="${labelPos.y}"
          text-anchor="${textAnchor}"
          dominant-baseline="central"
          fill="${textColor}"
          font-size="${fontSize}"
          font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          font-weight="600"
        >${escapeXml(formatLabel(segment.value))}</text>
      `
    })
    .join('')

  // Generate legend using shared constants with style-aware indicators
  const legendStyle = style.legend
  const indicatorSize = legendStyle.indicatorSize
  const indicatorRadius = indicatorSize / 2

  // Helper to generate indicator SVG based on style
  const generateIndicator = (x: number, y: number, color: string): string => {
    const cx = x
    const cy = y + indicatorRadius

    switch (legendStyle.indicatorShape) {
      case 'rectangle':
        return `<rect x="${cx - indicatorRadius}" y="${cy - indicatorRadius}" width="${indicatorSize}" height="${indicatorSize}" rx="2" fill="${color}" />`
      case 'ring':
        return `<circle cx="${cx}" cy="${cy}" r="${indicatorRadius - 1.5}" fill="none" stroke="${color}" stroke-width="3" />`
      case 'circle':
      default:
        if (legendStyle.stroke) {
          const strokeColor = darkenColor(color, 0.2)
          return `<circle cx="${cx}" cy="${cy}" r="${indicatorRadius - 1}" fill="${color}" stroke="${strokeColor}" stroke-width="2" />`
        } else if (legendStyle.glow) {
          const glow1 = hexToRgba(color, 0.5)
          const glow2 = hexToRgba(color, 0.3)
          return `<circle cx="${cx}" cy="${cy}" r="${indicatorRadius}" fill="${color}" style="filter: drop-shadow(0 0 12px ${glow1}) drop-shadow(0 0 24px ${glow2});" />`
        }
        return `<circle cx="${cx}" cy="${cy}" r="${indicatorRadius}" fill="${color}" />`
    }
  }

  let legendSvg: string
  if (isSidePosition) {
    // Vertical single-column layout for left/right position
    legendSvg = segments
      .map((segment, index) => {
        const color = getSegmentColor(segment, index)
        const x = legendStartX
        const y = legendStartY + index * LAYOUT.LEGEND_ITEM_HEIGHT

        return `
          ${generateIndicator(x, y, color)}
          <text
            x="${x + indicatorRadius + LAYOUT.LEGEND_DOT_LABEL_GAP - LAYOUT.LEGEND_DOT_RADIUS}"
            y="${y + indicatorRadius}"
            font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            font-size="${LAYOUT.LEGEND_FONT_SIZE}"
            font-weight="${LAYOUT.LEGEND_FONT_WEIGHT}"
            fill="${legendTextColor}"
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
          ${generateIndicator(x, y, color)}
          <text
            x="${x + indicatorRadius + LAYOUT.LEGEND_DOT_LABEL_GAP - LAYOUT.LEGEND_DOT_RADIUS}"
            y="${y + indicatorRadius}"
            font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            font-size="${LAYOUT.LEGEND_FONT_SIZE}"
            font-weight="${LAYOUT.LEGEND_FONT_WEIGHT}"
            fill="${legendTextColor}"
            dominant-baseline="central"
          >${escapeXml(segment.label)}</text>
        `
      })
      .join('')
  }

  // Generate title using shared constants with style
  const titleStyleAttr = style.title.shadow ? `style="text-shadow: ${style.title.shadow}"` : ''
  const titleSvg = title
    ? `
      <text
        x="${dims.titleX}"
        y="${dims.titleY}"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="${LAYOUT.TITLE_FONT_SIZE}"
        font-weight="${style.title.fontWeight}"
        fill="${textColor}"
        ${titleStyleAttr}
      >${escapeXml(title)}</text>
    `
    : ''

  // Build defs section with fonts, gradients, and filters
  const defsContent = [
    fontCSS ? `<style>${fontCSS}</style>` : '',
    gradientDefs,
    neonFilterDef,
  ].filter(Boolean).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  ${defsContent ? `<defs>${defsContent}</defs>` : ''}
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
