export interface Segment {
  id: string
  label: string
  value: number
  color: string | null // null = use palette color for this index
}

export interface AppState {
  segments: Segment[]
  title: string
  palette: string
  labelMode: 'percentage' | 'value'
}

export type LabelMode = 'percentage' | 'value'

export interface Palette {
  id: string
  name: string
  colors: string[]
}
