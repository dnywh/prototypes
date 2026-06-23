/*
 * Tiny self-contained UI kit. No packages/ui dependency — these few primitives
 * are all the renderers compose from. Keeping the set small is the thesis:
 * a limited, shared vocabulary produces clean, repeated patterns.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Tone = 'default' | 'brand' | 'amber' | 'red' | 'blue' | 'muted'

const toneClasses: Record<Tone, string> = {
  default: 'bg-elevated text-fg-light border-border',
  brand: 'bg-brand-dim/40 text-brand border-brand-dim',
  amber: 'bg-amber-dim/40 text-amber border-amber-dim',
  red: 'bg-red-dim/40 text-red border-red-dim',
  blue: 'bg-blue/15 text-blue border-blue/30',
  muted: 'bg-panel text-fg-muted border-border',
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}

export function Dot({ tone = 'brand', title }: { tone?: Tone; title?: string }) {
  const color: Record<Tone, string> = {
    default: 'bg-fg-muted',
    brand: 'bg-brand',
    amber: 'bg-amber',
    red: 'bg-red',
    blue: 'bg-blue',
    muted: 'bg-fg-faint',
  }
  return <span title={title} className={`inline-block size-1.5 rounded-full ${color[tone]}`} />
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  intent?: 'default' | 'primary' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({
  intent = 'default',
  size = 'sm',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const intents = {
    default: 'bg-elevated hover:bg-border-strong text-fg border-border',
    primary: 'bg-brand hover:brightness-110 text-brand-fg border-transparent font-medium',
    danger: 'bg-transparent hover:bg-red-dim/40 text-red border-border hover:border-red-dim',
  }
  const sizes = { sm: 'h-7 px-2.5 text-[12px]', md: 'h-8 px-3 text-[13px]' }
  return (
    <button
      className={`ds-focus-ring inline-flex items-center gap-1.5 rounded-md border transition-[background,color,filter] duration-100 disabled:cursor-not-allowed disabled:opacity-40 ${intents[intent]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={`rounded-[var(--radius-panel)] border border-border bg-panel ${padded ? 'p-4' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
      {children}
    </div>
  )
}

/** Minimal SVG sparkline — used by every metric/usage signal. */
export function Sparkline({ data, tone = 'brand' }: { data: number[]; tone?: Tone }) {
  const stroke: Record<Tone, string> = {
    default: 'var(--color-fg-muted)',
    brand: 'var(--color-brand)',
    amber: 'var(--color-amber)',
    red: 'var(--color-red)',
    blue: 'var(--color-blue)',
    muted: 'var(--color-fg-faint)',
  }
  if (data.length === 0) return null
  const w = 120
  const h = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={stroke[tone]}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Styled SQL block. Consumes generated SQL — never hand-written strings. */
export function SqlBlock({ sql }: { sql: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-overlay p-3 font-mono text-[12px] leading-relaxed text-fg-light">
      <code>{sql}</code>
    </pre>
  )
}
