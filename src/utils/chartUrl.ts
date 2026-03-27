import { deflate, inflate } from 'pako'
import { nanoid } from 'nanoid'
import type { Segment, LabelMode, LegendPosition } from '../types'

export interface ChartConfig {
  segments: Segment[]
  title: string
  palette: string
  style: string
  labelMode: LabelMode
  legendPosition: LegendPosition
  backgroundColor: string
  innerRadiusPercent: number
  gapWidthPercent: number
}

interface CompactSegment {
  l: string
  v: number
  c: string
}

interface CompactChart {
  s: CompactSegment[]
  t?: string
  p?: string
  y?: string
  m?: string
  g?: string
  b?: string
  r?: number
  w?: number
}

const DEFAULTS = {
  title: '',
  palette: 'modern',
  style: 'modern',
  labelMode: 'percentage',
  legendPosition: 'bottom',
  backgroundColor: '#ffffff',
  innerRadiusPercent: 0,
  gapWidthPercent: 20,
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function encodeChartState(config: ChartConfig): string {
  const compact: CompactChart = {
    s: config.segments.map((seg) => ({
      l: seg.label,
      v: seg.value,
      c: (seg.color || '').replace('#', ''),
    })),
  }

  // Only include non-default values
  if (config.title !== DEFAULTS.title) compact.t = config.title
  if (config.palette !== DEFAULTS.palette) compact.p = config.palette
  if (config.style !== DEFAULTS.style) compact.y = config.style
  if (config.labelMode !== DEFAULTS.labelMode) compact.m = config.labelMode
  if (config.legendPosition !== DEFAULTS.legendPosition) compact.g = config.legendPosition
  if (config.backgroundColor !== DEFAULTS.backgroundColor) compact.b = config.backgroundColor.replace('#', '')
  if (config.innerRadiusPercent !== DEFAULTS.innerRadiusPercent) compact.r = config.innerRadiusPercent
  if (config.gapWidthPercent !== DEFAULTS.gapWidthPercent) compact.w = config.gapWidthPercent

  const json = JSON.stringify(compact)
  const compressed = deflate(new TextEncoder().encode(json))
  return toBase64Url(compressed)
}

export function decodeChartState(encoded: string): ChartConfig | null {
  try {
    const compressed = fromBase64Url(encoded)
    const json = new TextDecoder().decode(inflate(compressed))
    const compact: CompactChart = JSON.parse(json)

    if (!compact.s || !Array.isArray(compact.s) || compact.s.length === 0) {
      return null
    }

    const segments: Segment[] = compact.s.map((seg) => ({
      id: nanoid(),
      label: seg.l || '',
      value: seg.v || 0,
      color: seg.c ? (seg.c.startsWith('#') ? seg.c : `#${seg.c}`) : '#888888',
    }))

    return {
      segments,
      title: compact.t ?? DEFAULTS.title,
      palette: compact.p ?? DEFAULTS.palette,
      style: compact.y ?? DEFAULTS.style,
      labelMode: (compact.m as LabelMode) ?? (DEFAULTS.labelMode as LabelMode),
      legendPosition: (compact.g as LegendPosition) ?? (DEFAULTS.legendPosition as LegendPosition),
      backgroundColor: compact.b ? (compact.b.startsWith('#') ? compact.b : `#${compact.b}`) : DEFAULTS.backgroundColor,
      innerRadiusPercent: compact.r ?? DEFAULTS.innerRadiusPercent,
      gapWidthPercent: compact.w ?? DEFAULTS.gapWidthPercent,
    }
  } catch {
    return null
  }
}
