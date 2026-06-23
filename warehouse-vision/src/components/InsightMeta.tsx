import type { Confidence } from '../model/types'
import { useVision } from '../state/store'

interface InsightMetaProps {
  confidence: Confidence
  queryIds: string[]
  className?: string
}

const confidenceLabel: Record<Confidence, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function InsightMeta({ confidence, queryIds, className = '' }: InsightMetaProps) {
  const { openDataFabric } = useVision()
  const queryCount = queryIds.length
  const queryLabel = `Based on: ${queryCount} live ${queryCount === 1 ? 'query' : 'queries'}`

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-fg-faint ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {confidence === 'medium' && <span className="size-1.5 rounded-full bg-amber" aria-hidden />}
        {confidence === 'low' && <span className="size-1.5 rounded-full bg-fg-faint" aria-hidden />}
        Confidence: {confidenceLabel[confidence]}
        {confidence === 'low' && <span className="text-fg-muted">· verify manually</span>}
      </span>
      <span aria-hidden>·</span>
      <button
        type="button"
        onClick={() => openDataFabric(queryIds)}
        className="wv-focus-ring inline-flex items-center gap-1 text-fg-faint underline decoration-fg-faint/30 underline-offset-2 hover:text-fg-muted hover:decoration-fg-muted"
      >
        <span className="size-1.5 rounded-full bg-brand wv-pulse" aria-hidden />
        {queryLabel}
      </button>
    </div>
  )
}
