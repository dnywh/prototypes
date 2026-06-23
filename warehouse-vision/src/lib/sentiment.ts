import type { LiveQuery } from '../model/types'

export type QuerySentiment = LiveQuery['sentiment']

export const sentimentColor: Record<QuerySentiment, string> = {
  positive: 'var(--color-brand)',
  warning: 'var(--color-amber)',
  danger: 'var(--color-red)',
}

export const sentimentPillActive: Record<QuerySentiment, string> = {
  positive: 'border border-brand/50 bg-brand-dim/40 text-brand',
  warning: 'border border-amber/50 bg-amber-dim/40 text-amber',
  danger: 'border border-red/50 bg-red-dim/40 text-red',
}

export const sentimentQuoteLine: Record<QuerySentiment, string> = {
  positive: 'bg-brand/40',
  warning: 'bg-amber/40',
  danger: 'bg-red/40',
}
