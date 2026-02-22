import { useMemo, useRef, useEffect, useState } from 'react'
import type { Segment, InputMode, LegendPosition } from '../types'
import { calculateCanvasDimensions, LAYOUT } from '../utils/canvasLayout'
import { getStyle } from '../data/styles'
import { getContrastTextColor } from '../utils/color'
import { PieChart } from './PieChart'
import { LegendCanvas } from './LegendCanvas'

interface CanvasPreviewProps {
  segments: Segment[]
  paletteId: string
  styleId: string
  title: string
  inputMode: InputMode
  legendPosition: LegendPosition
  backgroundColor: string
  innerRadiusPercent: number
  gapWidthPercent: number
  hoveredSegmentId: string | null
  onSegmentHover: (id: string | null) => void
}

export function CanvasPreview({
  segments,
  paletteId,
  styleId,
  title,
  inputMode,
  legendPosition,
  backgroundColor,
  innerRadiusPercent,
  gapWidthPercent,
  hoveredSegmentId,
  onSegmentHover,
}: CanvasPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const style = getStyle(styleId)
  const textColor = backgroundColor === 'transparent' ? LAYOUT.TITLE_COLOR : getContrastTextColor(backgroundColor)

  // Calculate exact canvas dimensions matching export
  const dimensions = useMemo(
    () => calculateCanvasDimensions(legendPosition, segments.length, !!title),
    [legendPosition, segments.length, title]
  )

  // Responsive scaling - scale down to fit viewport, never scale up
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return

      const container = containerRef.current
      const availableWidth = container.clientWidth
      const availableHeight = container.clientHeight

      const scaleX = availableWidth / dimensions.width
      const scaleY = availableHeight / dimensions.height

      // Use smaller scale, cap at 1 (never scale up)
      setScale(Math.min(1, scaleX, scaleY))
    }

    updateScale()

    const observer = new ResizeObserver(updateScale)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [dimensions])

  return (
    <div
      ref={containerRef}
      className="canvas-preview-container"
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
      }}
    >
      <div
        className="canvas-preview-scaler"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Fixed-size canvas that matches export exactly */}
        <div
          className="canvas-preview-canvas"
          style={{
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor,
            position: 'relative',
            borderRadius: 8,
            border: '2px solid #e8e8e8',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Title */}
          {title && (
            <div
              style={{
                position: 'absolute',
                left: LAYOUT.CANVAS_PADDING,
                right: LAYOUT.CANVAS_PADDING,
                top: 32,
                minHeight: LAYOUT.TITLE_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: LAYOUT.TITLE_FONT_SIZE,
                fontWeight: style.title.fontWeight,
                color: textColor,
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                textShadow: style.title.shadow ?? 'none',
                textAlign: 'center',
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              {title}
            </div>
          )}

          {/* Chart */}
          <div
            style={{
              position: 'absolute',
              left: dimensions.chartX,
              top: dimensions.chartY,
              width: LAYOUT.CHART_SIZE,
              height: LAYOUT.CHART_SIZE,
            }}
          >
            <PieChart
              segments={segments}
              paletteId={paletteId}
              styleId={styleId}
              inputMode={inputMode}
              backgroundColor={backgroundColor}
              innerRadiusPercent={innerRadiusPercent}
              gapWidthPercent={gapWidthPercent}
              hoveredSegmentId={hoveredSegmentId}
              onSegmentHover={onSegmentHover}
            />
          </div>

          {/* Legend */}
          <div
            style={{
              position: 'absolute',
              left: dimensions.legendX,
              top: legendPosition === 'bottom' ? dimensions.legendY : dimensions.chartY,
              width: legendPosition === 'bottom' ? dimensions.width : LAYOUT.LEGEND_RIGHT_WIDTH,
              height: legendPosition === 'bottom' ? undefined : LAYOUT.CHART_SIZE,
              display: legendPosition === 'bottom' ? undefined : 'flex',
              alignItems: legendPosition === 'bottom' ? undefined : 'center',
            }}
          >
            <LegendCanvas
              segments={segments}
              paletteId={paletteId}
              styleId={styleId}
              legendPosition={legendPosition}
              canvasWidth={dimensions.width}
              backgroundColor={backgroundColor}
              hoveredSegmentId={hoveredSegmentId}
              onSegmentHover={onSegmentHover}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
