import { useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGripVertical, faTrash } from '@fortawesome/free-solid-svg-icons'
import type { Segment, InputMode } from '../types'

interface SegmentRowProps {
  segment: Segment
  displayColor: string
  index: number
  canDelete: boolean
  inputMode: InputMode
  placeholderValue?: number
  onUpdate: (updates: Partial<Omit<Segment, 'id'>>) => void
  onDelete: () => void
  onDragStart: () => void
  onDragOver: () => void
  onDragEnd: () => void
}

export function SegmentRow({
  segment,
  displayColor,
  canDelete,
  inputMode,
  placeholderValue,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
}: SegmentRowProps) {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const isPlaceholder = segment.isPlaceholder && inputMode === 'percentages'

  // Determine displayed value - use placeholder if segment is a placeholder
  const displayValue = isPlaceholder && placeholderValue !== undefined
    ? placeholderValue
    : segment.value

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty string for typing, but parse as number
    if (value === '') {
      onUpdate({ value: 0 })
    } else {
      const num = parseFloat(value)
      if (!isNaN(num) && num >= 0) {
        onUpdate({ value: num })
      }
    }
  }

  return (
    <div
      className="segment-row"
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver()
      }}
      onDragEnd={onDragEnd}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 0',
        marginBottom: '0px',
        cursor: 'grab',
      }}
    >
      {/* Drag handle */}
      <span
        style={{
          color: 'var(--text-secondary)',
          fontSize: '14px',
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <FontAwesomeIcon icon={faGripVertical} style={{ fontSize: '12px' }} />
      </span>

      {/* Color swatch */}
      <button
        onClick={() => colorInputRef.current?.click()}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          backgroundColor: displayColor,
          border: '2px solid var(--border)',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
        title="Click to change color"
      />
      <input
        ref={colorInputRef}
        type="color"
        value={displayColor}
        onChange={(e) => onUpdate({ color: e.target.value })}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Label input */}
      <input
        type="text"
        value={segment.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        placeholder="Label"
        style={{
          flex: 1,
          minWidth: 0,
        }}
      />

      {/* Value input */}
      <div style={{ position: 'relative', width: '70px' }}>
        <input
          type="number"
          value={displayValue || ''}
          onChange={handleValueChange}
          onFocus={(e) => {
            // When focusing on a placeholder, select all so typing replaces
            if (isPlaceholder) {
              onUpdate({ value: placeholderValue ?? 0 })
              // Select all text after a short delay to allow React to update
              setTimeout(() => e.target.select(), 0)
            }
          }}
          min={0}
          placeholder="0"
          className={isPlaceholder ? 'placeholder-value' : ''}
          style={{
            width: '100%',
            paddingRight: inputMode === 'percentages' ? '20px' : undefined,
          }}
        />
        {inputMode === 'percentages' && (
          <span
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              pointerEvents: 'none',
            }}
          >
            %
          </span>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={onDelete}
        disabled={!canDelete}
        style={{
          width: '28px',
          height: '28px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          color: canDelete ? '#ef4444' : '#d1d5db',
          cursor: canDelete ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          borderRadius: '4px',
        }}
        title={canDelete ? 'Delete segment' : 'Cannot delete last segment'}
      >
        <FontAwesomeIcon icon={faTrash} style={{ fontSize: '12px' }} />
      </button>
    </div>
  )
}
