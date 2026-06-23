import { ArrowDownUp, ChevronLeft, Filter, MoreVertical, Plus, Rows3 } from 'lucide-react'
import { useState } from 'react'

import { getResource } from '../../model/registry'
import { useStudio } from '../../state/store'
import { Badge, Button } from '../primitives'

/*
 * The heavyweight Table Editor — a BESPOKE single pane of glass, deliberately
 * NOT generated. This is the "single pane" Danny carved out: spreadsheet-grade
 * editing, filters, sorts, bulk ops, pagination at scale. It coexists with the
 * lightweight generated Data tab on each table (quick look) — you escalate here
 * for power editing. Entry points: the Tables surface, or "Open in editor".
 */
export function TableEditorSurface({
  resourceId,
  tableKey,
}: {
  resourceId?: string
  tableKey?: string
}) {
  const { openSurface, select } = useStudio()
  const [menuOpen, setMenuOpen] = useState(false)
  const resource = resourceId ? getResource(resourceId) : undefined
  const fields = resource?.fields ?? inferFields(tableKey)
  const rows = resource?.data?.rows ?? []
  const qualified = resource?.qualified ?? tableKey ?? 'table'

  return (
    <div className="ds-fade flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <button
          onClick={() => openSurface('tables')}
          className="ds-focus-ring text-fg-muted hover:text-fg"
          title="Back to Tables"
        >
          <ChevronLeft className="size-4" />
        </button>
        <Rows3 className="size-4 text-brand" />
        <span className="font-mono text-[14px] font-semibold text-fg">{qualified}</span>
        <Badge tone="amber">bespoke editor</Badge>
        {resource && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="ds-focus-ring rounded-md border border-border bg-panel p-1 text-fg-muted hover:text-fg"
              aria-label="Table actions"
            >
              <MoreVertical className="size-4" />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-md border border-border bg-overlay py-1 shadow-lg">
                  <MenuItem
                    label="Table details"
                    onClick={() => {
                      select(resource.id)
                      setMenuOpen(false)
                    }}
                  />
                  <MenuItem
                    label="Storage"
                    onClick={() => {
                      select(resource.id, 'storage')
                      setMenuOpen(false)
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <Button>
            <Filter className="size-3.5" /> Filter
          </Button>
          <Button>
            <ArrowDownUp className="size-3.5" /> Sort
          </Button>
          <Button intent="primary">
            <Plus className="size-3.5" /> Insert row
          </Button>
        </div>
      </div>

      <div className="border-b border-border px-4 py-1.5 text-[12px] text-fg-muted">
        Heavyweight editing surface — inline cell edits, filters, sorts, bulk ops, pagination.
        Hand-built, not generated. The generated <span className="text-fg-light">Data</span> tab on
        the resource is the quick-look counterpart.
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0">
            <tr className="bg-panel text-left text-fg-muted">
              <th className="w-10 border-b border-r border-border px-2 py-1.5 text-center">
                <input type="checkbox" className="accent-[var(--color-brand)]" readOnly />
              </th>
              {fields.map((f) => (
                <th
                  key={f.name}
                  className="whitespace-nowrap border-b border-r border-border px-3 py-1.5 font-medium"
                >
                  <span className="text-fg-light">{f.name}</span>
                  <span className="ml-1.5 font-mono text-[11px] text-fg-faint">{f.type}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {(rows.length ? rows : placeholderRows(fields)).map((row, i) => (
              <tr key={i} className="hover:bg-panel/50">
                <td className="border-b border-r border-border px-2 py-1.5 text-center text-fg-faint">
                  {i + 1}
                </td>
                {fields.map((f) => {
                  const v = (row as Record<string, unknown>)[f.name]
                  return (
                    <td
                      key={f.name}
                      className="whitespace-nowrap border-b border-r border-border px-3 py-1.5 text-fg-light"
                    >
                      {v === null || v === undefined ? (
                        <span className="italic text-fg-faint">null</span>
                      ) : (
                        String(v)
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function inferFields(tableKey?: string) {
  void tableKey
  return [
    { name: 'id', type: 'bigint' },
    { name: 'created_at', type: 'timestamptz' },
    { name: 'data', type: 'jsonb' },
  ]
}

function placeholderRows(fields: Array<{ name: string; type: string }>) {
  return Array.from({ length: 6 }, (_, i) => {
    const r: Record<string, unknown> = {}
    for (const f of fields) r[f.name] = f.name === 'id' ? 1000 + i : '…'
    return r
  })
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ds-focus-ring block w-full px-3 py-1.5 text-left text-[13px] text-fg-light hover:bg-panel hover:text-fg"
    >
      {label}
    </button>
  )
}
