import type { QuerySentiment } from '../lib/sentiment'
import { sentimentPillActive } from '../lib/sentiment'

interface FootnotePillProps {
  n: number
  active?: boolean
  sentiment?: QuerySentiment
  align?: 'hero' | 'inline' | 'slot'
  onClick: () => void
}

const alignClass = {
  hero: 'ml-1 mr-0.5 translate-y-[-16px]',
  inline: 'ml-1 mr-0.5 translate-y-[2px]',
  slot: '',
} as const

export function FootnotePill({
  n,
  active,
  sentiment = 'positive',
  align = 'inline',
  onClick,
}: FootnotePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Evidence ${n}`}
      className={`wv-focus-ring inline-flex h-[16px] min-w-[16px] ${alignClass[align]} items-center justify-center rounded px-1 text-[10px] font-medium tabular-nums transition-colors ${
        active
          ? sentimentPillActive[sentiment]
          : 'border border-border bg-elevated text-fg-muted hover:border-border-strong hover:text-fg-light'
      }`}
    >
      {n}
    </button>
  )
}
