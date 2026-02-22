import type { Palette } from '../types'

export const palettes: Palette[] = [
  {
    id: 'modern',
    name: 'Modern',
    colors: [
      '#EF4444',
      '#F59E0B',
      '#10B981',
      '#3B82F6',
      '#8B5CF6',
      '#EC4899',
      '#06B6D4',
      '#F97316',
    ],
  },
  {
    id: 'soft',
    name: 'Soft',
    colors: [
      '#F87171',
      '#FBBF24',
      '#34D399',
      '#60A5FA',
      '#A78BFA',
      '#F472B6',
      '#22D3EE',
      '#FB923C',
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate',
    colors: [
      '#1E40AF',
      '#166534',
      '#92400E',
      '#991B1B',
      '#5B21B6',
      '#9F1239',
      '#155E75',
      '#9A3412',
    ],
  },
  {
    id: 'warm',
    name: 'Warm',
    colors: [
      '#DC2626',
      '#EA580C',
      '#D97706',
      '#CA8A04',
      '#E11D48',
      '#C026D3',
      '#DB2777',
      '#9333EA',
    ],
  },
  {
    id: 'cool',
    name: 'Cool',
    colors: [
      '#2563EB',
      '#0891B2',
      '#059669',
      '#7C3AED',
      '#0D9488',
      '#4F46E5',
      '#0284C7',
      '#6D28D9',
    ],
  },
]

export function getPalette(id: string): Palette {
  return palettes.find((p) => p.id === id) ?? palettes[0]!
}

export function getPaletteColor(paletteId: string, index: number): string {
  const palette = getPalette(paletteId)
  return palette.colors[index % palette.colors.length]!
}
