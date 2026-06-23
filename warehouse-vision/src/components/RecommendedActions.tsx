import { suggestions } from '../model/suggestions'
import { SectionLabel } from './primitives'
import { SuggestionBlock } from './SuggestionBlock'

export function RecommendedActions() {
  return (
    <section className="mt-16 mb-8">
      <div className="mb-2 flex items-center justify-between">
        <SectionLabel>Recommended actions</SectionLabel>
        <span className="text-[11px] text-fg-faint">{suggestions.length} items</span>
      </div>
      <div className="rounded-[var(--radius-panel)] border border-border bg-panel">
        {suggestions.map((s) => (
          <SuggestionBlock key={s.id} suggestion={s} compact />
        ))}
      </div>
    </section>
  )
}
