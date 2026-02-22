import { useMemo, useRef, useEffect, useState } from 'react'
import type { Segment, InputMode, LegendPosition } from '../types'
import { calculateCanvasDimensions, LAYOUT } from '../utils/canvasLayout'
import { PieChart } from './PieChart'
import { LegendCanvas } from './LegendCanvas'

interface CanvasPreviewProps {
  segments: Segment[]
  paletteId: string
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
                left: 0,
                right: 0,
                top: 32,
                height: LAYOUT.TITLE_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: LAYOUT.TITLE_FONT_SIZE,
                fontWeight: LAYOUT.TITLE_FONT_WEIGHT,
                color: LAYOUT.TITLE_COLOR,
                whiteSpace: 'nowrap',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
              top: dimensions.legendY,
              width: legendPosition === 'bottom' ? dimensions.width : LAYOUT.LEGEND_RIGHT_WIDTH,
            }}
          >
            <LegendCanvas
              segments={segments}
              paletteId={paletteId}
              legendPosition={legendPosition}
              canvasWidth={dimensions.width}
              hoveredSegmentId={hoveredSegmentId}
              onSegmentHover={onSegmentHover}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
