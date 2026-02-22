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

export type LegendPosition = 'bottom' | 'right'

export interface Palette {
  id: string
  name: string
  colors: string[]
}
