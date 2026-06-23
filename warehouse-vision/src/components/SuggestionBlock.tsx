import { ChevronDown } from 'lucide-react'

import { isFootnoteActive } from '../lib/evidence'
import { getQuery } from '../model/queries'
import type { Suggestion } from '../model/types'
import { useVision } from '../state/store'
import { FootnotePill } from './FootnotePill'
import { InsightMeta } from './InsightMeta'
import { LinearIcon } from './LinearIcon'

interface SuggestionBlockProps {
  suggestion: Suggestion
  compact?: boolean
}

export function SuggestionBlock({ suggestion, compact = false }: SuggestionBlockProps) {
  const { suggestionWhyOpen, toggleSuggestionWhy, activeEvidence, openEvidence } = useVision()
  const whyOpen = suggestionWhyOpen[suggestion.id] ?? false

  return (
    <div
      className={`border-b border-border px-4 last:border-b-0 ${compact ? 'py-3' : 'rounded-[var(--radius-card)] border border-border p-4 last:border-b'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-[13px] font-medium text-fg">{suggestion.action}</p>
        <button
          type="button"
          title="Create a Linear issue from this recommendation"
          className="group wv-focus-ring -mt-0.5 -mr-1.5 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] text-fg-faint transition-colors hover:bg-elevated hover:text-fg-muted"
        >
          <LinearIcon className="size-3 opacity-30 transition-opacity group-hover:opacity-100" />
          Add to Linear
        </button>
      </div>

      <button
        type="button"
        onClick={() => toggleSuggestionWhy(suggestion.id)}
        className="wv-focus-ring mt-2 inline-flex items-center gap-1 text-[12px] text-fg-muted hover:text-fg-light"
      >
        Why?
        <ChevronDown className={`size-3 transition-transform ${whyOpen ? 'rotate-180' : ''}`} />
      </button>

      {whyOpen && (
        <ul className="mt-2 space-y-2">
          {suggestion.evidence.map((item, idx) => {
            const ref = idx + 1
            const target = {
              queryId: item.queryId,
              source: 'action' as const,
              ref,
            }
            return (
              <li key={`${suggestion.id}:${ref}`} className="flex items-start gap-1 text-[12px] text-fg-light">
                <span className="flex-1">{item.text}</span>
                <FootnotePill
                  n={ref}
                  active={isFootnoteActive(activeEvidence, target)}
                  sentiment={getQuery(item.queryId)?.sentiment}
                  onClick={() => openEvidence(target)}
                />
              </li>
            )
          })}
        </ul>
      )}

      <InsightMeta
        className="mt-2"
        confidence={suggestion.confidence}
        queryIds={suggestion.queryIds}
      />
    </div>
  )
}
