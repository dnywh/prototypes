import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Tone = 'default' | 'brand' | 'amber' | 'red' | 'blue' | 'muted'

const toneClasses: Record<Tone, string> = {
  default: 'bg-elevated text-fg-light border-border',
  brand: 'bg-brand-dim/50 text-brand border-brand-dim',
  amber: 'bg-amber-dim/50 text-amber border-amber-dim',
  red: 'bg-red-dim/50 text-red border-red-dim',
  blue: 'bg-blue/15 text-blue border-blue/30',
  muted: 'bg-panel text-fg-muted border-border',
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 pt-[3px] pb-[4px] text-[11px] font-medium leading-none ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  intent?: 'default' | 'primary' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ intent = 'default', size = 'sm', className = '', ...props }: ButtonProps) {
  const base =
    'wv-focus-ring inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors'
  const sizes = { sm: 'px-3 py-1.5 text-[13px]', md: 'px-4 py-2 text-[14px]' }
  const intents = {
    default: 'border border-border bg-elevated text-fg-light hover:bg-panel hover:text-fg',
    primary: 'border border-brand-dim bg-brand-dim/60 text-brand hover:bg-brand-dim',
    ghost: 'border border-transparent text-fg-muted hover:text-fg hover:bg-elevated',
  }
  return <button className={`${base} ${sizes[size]} ${intents[intent]} ${className}`} {...props} />
}

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`rounded-[var(--radius-card)] border border-border bg-panel ${onClick ? 'wv-focus-ring cursor-pointer text-left transition-colors hover:border-border-strong hover:bg-elevated' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}

export function SectionLabel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`text-[11px] font-medium uppercase tracking-wider text-fg-faint ${className}`}>
      {children}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
      {children}
    </kbd>
  )
}
