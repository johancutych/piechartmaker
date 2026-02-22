import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Segment, LabelMode } from './types'

interface StoreState {
  segments: Segment[]
  title: string
  palette: string
  labelMode: LabelMode
  backgroundColor: string
  innerRadiusPercent: number

  // Actions
  addSegment: () => void
  removeSegment: (id: string) => void
  updateSegment: (id: string, updates: Partial<Omit<Segment, 'id'>>) => void
  reorderSegments: (fromIndex: number, toIndex: number) => void
  setTitle: (title: string) => void
  setPalette: (paletteId: string) => void
  setLabelMode: (mode: LabelMode) => void
  setBackgroundColor: (color: string) => void
  setInnerRadiusPercent: (percent: number) => void
  resetToDefault: () => void
}

const DEFAULT_SEGMENTS: Segment[] = [
  { id: nanoid(), label: 'Marketing', value: 40, color: null },
  { id: nanoid(), label: 'Engineering', value: 35, color: null },
  { id: nanoid(), label: 'Design', value: 25, color: null },
]

const DEFAULT_STATE = {
  segments: DEFAULT_SEGMENTS,
  title: '',
  palette: 'modern',
  labelMode: 'percentage' as LabelMode,
  backgroundColor: '#ffffff',
  innerRadiusPercent: 0,
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
        const { segments } = get()
        const total = segments.reduce((sum, s) => sum + s.value, 0)
        const remainder = Math.max(0, 100 - total)
        const newSegment: Segment = {
          id: nanoid(),
          label: `Segment ${segments.length + 1}`,
          value: remainder,
          color: null,
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
            s.id === id ? { ...s, ...updates } : s
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
        // Reset all custom colors when switching palette
        set({
          palette: paletteId,
          segments: segments.map((s) => ({ ...s, color: null })),
        })
      },

      setLabelMode: (mode) => {
        set({ labelMode: mode })
      },

      setBackgroundColor: (color) => {
        set({ backgroundColor: color })
      },

      setInnerRadiusPercent: (percent) => {
        set({ innerRadiusPercent: Math.max(0, Math.min(80, percent)) })
      },

      resetToDefault: () => {
        set({
          segments: [
            { id: nanoid(), label: 'Marketing', value: 40, color: null },
            { id: nanoid(), label: 'Engineering', value: 35, color: null },
            { id: nanoid(), label: 'Design', value: 25, color: null },
          ],
          title: '',
          palette: 'modern',
          labelMode: 'percentage',
          backgroundColor: '#ffffff',
          innerRadiusPercent: 0,
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
        backgroundColor: state.backgroundColor,
        innerRadiusPercent: state.innerRadiusPercent,
      }),
    }
  )
)
