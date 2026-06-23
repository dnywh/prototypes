import {
  ChevronLeft,
  FunctionSquare,
  HardDrive,
  NotebookText,
  Plus,
  ShieldCheck,
  Table2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'

import { creatableFor, creatables } from '../model/create'
import { useStudio } from '../state/store'
import { Button, SqlBlock } from './primitives'

const kindIcons: Record<string, LucideIcon> = {
  table: Table2,
  bucket: HardDrive,
  'edge-function': FunctionSquare,
  policy: ShieldCheck,
  notebook: NotebookText,
}

/*
 * The "+ New" flow. With no kind it's a picker (enumerating the model's creatable
 * kinds); with a kind it's a name + a GENERATED preview of the statement that
 * would run. Creation is a staged change with a preview, exactly like edits.
 */
export function CreateDialog() {
  const { creating, openCreate, closeCreate } = useStudio()
  const [name, setName] = useState('')
  const [done, setDone] = useState(false)
  if (!creating) return null

  const active = creatableFor(creating.kind)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[14vh]"
      onClick={closeCreate}
    >
      <div
        className="ds-fade w-[520px] max-w-[92vw] overflow-hidden rounded-xl border border-border-strong bg-overlay shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          {active && (
            <button
              onClick={() => openCreate()}
              className="ds-focus-ring text-fg-muted hover:text-fg"
              title="Back"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
          <Plus className="size-4 text-brand" />
          <span className="text-[13px] font-medium text-fg">
            {active ? `New ${active.label}` : 'Create new…'}
          </span>
          <button
            onClick={closeCreate}
            className="ds-focus-ring ml-auto text-fg-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        {!active && (
          <ul className="p-1.5">
            {creatables.map((c) => {
              const Icon = kindIcons[c.kind] ?? Plus
              return (
                <li key={c.kind}>
                  <button
                    onClick={() => {
                      setName('')
                      setDone(false)
                      openCreate(c.kind)
                    }}
                    className="ds-focus-ring flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-[13px] text-fg-light hover:bg-elevated hover:text-fg"
                  >
                    <Icon className="size-4 shrink-0 text-fg-muted" />
                    <span className="flex-1">{c.label}</span>
                    <span className="text-[11px] text-fg-faint">{c.area}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {active && (
          <div className="flex flex-col gap-3 p-4">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] text-fg-muted">Name</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  active
                    .preview('')
                    .match(/[\w-]+/g)
                    ?.slice(-1)[0] ?? 'name'
                }
                className="ds-focus-ring h-8 rounded-md border border-border bg-overlay px-2 text-[13px] text-fg outline-none focus:border-border-strong"
              />
            </label>

            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wider text-fg-muted">
                Generated {active.language === 'sql' ? 'SQL' : 'command'}
              </div>
              <SqlBlock sql={active.preview(name)} />
            </div>

            {done ? (
              <div className="text-[13px] text-brand">✓ Created (mocked in this prototype).</div>
            ) : (
              <div className="flex items-center gap-2">
                <Button intent="primary" onClick={() => setDone(true)}>
                  Create {active.label}
                </Button>
                <Button onClick={closeCreate}>Cancel</Button>
                <span className="ml-auto text-[11px] text-fg-faint">
                  Staged preview · runs on Create
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
