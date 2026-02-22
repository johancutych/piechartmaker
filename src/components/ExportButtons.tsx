import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { useStore } from '../store'
import { exportChart, type ExportFormat } from '../utils/export'

export function ExportButtons() {
  const { segments, title, palette, style, inputMode, legendPosition, backgroundColor, innerRadiusPercent, gapWidthPercent } = useStore()
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setExporting(format)
    try {
      await exportChart(format, {
        segments,
        title,
        paletteId: palette,
        styleId: style,
        inputMode,
        legendPosition,
        backgroundColor,
        innerRadiusPercent,
        gapWidthPercent,
      })
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        className="primary"
        onClick={() => handleExport('png')}
        disabled={exporting !== null}
      >
        <FontAwesomeIcon
          icon={exporting === 'png' ? faSpinner : faDownload}
          spin={exporting === 'png'}
          style={{ fontSize: '12px', marginRight: '6px' }}
        />
        PNG
      </button>
      <button
        className="primary"
        onClick={() => handleExport('jpeg')}
        disabled={exporting !== null}
      >
        <FontAwesomeIcon
          icon={exporting === 'jpeg' ? faSpinner : faDownload}
          spin={exporting === 'jpeg'}
          style={{ fontSize: '12px', marginRight: '6px' }}
        />
        JPEG
      </button>
      <button
        className="primary"
        onClick={() => handleExport('svg')}
        disabled={exporting !== null}
      >
        <FontAwesomeIcon
          icon={exporting === 'svg' ? faSpinner : faDownload}
          spin={exporting === 'svg'}
          style={{ fontSize: '12px', marginRight: '6px' }}
        />
        SVG
      </button>
    </div>
  )
}
