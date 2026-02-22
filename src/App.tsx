import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { SegmentEditor } from './components/SegmentEditor'
import { CanvasPreview } from './components/CanvasPreview'
import { ExportButtons } from './components/ExportButtons'
import { ConfirmDialog } from './components/ConfirmDialog'
import { useStore } from './store'

function App() {
  const { segments, title, palette, style, inputMode, legendPosition, backgroundColor, innerRadiusPercent, gapWidthPercent, resetToDefault } = useStore()
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)

  const handleReset = () => {
    setResetConfirm(true)
  }

  const confirmReset = () => {
    resetToDefault()
    setResetConfirm(false)
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <SegmentEditor />
      </aside>
      <main className="preview">
        {/* Top toolbar */}
        <div className="toolbar">
          <button className="secondary" onClick={handleReset}>
            <FontAwesomeIcon icon={faRotateLeft} style={{ fontSize: '12px', marginRight: '6px' }} />
            Reset
          </button>
          <ExportButtons />
        </div>

        <div className="chart-wrapper">
          <CanvasPreview
            segments={segments}
            paletteId={palette}
            styleId={style}
            title={title}
            inputMode={inputMode}
            legendPosition={legendPosition}
            backgroundColor={backgroundColor}
            innerRadiusPercent={innerRadiusPercent}
            gapWidthPercent={gapWidthPercent}
            hoveredSegmentId={hoveredSegmentId}
            onSegmentHover={setHoveredSegmentId}
          />
        </div>
      </main>

      <ConfirmDialog
        isOpen={resetConfirm}
        title="Reset Chart"
        message="This will reset all segments to the default example. Continue?"
        confirmLabel="Reset"
        onConfirm={confirmReset}
        onCancel={() => setResetConfirm(false)}
      />
    </div>
  )
}

export default App
