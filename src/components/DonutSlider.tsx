interface DonutSliderProps {
  value: number
  onChange: (value: number) => void
}

export function DonutSlider({ value, onChange }: DonutSliderProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: '8px',
        }}
      >
        Donut Hole Size
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="range"
          min="0"
          max="80"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: 'var(--primary)',
          }}
        />
        <span
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            minWidth: '40px',
            textAlign: 'right',
          }}
        >
          {value}%
        </span>
      </div>
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
