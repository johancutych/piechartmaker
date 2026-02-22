import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHashtag, faPercent } from '@fortawesome/free-solid-svg-icons'
import type { InputMode } from '../types'

interface InputModeToggleProps {
  mode: InputMode
  onChange: (mode: InputMode) => void
}

export function InputModeToggle({ mode, onChange }: InputModeToggleProps) {
  return (
    <div className="input-mode-toggle">
      <button
        className={mode === 'values' ? 'active' : ''}
        onClick={() => onChange('values')}
        title="Enter raw values - chart calculates proportions automatically"
      >
        <FontAwesomeIcon icon={faHashtag} style={{ fontSize: '11px', marginRight: '5px' }} />
        Values
      </button>
      <button
        className={mode === 'percentages' ? 'active' : ''}
        onClick={() => onChange('percentages')}
        title="Enter exact percentages - should add up to 100%"
      >
        <FontAwesomeIcon icon={faPercent} style={{ fontSize: '11px', marginRight: '5px' }} />
        Percentages
      </button>
    </div>
  )
}
