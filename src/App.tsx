import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { SegmentEditor } from './components/SegmentEditor'
import { CanvasPreview } from './components/CanvasPreview'
import { ExportButtons } from './components/ExportButtons'
import { ConfirmDialog } from './components/ConfirmDialog'
import { EmbedModal } from './components/EmbedModal'
import { useStore } from './store'
import { decodeChartState } from './utils/chartUrl'

function App() {
  const store = useStore()
  const { segments, title, palette, style, inputMode, legendPosition, backgroundColor, innerRadiusPercent, gapWidthPercent, resetToDefault } = store
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [embedModalOpen, setEmbedModalOpen] = useState(false)

  // Hydrate store from ?d= query param (for "Edit this chart" flow)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const data = params.get('d')
    if (data) {
      const config = decodeChartState(data)
      if (config) {
        useStore.setState({
          segments: config.segments,
          title: config.title,
          palette: config.palette,
          style: config.style,
          labelMode: config.labelMode,
          legendPosition: config.legendPosition,
          backgroundColor: config.backgroundColor,
          innerRadiusPercent: config.innerRadiusPercent,
          gapWidthPercent: config.gapWidthPercent,
        })
      }
      window.history.replaceState({}, '', '/')
    }
  }, [])

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
          <ExportButtons onEmbedClick={() => setEmbedModalOpen(true)} />
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

      <EmbedModal
        isOpen={embedModalOpen}
        onClose={() => setEmbedModalOpen(false)}
      />
    </div>
  )
}

export default App
