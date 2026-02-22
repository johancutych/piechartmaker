import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { SegmentEditor } from './components/SegmentEditor'
import { PieChart } from './components/PieChart'
import { Legend } from './components/Legend'
import { ExportButtons } from './components/ExportButtons'
import { ConfirmDialog } from './components/ConfirmDialog'
import { useStore } from './store'

function App() {
  const { segments, title, palette, labelMode, backgroundColor, innerRadiusPercent, resetToDefault } = useStore()
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

        <div className="chart-wrapper" style={{ backgroundColor }}>
          <div className="chart-container">
            {title && <h1 className="chart-title">{title}</h1>}
            <PieChart
              segments={segments}
              paletteId={palette}
              labelMode={labelMode}
              backgroundColor={backgroundColor}
              innerRadiusPercent={innerRadiusPercent}
              hoveredSegmentId={hoveredSegmentId}
              onSegmentHover={setHoveredSegmentId}
            />
            <Legend
              segments={segments}
              paletteId={palette}
              hoveredSegmentId={hoveredSegmentId}
              onSegmentHover={setHoveredSegmentId}
            />
          </div>
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
