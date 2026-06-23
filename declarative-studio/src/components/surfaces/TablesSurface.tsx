import { ArrowUpRight, KeyRound, Search, ShieldOff } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ensureTableResource } from '../../model/registry'
import { schemaList, tableCatalog, type TableSummary } from '../../model/surfaces'
import { useStudio } from '../../state/store'
import { Badge } from '../primitives'
import { storageSummaryLabel } from '../storageSummary'

/*
 * The home for ALL tables, across ALL schemas. This is the answer to scale: the
 * sidebar stays curated; the full set lives here, with schema as a filter — not
 * as N sidebar sections. A bespoke browse surface, deep-linkable from ⌘K.
 */
export function TablesSurface() {
  const { select, resolveResource } = useStudio()
  const [schema, setSchema] = useState<string>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tableCatalog.filter(
      (t) =>
        (schema === 'all' || t.schema === schema) &&
        (!q || `${t.schema}.${t.name}`.toLowerCase().includes(q))
    )
  }, [schema, query])

  // Every table opens as a resource — modelled ones get full projections,
  // the rest a stub. The Table Editor is an escalation FROM a table, not a fallback.
  const open = (t: TableSummary) => select(ensureTableResource(t.schema, t.name))

  return (
    <div className="ds-fade flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pt-5">
        <h1 className="text-[15px] font-semibold text-fg">Tables</h1>
        <Badge tone="muted">
          {tableCatalog.length} across {schemaList.length} schemas
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 py-3">
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-panel px-2">
          <Search className="size-3.5 text-fg-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables…"
            className="h-7 w-56 bg-transparent text-[12px] text-fg outline-none placeholder:text-fg-faint"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <SchemaChip label="all" active={schema === 'all'} onClick={() => setSchema('all')} />
          {schemaList.map((s) => (
            <SchemaChip key={s} label={s} active={schema === s} onClick={() => setSchema(s)} />
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-panel text-left text-fg-muted">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Schema</th>
                <th className="px-3 py-2 text-right font-medium">Rows</th>
                <th className="px-3 py-2 text-right font-medium">Size</th>
                <th className="px-3 py-2 font-medium">Storage</th>
                <th className="px-3 py-2 font-medium">RLS</th>
                <th className="w-8 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={`${t.schema}.${t.name}`}
                  onClick={() => open(t)}
                  className="group cursor-pointer border-b border-border/60 last:border-0 hover:bg-panel/60"
                >
                  <td className="px-3 py-2 font-medium text-fg">
                    <span className="flex items-center gap-1.5">
                      {t.name}
                      {t.resourceId && <Badge tone="brand">modelled</Badge>}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-[12px] text-fg-muted">{t.schema}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[12px] text-fg-light">
                    {t.rows}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[12px] text-fg-light">
                    {t.size}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-fg-muted">
                    {(() => {
                      const resource = t.resourceId ? resolveResource(t.resourceId) : undefined
                      const label = storageSummaryLabel(resource?.data?.warehouse)
                      return label ? (
                        <span className="text-fg-light">{label}</span>
                      ) : (
                        <span className="text-fg-faint">—</span>
                      )
                    })()}
                  </td>
                  <td className="px-3 py-2">
                    {t.rls ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-brand">
                        <KeyRound className="size-3" /> on
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[12px] text-amber">
                        <ShieldOff className="size-3" /> off
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <ArrowUpRight className="size-3.5 text-fg-faint opacity-0 transition-opacity group-hover:opacity-100" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-fg-muted">
          Every table opens as a resource — this is the list view of the table collection. Other
          schemas live here, not the sidebar. Open the Table Editor from a table for heavy editing.
        </p>
      </div>
    </div>
  )
}

function SchemaChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`ds-focus-ring rounded-md px-2 py-1 font-mono text-[12px] transition-colors ${
        active ? 'bg-elevated text-fg' : 'text-fg-muted hover:bg-panel hover:text-fg-light'
      }`}
    >
      {label}
    </button>
  )
}
