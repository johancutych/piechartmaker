import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faExclamationTriangle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import type { Segment, InputMode } from '../types'

interface TotalDisplayProps {
  segments: Segment[]
  inputMode: InputMode
}

export function TotalDisplay({ segments, inputMode }: TotalDisplayProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const roundedTotal = Math.round(total * 10) / 10

  if (inputMode === 'values') {
    return (
      <div className="total-display total-display--neutral">
        Total: {roundedTotal}
      </div>
    )
  }

  // Percentages mode
  const diff = Math.round((100 - total) * 10) / 10

  if (diff === 0) {
    return (
      <div className="total-display total-display--success">
        <FontAwesomeIcon icon={faCheck} style={{ fontSize: '12px' }} />
        Total: 100%
      </div>
    )
  }

  if (diff > 0) {
    return (
      <div className="total-display total-display--warning">
        <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '12px' }} />
        Total: {roundedTotal}% (need {diff}% more)
      </div>
    )
  }

  // diff < 0, over 100%
  return (
    <div className="total-display total-display--error">
      <FontAwesomeIcon icon={faTimesCircle} style={{ fontSize: '12px' }} />
      Total: {roundedTotal}% ({Math.abs(diff)}% over)
    </div>
  )
}
