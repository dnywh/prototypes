import { NotebookPen, Play, TerminalSquare } from 'lucide-react'
import { useState } from 'react'

import { useStudio } from '../../state/store'
import { Badge, Button } from '../primitives'

/*
 * SQL Editor — a BESPOKE single pane, sibling to the Logs explorer. It's where
 * ad-hoc SQL is authored (the "where was that SQL written?" answer). Its output
 * can be promoted into a durable Notebook block via "Save to notebook" — the
 * same verb the Logs explorer uses, just producing a query block instead of a
 * logs block.
 */
const DEFAULT_SQL = `select name, count(*) as n
from public.events
where created_at > now() - interval '7 days'
group by name
order by n desc;`

// Canned result — the prototype doesn't run SQL; it returns a fixed shape.
const RESULT = {
  columns: ['name', 'n'],
  rows: [
    ['page_view', 184210],
    ['signup', 8120],
    ['project_created', 3410],
    ['invite_sent', 1980],
  ] as Array<Array<string | number>>,
}

export function SqlEditorSurface() {
  const { saveToNotebook } = useStudio()
  const [sql, setSql] = useState(DEFAULT_SQL)
  const [ran, setRan] = useState(false)

  return (
    <div className="ds-fade flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-5">
        <TerminalSquare className="size-4 text-brand" />
        <h1 className="text-[15px] font-semibold text-fg">SQL Editor</h1>
        <Badge tone="muted">bespoke · single pane</Badge>
        <div className="ml-auto flex items-center gap-1.5">
          <Button intent="primary" onClick={() => setRan(true)}>
            <Play className="size-3.5" /> Run
          </Button>
          <Button
            disabled={!ran}
            onClick={() => saveToNotebook('Query result', { type: 'query', sql, ...RESULT })}
            title="Promote this query into a durable notebook block"
          >
            <NotebookPen className="size-3.5" /> Save to notebook
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
        <textarea
          value={sql}
          onChange={(e) => {
            setSql(e.target.value)
            setRan(false)
          }}
          spellCheck={false}
          className="ds-focus-ring h-40 w-full resize-none rounded-[var(--radius-panel)] border border-border bg-overlay p-3 font-mono text-[12px] leading-relaxed text-fg-light outline-none focus:border-border-strong"
        />

        {ran ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-fg-muted">
              {RESULT.rows.length} rows · 18 ms
            </div>
            <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border text-[12px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-panel text-left text-fg-muted">
                    {RESULT.columns.map((c) => (
                      <th key={c} className="px-3 py-1.5 font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {RESULT.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-1.5 text-fg-light">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-panel)] border border-dashed border-border p-6 text-center text-[12px] text-fg-muted">
            Run the query to see results. Then "Save to notebook" to keep it.
          </div>
        )}
      </div>
    </div>
  )
}
