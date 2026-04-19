interface DonutSliderProps {
  value: number
  onChange: (value: number) => void
}

export function DonutSlider({ value, onChange }: DonutSliderProps) {
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <label
          htmlFor="hole-size-slider"
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          Hole Size
        </label>
        <span
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          {value}%
        </span>
      </div>
      <input
        id="hole-size-slider"
        type="range"
        min="0"
        max="80"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: 'var(--primary)',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          marginTop: '4px',
        }}
      >
        <span>Pie</span>
        <span>Donut</span>
      </div>
    </div>
  )
}
