import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons'
import { useStore } from '../store'
import { encodeChartState } from '../utils/chartUrl'

interface EmbedModalProps {
  isOpen: boolean
  onClose: () => void
}

const SITE_URL = 'https://www.chartty.io'
const APP_URL = 'https://app.chartty.io'

export function EmbedModal({ isOpen, onClose }: EmbedModalProps) {
  const { segments, title, palette, style, labelMode, legendPosition, backgroundColor, innerRadiusPercent, gapWidthPercent } = useStore()
  const [width, setWidth] = useState(600)
  const [height, setHeight] = useState(400)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  if (!isOpen) return null

  const encoded = encodeChartState({
    segments,
    title,
    palette,
    style,
    labelMode,
    legendPosition,
    backgroundColor,
    innerRadiusPercent,
    gapWidthPercent,
  })

  const embedUrl = `${APP_URL}/embed?d=${encoded}`
  const shareUrl = `${APP_URL}/view?d=${encoded}`

  const embedCode = `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" style="border:none;border-radius:8px;"></iframe>\n<p style="font-size:12px;color:#666;margin-top:4px;"><a href="${SITE_URL}" target="_blank" rel="noopener">Made with Chartty</a></p>`

  const copyToClipboard = async (text: string, type: 'embed' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'embed') {
        setCopiedEmbed(true)
        setTimeout(() => setCopiedEmbed(false), 2000)
      } else {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      }
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '520px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Embed Chart
        </h3>

        {/* Size inputs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Width
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Math.max(200, Number(e.target.value)))}
              style={{ width: '70px', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Height
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Math.max(200, Number(e.target.value)))}
              style={{ width: '70px', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
            />
          </label>
        </div>

        {/* Embed code */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Embed Code</span>
            <button
              className="secondary"
              onClick={() => copyToClipboard(embedCode, 'embed')}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              <FontAwesomeIcon icon={copiedEmbed ? faCheck : faCopy} style={{ fontSize: '11px', marginRight: '4px' }} />
              {copiedEmbed ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            readOnly
            value={embedCode}
            style={{
              width: '100%',
              height: '80px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#555',
              backgroundColor: '#f8f8f8',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Share link */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Share Link</span>
            <button
              className="secondary"
              onClick={() => copyToClipboard(shareUrl, 'link')}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              <FontAwesomeIcon icon={copiedLink ? faCheck : faCopy} style={{ fontSize: '11px', marginRight: '4px' }} />
              {copiedLink ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <input
            readOnly
            value={shareUrl}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#555',
              backgroundColor: '#f8f8f8',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
