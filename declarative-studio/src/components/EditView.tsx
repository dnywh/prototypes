import { Check, GitCompare, Plus, Trash2, X } from 'lucide-react'

import { type ColumnDraft, type Draft } from '../edit/editing'
import { configSection } from '../model/sql'
import type { ConfigKey, Resource } from '../model/types'
import { useStudio } from '../state/store'
import { Button, SectionLabel } from './primitives'

/*
 * Live edit surface. Edits write straight into the global pending working set —
 * the same model as inline config. No per-resource "apply" or local diff; the
 * generated diff and Save live in the top-right Review. Done leaves edit mode
 * (keeping changes), Discard drops this resource's pending edits.
 */
export function EditView({ resource }: { resource: Resource }) {
  const { draft, setDraft, doneEdit, cancelEdit, setReviewOpen } = useStudio()
  if (!draft) return null

  return (
    <div className="ds-fade flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>Editing {resource.qualified}</SectionLabel>
        <button
          onClick={() => setReviewOpen(true)}
          className="ds-focus-ring flex items-center gap-1.5 text-[12px] text-fg-muted hover:text-brand"
        >
          <GitCompare className="size-3.5" /> Review changes
        </button>
      </div>

      {draft.kind === 'config' && (
        <ConfigForm draft={draft} setDraft={setDraft} resource={resource} />
      )}
      {draft.kind === 'policy' && <PolicyForm draft={draft} setDraft={setDraft} />}
      {draft.kind === 'table' && <TableForm draft={draft} setDraft={setDraft} />}

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Button intent="primary" onClick={doneEdit}>
          <Check className="size-3.5" /> Done
        </Button>
        <Button onClick={cancelEdit}>
          <X className="size-3.5" /> Discard changes
        </Button>
        <span className="ml-auto text-[11px] text-fg-faint">
          Changes appear in the top-right review · saved there
        </span>
      </div>
    </div>
  )
}

// --- forms ------------------------------------------------------------------

const inputClass =
  'ds-focus-ring h-7 rounded-md border border-border bg-overlay px-2 text-[12px] text-fg outline-none focus:border-border-strong'

function ConfigForm({
  draft,
  setDraft,
  resource,
}: {
  draft: Extract<Draft, { kind: 'config' }>
  setDraft: (d: Draft) => void
  resource: Resource
}) {
  const keys = resource.data?.configGroup ?? []
  const set = (key: string, value: string | number | boolean) =>
    setDraft({ ...draft, values: { ...draft.values, [key]: value } })

  const sections: Array<{ section: string; items: ConfigKey[] }> = []
  for (const k of keys) {
    const section = configSection(k.key) || 'project'
    let g = sections.find((s) => s.section === section)
    if (!g) sections.push((g = { section, items: [] }))
    g.items.push(k)
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {sections.map((g) => (
        <div key={g.section}>
          <div className="mb-2 font-mono text-[12px] text-fg-muted">[{g.section}]</div>
          <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border">
            {g.items.map((cfg) => {
              const v = draft.values[cfg.key]
              return (
                <div
                  key={cfg.key}
                  className="flex items-center justify-between gap-4 border-b border-border/60 bg-panel px-3 py-2 last:border-0"
                >
                  <span className="text-[13px] text-fg-light">{cfg.label}</span>
                  {cfg.type === 'boolean' ? (
                    <Toggle on={Boolean(v)} onChange={(next) => set(cfg.key, next)} />
                  ) : (
                    <input
                      className={`${inputClass} w-56 text-right`}
                      value={String(v)}
                      onChange={(e) =>
                        set(
                          cfg.key,
                          cfg.type === 'number' ? Number(e.target.value) : e.target.value
                        )
                      }
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function PolicyForm({
  draft,
  setDraft,
}: {
  draft: Extract<Draft, { kind: 'policy' }>
  setDraft: (d: Draft) => void
}) {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <Labeled label="Command">
        <select
          className={`${inputClass} w-40`}
          value={draft.command}
          onChange={(e) => setDraft({ ...draft, command: e.target.value as typeof draft.command })}
        >
          {['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL'].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Labeled>
      <Labeled label="Roles (comma separated)">
        <input
          className={`${inputClass} w-full`}
          value={draft.roles}
          onChange={(e) => setDraft({ ...draft, roles: e.target.value })}
        />
      </Labeled>
      <Labeled label="USING expression">
        <input
          className={`${inputClass} w-full font-mono`}
          value={draft.using}
          onChange={(e) => setDraft({ ...draft, using: e.target.value })}
        />
      </Labeled>
      <Labeled label="WITH CHECK expression">
        <input
          className={`${inputClass} w-full font-mono`}
          placeholder="(optional)"
          value={draft.check}
          onChange={(e) => setDraft({ ...draft, check: e.target.value })}
        />
      </Labeled>
    </div>
  )
}

function TableForm({
  draft,
  setDraft,
}: {
  draft: Extract<Draft, { kind: 'table' }>
  setDraft: (d: Draft) => void
}) {
  const setCol = (i: number, patch: Partial<ColumnDraft>) =>
    setDraft({ ...draft, columns: draft.columns.map((c, j) => (j === i ? { ...c, ...patch } : c)) })
  const removeCol = (i: number) =>
    setDraft({ ...draft, columns: draft.columns.filter((_, j) => j !== i) })
  const addCol = () =>
    setDraft({
      ...draft,
      columns: [
        ...draft.columns,
        { name: 'new_column', type: 'text', nullable: true, default: '', origName: '' },
      ],
    })

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <Labeled label="Comment">
        <input
          className={`${inputClass} w-full`}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </Labeled>
      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border">
        <div className="flex items-center gap-2 border-b border-border bg-panel px-3 py-1.5 text-[11px] uppercase tracking-wide text-fg-muted">
          <span className="w-40">Name</span>
          <span className="w-28">Type</span>
          <span className="w-20">Nullable</span>
          <span className="flex-1">Default</span>
          <span className="w-6" />
        </div>
        {draft.columns.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2 border-b border-border/60 px-3 py-1.5 last:border-0"
          >
            <input
              className={`${inputClass} w-40`}
              value={c.name}
              onChange={(e) => setCol(i, { name: e.target.value })}
            />
            <input
              className={`${inputClass} w-28 font-mono`}
              value={c.type}
              onChange={(e) => setCol(i, { type: e.target.value })}
            />
            <div className="w-20">
              <Toggle on={c.nullable} onChange={(next) => setCol(i, { nullable: next })} />
            </div>
            <input
              className={`${inputClass} flex-1 font-mono`}
              placeholder="—"
              value={c.default}
              onChange={(e) => setCol(i, { default: e.target.value })}
            />
            <button
              onClick={() => removeCol(i)}
              className="ds-focus-ring grid size-6 place-items-center rounded text-fg-muted hover:text-red"
              title="Drop column"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div>
        <Button onClick={addCol}>
          <Plus className="size-3.5" /> Add column
        </Button>
      </div>
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] text-fg-muted">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`ds-focus-ring flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${on ? 'justify-end bg-brand' : 'justify-start bg-border-strong'}`}
    >
      <span className="size-4 rounded-full bg-fg shadow" />
    </button>
  )
}
