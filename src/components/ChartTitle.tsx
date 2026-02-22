interface ChartTitleProps {
  title: string
  onChange: (title: string) => void
}

export function ChartTitle({ title, onChange }: ChartTitleProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        htmlFor="chart-title"
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: '6px',
        }}
      >
        Chart Title
      </label>
      <input
        id="chart-title"
        type="text"
        value={title}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter chart title..."
        style={{
          width: '100%',
        }}
      />
    </div>
  )
}
