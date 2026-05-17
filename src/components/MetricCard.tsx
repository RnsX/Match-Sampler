interface MetricCardProps {
  label: string
  value: string
  tone?: 'neutral' | 'accent' | 'alert'
}

export function MetricCard({
  label,
  value,
  tone = 'neutral',
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}
