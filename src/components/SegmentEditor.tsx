import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useStore } from '../store'
import { getPaletteColor } from '../data/palettes'
import { calculatePlaceholders } from '../utils/calculations'
import { SegmentRow } from './SegmentRow'
import { ChartTitle } from './ChartTitle'
import { PaletteSelector } from './PaletteSelector'
import { StyleSelector } from './StyleSelector'
import { DonutSlider } from './DonutSlider'
import { GapWidthSlider } from './GapWidthSlider'
import { ConfirmDialog } from './ConfirmDialog'
import { InputModeToggle } from './InputModeToggle'
import { TotalDisplay } from './TotalDisplay'

export function SegmentEditor() {
  const {
    segments,
    title,
    palette,
    style,
    legendPosition,
    backgroundColor,
    innerRadiusPercent,
    gapWidthPercent,
    inputMode,
    addSegment,
    removeSegment,
    updateSegment,
    reorderSegments,
    setTitle,
    setPalette,
    setStyle,
    setLegendPosition,
    setBackgroundColor,
    setInnerRadiusPercent,
    setGapWidthPercent,
    setInputMode,
  } = useStore()

  // Calculate placeholder values for segments in percentages mode
  const placeholders = calculatePlaceholders(segments, inputMode)
  const getPlaceholderValue = (segmentId: string) =>
    placeholders.find(p => p.segmentId === segmentId)?.placeholderValue

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [paletteConfirm, setPaletteConfirm] = useState<string | null>(null)

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      reorderSegments(dragIndex, index)
      setDragIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  const handlePaletteSelect = (paletteId: string) => {
    if (paletteId !== palette) {
      // Check if user has manually customized any colors
      const hasCustomColors = segments.some((segment, index) => {
        const paletteColor = getPaletteColor(palette, index)
        return segment.color !== null && segment.color !== paletteColor
      })

      if (hasCustomColors) {
        setPaletteConfirm(paletteId)
      } else {
        // No custom colors, apply palette directly without confirmation
        setPalette(paletteId)
      }
    }
  }

  const confirmPaletteChange = () => {
    if (paletteConfirm) {
      setPalette(paletteConfirm)
      setPaletteConfirm(null)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      removeSegment(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="segment-editor">
      <ChartTitle title={title} onChange={setTitle} />

      {/* Segments list */}
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '8px',
          }}
        >
          Segments
        </label>

        {/* Input Mode Toggle - above segment rows */}
        <div style={{ marginBottom: '12px' }}>
          <InputModeToggle mode={inputMode} onChange={setInputMode} />
        </div>

        {segments.map((segment, index) => (
          <SegmentRow
            key={segment.id}
            segment={segment}
            displayColor={segment.color ?? getPaletteColor(palette, index)}
            index={index}
            canDelete={segments.length > 1}
            inputMode={inputMode}
            placeholderValue={getPlaceholderValue(segment.id)}
            onUpdate={(updates) => updateSegment(segment.id, updates)}
            onDelete={() => handleDelete(segment.id)}
            onDragStart={() => handleDragStart(index)}
            onDragOver={() => handleDragOver(index)}
            onDragEnd={handleDragEnd}
          />
        ))}

        {/* Total Display - after segment rows */}
        <TotalDisplay segments={segments} inputMode={inputMode} />
      </div>

      {/* Add segment button */}
      <button
        className="primary"
        onClick={addSegment}
        style={{
          width: '100%',
          marginBottom: '24px',
        }}
      >
        <FontAwesomeIcon icon={faPlus} style={{ fontSize: '12px', marginRight: '6px' }} />
        Add Segment
      </button>

      {/* Palette selector */}
      <PaletteSelector
        selectedPaletteId={palette}
        onSelect={handlePaletteSelect}
      />

      {/* Style selector and Background color */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <StyleSelector
          selectedStyleId={style}
          onSelect={setStyle}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}
          >
            Background
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setBackgroundColor('transparent')}
              title="Transparent"
              style={{
                width: '40px',
                height: '40px',
                padding: 0,
                border: backgroundColor === 'transparent' ? '3px solid var(--primary)' : '2px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 12px 12px',
              }}
            />
            <label
              title="Color"
              style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                padding: 0,
                border: backgroundColor !== 'transparent' ? '3px solid var(--primary)' : '2px solid var(--border)',
                borderRadius: '8px',
                backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : '#ffffff',
                cursor: 'pointer',
                display: 'block',
              }}
            >
              <input
                type="color"
                value={backgroundColor !== 'transparent' ? backgroundColor : '#ffffff'}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Donut hole size and Gap width sliders */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <DonutSlider
          value={innerRadiusPercent}
          onChange={setInnerRadiusPercent}
        />
        <GapWidthSlider
          value={gapWidthPercent}
          onChange={setGapWidthPercent}
        />
      </div>

      {/* Legend position toggle */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '8px',
          }}
        >
          Legend Position
        </label>
        <div className="toggle-group">
          <button
            className={legendPosition === 'left' ? 'active' : ''}
            onClick={() => setLegendPosition('left')}
            style={{ flex: 1 }}
          >
            Left
          </button>
          <button
            className={legendPosition === 'bottom' ? 'active' : ''}
            onClick={() => setLegendPosition('bottom')}
            style={{ flex: 1 }}
          >
            Below
          </button>
          <button
            className={legendPosition === 'right' ? 'active' : ''}
            onClick={() => setLegendPosition('right')}
            style={{ flex: 1 }}
          >
            Right
          </button>
        </div>
      </div>

      {/* Confirmation dialogs */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Segment"
        message="Are you sure you want to delete this segment?"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ConfirmDialog
        isOpen={paletteConfirm !== null}
        title="Change Palette"
        message="Switching palettes will reset your custom colors. Continue?"
        confirmLabel="Switch"
        onConfirm={confirmPaletteChange}
        onCancel={() => setPaletteConfirm(null)}
      />
    </div>
  )
}
