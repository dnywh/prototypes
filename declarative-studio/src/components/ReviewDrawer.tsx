import { Check, GitCompare, RotateCw, TriangleAlert, X } from 'lucide-react'

import type { DiffResult } from '../edit/editing'
import { useStudio, type PendingChange } from '../state/store'
import { kindIcon } from './icons'
import { Button, SqlBlock } from './primitives'

/*
 * The global "unsaved changes" review — Saxon's primitive-diff panel. Edits
 * anywhere (inline config, the table/policy editor) collect here as pending
 * changes; you review the generated diffs and Save (apply to config.toml /
 * migrations) or Discard. Persistent + prominent so you don't forget to save.
 */
export function ReviewDrawer() {
  const { reviewOpen, setReviewOpen, pendingChanges, saveAll, discardAll, discardChange, select } =
    useStudio()
  if (!reviewOpen) return null

  return (
    <div className="ds-slide flex h-full w-[420px] shrink-0 flex-col border-l border-border bg-overlay">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <GitCompare className="size-4 text-brand" />
          <div>
            <div className="text-[13px] font-medium text-fg">Unsaved changes</div>
            <div className="text-[11px] text-fg-muted">
              {pendingChanges.length === 0
                ? 'Nothing staged'
                : `${pendingChanges.length} change${pendingChanges.length > 1 ? 's' : ''} staged`}
            </div>
          </div>
        </div>
        <button
          onClick={() => setReviewOpen(false)}
          className="ds-focus-ring text-fg-muted hover:text-fg"
          title="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {pendingChanges.length === 0 ? (
          <div className="grid h-full place-items-center px-6 text-center text-[13px] text-fg-muted">
            No unsaved changes. Edit a setting or a resource and it shows up here.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingChanges.map((c) => (
              <ChangeCard
                key={c.id}
                change={c}
                onOpen={() => {
                  select(c.resourceId, c.projection)
                  setReviewOpen(false)
                }}
                onDiscard={() => discardChange(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {pendingChanges.length > 0 && (
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <Button intent="primary" onClick={saveAll}>
            <Check className="size-3.5" /> Save all
          </Button>
          <Button onClick={discardAll}>Discard all</Button>
        </div>
      )}
    </div>
  )
}

function ChangeCard({
  change,
  onOpen,
  onDiscard,
}: {
  change: PendingChange
  onOpen: () => void
  onDiscard: () => void
}) {
  const Icon = kindIcon(change.kind)
  const diff: DiffResult = change.diff
  const restart = diff.changes.some((ch) => ch.flag === 'restart')
  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-panel px-3 py-2">
        <Icon className="size-3.5 shrink-0 text-brand" />
        <button
          onClick={onOpen}
          className="ds-focus-ring flex-1 truncate text-left text-[13px] font-medium text-fg hover:text-brand"
        >
          {change.label}
        </button>
        <span className="text-[11px] text-fg-faint">
          {diff.changes.length} change{diff.changes.length > 1 ? 's' : ''}
        </span>
        <button
          onClick={onDiscard}
          className="ds-focus-ring text-fg-faint hover:text-red"
          title="Discard this change"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="p-3">
        {restart && (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-amber">
            <RotateCw className="size-3" /> Requires a restart
          </div>
        )}
        {diff.language === 'toml' ? (
          <TomlDiff text={diff.migration} />
        ) : (
          <SqlBlock sql={diff.migration} />
        )}
        {diff.notes.map((n, i) => (
          <div key={i} className="mt-2 flex items-start gap-1.5 text-[11px] text-fg-muted">
            <TriangleAlert className="mt-0.5 size-3 shrink-0 text-amber" />
            {n}
          </div>
        ))}
      </div>
    </div>
  )
}

function TomlDiff({ text }: { text: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-overlay p-3 font-mono text-[12px] leading-relaxed">
      {text.split('\n').map((line, i) => (
        <div
          key={i}
          className={
            line.startsWith('+')
              ? 'text-brand'
              : line.startsWith('-')
                ? 'text-red line-through decoration-red/40'
                : 'text-fg-light'
          }
        >
          {line}
        </div>
      ))}
    </pre>
  )
}
