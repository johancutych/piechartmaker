export interface Segment {
  id: string
  label: string
  value: number
  color: string | null // null = use palette color for this index
  isPlaceholder?: boolean // true if value was auto-calculated, not user-entered
}

export type InputMode = 'values' | 'percentages'

export interface AppState {
  segments: Segment[]
  title: string
  palette: string
  labelMode: 'percentage' | 'value'
}

export type LabelMode = 'percentage' | 'value'

export type LegendPosition = 'bottom' | 'left' | 'right'

export interface Palette {
  id: string
  name: string
  colors: string[]
}

// Chart Style Types
export interface SegmentShadow {
  offsetX: number
  offsetY: number
  blur: number
  color: 'segment' | string // 'segment' = derive from segment color
  darkening: number // 0-1, amount to darken when using 'segment'
}

export interface SegmentStroke {
  width: number
  color: 'segment' | string // 'segment' = derive from segment color
  darkening: number // 0-1, amount to darken
}

export interface SegmentStyle {
  cornerRadius: number
  fill: 'solid' | 'gradient' | 'transparent'
  stroke: SegmentStroke | null
  shadow: SegmentShadow | null
  filter: string | null // SVG filter ID
}

export interface LegendStyle {
  indicatorShape: 'circle' | 'rectangle' | 'ring'
  indicatorSize: number
  stroke?: boolean
  glow?: boolean
}

export interface TitleStyle {
  fontWeight: number
  shadow: string | null // CSS text-shadow
}

export interface ChartStyle {
  id: string
  name: string
  segment: SegmentStyle
  legend: LegendStyle
  title: TitleStyle
  gapMultiplier: number
}
