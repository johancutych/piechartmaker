import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useStore } from '../store'
import { getPaletteColor } from '../data/palettes'
import { SegmentRow } from './SegmentRow'
import { ChartTitle } from './ChartTitle'
import { PaletteSelector } from './PaletteSelector'
import { DonutSlider } from './DonutSlider'
import { ConfirmDialog } from './ConfirmDialog'

export function SegmentEditor() {
  const {
    segments,
    title,
    palette,
    labelMode,
    backgroundColor,
    innerRadiusPercent,
    addSegment,
    removeSegment,
    updateSegment,
    reorderSegments,
    setTitle,
    setPalette,
    setLabelMode,
    setBackgroundColor,
    setInnerRadiusPercent,
  } = useStore()

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [paletteConfirm, setPaletteConfirm] = useState<string | null>(null)

  const hasCustomColors = segments.some((s) => s.color !== null)

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
    if (hasCustomColors) {
      setPaletteConfirm(paletteId)
    } else {
      setPalette(paletteId)
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
        {segments.map((segment, index) => (
          <SegmentRow
            key={segment.id}
            segment={segment}
            displayColor={segment.color ?? getPaletteColor(palette, index)}
            index={index}
            canDelete={segments.length > 1}
            onUpdate={(updates) => updateSegment(segment.id, updates)}
            onDelete={() => handleDelete(segment.id)}
            onDragStart={() => handleDragStart(index)}
            onDragOver={() => handleDragOver(index)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Add segment button */}
      <button
        className="secondary"
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
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
      />

      {/* Donut hole size slider */}
      <DonutSlider
        value={innerRadiusPercent}
        onChange={setInnerRadiusPercent}
      />

      {/* Label mode toggle */}
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
          Label Display
        </label>
        <div
          style={{
            display: 'flex',
            gap: '8px',
          }}
        >
          <button
            className={labelMode === 'percentage' ? 'primary' : 'secondary'}
            onClick={() => setLabelMode('percentage')}
            style={{ flex: 1 }}
          >
            Percentage
          </button>
          <button
            className={labelMode === 'value' ? 'primary' : 'secondary'}
            onClick={() => setLabelMode('value')}
            style={{ flex: 1 }}
          >
            Value
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
