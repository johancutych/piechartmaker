import type { ChartStyle } from '../types'

export const chartStyles: ChartStyle[] = [
  {
    id: 'modern',
    name: 'Modern',
    segment: {
      cornerRadius: 8,
      fill: 'solid',
      stroke: null,
      shadow: null,
      filter: null,
    },
    legend: {
      indicatorShape: 'circle',
      indicatorSize: 16,
    },
    title: {
      fontWeight: 700,
      shadow: null,
    },
    gapMultiplier: 1,
  },
  {
    id: 'soft',
    name: 'Soft',
    segment: {
      cornerRadius: 12,
      fill: 'gradient',
      stroke: null,
      shadow: null,
      filter: null,
    },
    legend: {
      indicatorShape: 'circle',
      indicatorSize: 20,
    },
    title: {
      fontWeight: 600,
      shadow: null,
    },
    gapMultiplier: 1,
  },
  {
    id: 'classic',
    name: 'Classic',
    segment: {
      cornerRadius: 0,
      fill: 'solid',
      stroke: null,
      shadow: null,
      filter: null,
    },
    legend: {
      indicatorShape: 'rectangle',
      indicatorSize: 16,
    },
    title: {
      fontWeight: 700,
      shadow: null,
    },
    gapMultiplier: 1,
  },
  {
    id: 'stylish',
    name: 'Stylish',
    segment: {
      cornerRadius: 8,
      fill: 'solid',
      stroke: null,
      shadow: {
        offsetX: 4,
        offsetY: 6,
        blur: 0,
        color: 'segment',
        darkening: 0.4,
      },
      filter: null,
    },
    legend: {
      indicatorShape: 'circle',
      indicatorSize: 16,
    },
    title: {
      fontWeight: 800,
      shadow: '2px 3px 0 rgba(0,0,0,0.15)',
    },
    gapMultiplier: 1,
  },
  {
    id: 'bold',
    name: 'Bold',
    segment: {
      cornerRadius: 8,
      fill: 'solid',
      stroke: {
        width: 3,
        color: 'segment',
        darkening: 0.2,
      },
      shadow: null,
      filter: null,
    },
    legend: {
      indicatorShape: 'circle',
      indicatorSize: 18,
      stroke: true,
    },
    title: {
      fontWeight: 800,
      shadow: null,
    },
    gapMultiplier: 1,
  },
  {
    id: 'outline',
    name: 'Outline',
    segment: {
      cornerRadius: 8,
      fill: 'transparent',
      stroke: {
        width: 4,
        color: 'segment',
        darkening: 0,
      },
      shadow: null,
      filter: null,
    },
    legend: {
      indicatorShape: 'ring',
      indicatorSize: 16,
    },
    title: {
      fontWeight: 600,
      shadow: null,
    },
    gapMultiplier: 1.5,
  },
  {
    id: 'neon',
    name: 'Neon',
    segment: {
      cornerRadius: 6,
      fill: 'solid',
      stroke: null,
      shadow: null,
      filter: 'neon-glow',
    },
    legend: {
      indicatorShape: 'circle',
      indicatorSize: 16,
      glow: true,
    },
    title: {
      fontWeight: 700,
      shadow: null,
    },
    gapMultiplier: 1,
  },
]

export function getStyle(id: string): ChartStyle {
  return chartStyles.find((s) => s.id === id) ?? chartStyles[0]!
}
