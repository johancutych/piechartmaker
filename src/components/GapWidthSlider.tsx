interface GapWidthSliderProps {
  value: number
  onChange: (value: number) => void
}

export function GapWidthSlider({ value, onChange }: GapWidthSliderProps) {
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
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          Gap Width
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
        type="range"
        min="0"
        max="100"
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
        <span>None</span>
        <span>Wide</span>
      </div>
    </div>
  )
}
