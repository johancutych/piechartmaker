import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Segment, LabelMode, LegendPosition, InputMode } from './types'
import { getPaletteColor } from './data/palettes'

interface StoreState {
  segments: Segment[]
  title: string
  palette: string
  labelMode: LabelMode
  legendPosition: LegendPosition
  backgroundColor: string
  innerRadiusPercent: number
  gapWidthPercent: number
  inputMode: InputMode

  // Actions
  addSegment: () => void
  removeSegment: (id: string) => void
  updateSegment: (id: string, updates: Partial<Omit<Segment, 'id'>>) => void
  reorderSegments: (fromIndex: number, toIndex: number) => void
  setTitle: (title: string) => void
  setPalette: (paletteId: string) => void
  setLabelMode: (mode: LabelMode) => void
  setLegendPosition: (position: LegendPosition) => void
  setBackgroundColor: (color: string) => void
  setInnerRadiusPercent: (percent: number) => void
  setGapWidthPercent: (percent: number) => void
  setInputMode: (mode: InputMode) => void
  resetToDefault: () => void
}

const DEFAULT_SEGMENTS: Segment[] = [
  { id: nanoid(), label: 'Marketing', value: 40, color: getPaletteColor('modern', 0) },
  { id: nanoid(), label: 'Engineering', value: 35, color: getPaletteColor('modern', 1) },
  { id: nanoid(), label: 'Design', value: 25, color: getPaletteColor('modern', 2) },
]

const DEFAULT_STATE = {
  segments: DEFAULT_SEGMENTS,
  title: '',
  palette: 'modern',
  labelMode: 'percentage' as LabelMode,
  legendPosition: 'bottom' as LegendPosition,
  backgroundColor: '#ffffff',
  innerRadiusPercent: 0,
  gapWidthPercent: 20,
  inputMode: 'values' as InputMode,
}

// Debounced localStorage wrapper
let saveTimeout: ReturnType<typeof setTimeout> | null = null

function debouncedSave(key: string, value: string): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    localStorage.setItem(key, value)
  }, 500)
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      addSegment: () => {
        const { segments, palette, inputMode } = get()
        const total = segments.reduce((sum, s) => sum + s.value, 0)

        // In percentages mode, calculate remaining to reach 100%
        // In values mode, start at 0
        const remainder = inputMode === 'percentages'
          ? Math.max(0, 100 - total)
          : 0

        const newSegment: Segment = {
          id: nanoid(),
          label: `Segment ${segments.length + 1}`,
          value: remainder,
          color: getPaletteColor(palette, segments.length),
          isPlaceholder: inputMode === 'percentages', // Placeholder in % mode until user edits
        }
        set({ segments: [...segments, newSegment] })
      },

      removeSegment: (id) => {
        const { segments } = get()
        if (segments.length <= 1) return // Minimum 1 segment
        set({ segments: segments.filter((s) => s.id !== id) })
      },

      updateSegment: (id, updates) => {
        const { segments } = get()
        set({
          segments: segments.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...updates,
                  // Clear placeholder flag when user explicitly sets a value
                  isPlaceholder: 'value' in updates ? false : s.isPlaceholder,
                }
              : s
          ),
        })
      },

      reorderSegments: (fromIndex, toIndex) => {
        const { segments } = get()
        const newSegments = [...segments]
        const [removed] = newSegments.splice(fromIndex, 1)
        if (removed) {
          newSegments.splice(toIndex, 0, removed)
          set({ segments: newSegments })
        }
      },

      setTitle: (title) => {
        set({ title })
      },

      setPalette: (paletteId) => {
        const { segments } = get()
        // Assign new palette colors to all segments based on current position
        set({
          palette: paletteId,
          segments: segments.map((s, index) => ({
            ...s,
            color: getPaletteColor(paletteId, index),
          })),
        })
      },

      setLabelMode: (mode) => {
        set({ labelMode: mode })
      },

      setLegendPosition: (position) => {
        set({ legendPosition: position })
      },

      setBackgroundColor: (color) => {
        set({ backgroundColor: color })
      },

      setInnerRadiusPercent: (percent) => {
        set({ innerRadiusPercent: Math.max(0, Math.min(80, percent)) })
      },

      setGapWidthPercent: (percent) => {
        set({ gapWidthPercent: Math.max(0, Math.min(100, percent)) })
      },

      setInputMode: (mode) => {
        const { inputMode: currentMode } = get()
        if (mode === currentMode) return
        // Simply switch mode - values stay as-is, no conversion
        set({ inputMode: mode })
      },

      resetToDefault: () => {
        set({
          segments: [
            { id: nanoid(), label: 'Marketing', value: 40, color: getPaletteColor('modern', 0) },
            { id: nanoid(), label: 'Engineering', value: 35, color: getPaletteColor('modern', 1) },
            { id: nanoid(), label: 'Design', value: 25, color: getPaletteColor('modern', 2) },
          ],
          title: '',
          palette: 'modern',
          labelMode: 'percentage',
          legendPosition: 'bottom',
          backgroundColor: '#ffffff',
          innerRadiusPercent: 0,
          gapWidthPercent: 20,
          inputMode: 'values',
        })
      },
    }),
    {
      name: 'pie-chart-generator-state',
      storage: createJSONStorage(() => ({
        getItem: (name: string) => localStorage.getItem(name),
        setItem: (name: string, value: string) => debouncedSave(name, value),
        removeItem: (name: string) => localStorage.removeItem(name),
      })),
      partialize: (state) => ({
        segments: state.segments,
        title: state.title,
        palette: state.palette,
        labelMode: state.labelMode,
        legendPosition: state.legendPosition,
        backgroundColor: state.backgroundColor,
        innerRadiusPercent: state.innerRadiusPercent,
        gapWidthPercent: state.gapWidthPercent,
        inputMode: state.inputMode,
      }),
      onRehydrateStorage: () => (state) => {
        // Migrate any null colors to concrete palette values
        if (state && state.segments.some((s) => s.color === null)) {
          state.segments = state.segments.map((s, index) => ({
            ...s,
            color: s.color ?? getPaletteColor(state.palette, index),
          }))
        }
      },
    }
  )
)
