import { useId } from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
  color?: string
}

export function Sparkline({
  data,
  width = 64,
  height = 24,
  className = '',
  color = 'var(--color-brand)',
}: SparklineProps) {
  const gradientId = useId()

  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const coords = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }))

  const linePoints = coords.map((p) => `${p.x},${p.y}`).join(' ')
  const areaPath = `M ${coords[0].x} ${height} ${coords.map((p) => `L ${p.x} ${p.y}`).join(' ')} L ${coords[coords.length - 1].x} ${height} Z`

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePoints}
        opacity={0.85}
      />
    </svg>
  )
}
