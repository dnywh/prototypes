import { ArrowUp } from 'lucide-react'
import { useState } from 'react'

import { findPaletteAnswer, paletteAnswers } from '../model/palette-answers'
import { useVision } from '../state/store'

export function ThreadComposer() {
  const { requestThreadContinuation, pendingFollowUp } = useVision()
  const [query, setQuery] = useState('')

  const submit = () => {
    const trimmed = query.trim()
    if (!trimmed || pendingFollowUp) return
    const answer = findPaletteAnswer(trimmed)
    if (answer) {
      requestThreadContinuation(answer)
      setQuery('')
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-bg via-bg/95 to-transparent pb-5 pt-[7.5rem]">
      <div className="pointer-events-auto mx-auto max-w-2xl px-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {paletteAnswers.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={!!pendingFollowUp}
              onClick={() => requestThreadContinuation(a)}
              className="wv-focus-ring rounded-full border border-border bg-panel px-3 py-1 text-[11px] text-fg-muted transition-colors hover:border-border-strong hover:text-fg-light disabled:opacity-40"
            >
              {a.question}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-full border border-border bg-panel py-3 pl-6 pr-3 shadow-lg">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            rows={1}
            disabled={!!pendingFollowUp}
            placeholder="Ask a follow-up..."
            className="h-6 flex-1 resize-none bg-transparent text-base leading-none text-fg outline-none placeholder:text-fg-faint disabled:opacity-50"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!query.trim() || !!pendingFollowUp}
            className="wv-focus-ring flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg transition-opacity disabled:opacity-30"
            aria-label="Send"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
