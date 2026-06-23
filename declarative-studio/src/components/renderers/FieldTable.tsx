import { KeyRound } from 'lucide-react'

import type { Projection, Resource } from '../../model/types'
import { Badge } from '../primitives'

/*
 * One renderer, two jobs — both driven by `fields`:
 *  - Schema: a row per field with its type/flags.
 *  - Data: a grid GENERATED from the field declarations over sample rows.
 * The Data view is the "fold the explorer into the system" attempt.
 */
export function FieldTable({
  resource,
  projection,
}: {
  resource: Resource
  projection: Projection
}) {
  if (projection.type === 'data') return <DataGrid resource={resource} />
  return <SchemaTable resource={resource} />
}

function SchemaTable({ resource }: { resource: Resource }) {
  const fields = resource.fields ?? []
  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-panel text-left text-fg-muted">
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Nullable</Th>
            <Th>Default</Th>
            <Th>Source</Th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.name} className="border-b border-border/60 last:border-0 hover:bg-panel/60">
              <Td>
                <span className="flex items-center gap-1.5 font-medium text-fg">
                  {f.isPrimaryKey && <KeyRound className="size-3 text-amber" />}
                  {f.name}
                </span>
                {f.comment && <div className="text-[11px] text-fg-muted">{f.comment}</div>}
              </Td>
              <Td>
                <span className="font-mono text-[12px] text-brand">{f.type}</span>
              </Td>
              <Td>
                {f.nullable === false ? (
                  <span className="text-fg-muted">not null</span>
                ) : (
                  <span className="text-fg-faint">nullable</span>
                )}
              </Td>
              <Td>
                {f.default ? (
                  <span className="font-mono text-[12px] text-fg-light">{f.default}</span>
                ) : (
                  <span className="text-fg-faint">—</span>
                )}
              </Td>
              <Td>
                <Badge tone="muted">{f.source ?? '—'}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DataGrid({ resource }: { resource: Resource }) {
  const fields = resource.fields ?? []
  const rows = resource.data?.rows ?? []
  return (
    <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-border">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-border bg-panel text-left text-fg-muted">
            {fields.map((f) => (
              <th key={f.name} className="whitespace-nowrap px-3 py-2 font-medium">
                <span className="text-fg-light">{f.name}</span>
                <span className="ml-1.5 font-mono text-[11px] text-fg-faint">{f.type}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-panel/60">
              {fields.map((f) => {
                const v = row[f.name]
                return (
                  <td key={f.name} className="whitespace-nowrap px-3 py-1.5 text-fg-light">
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
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-top">{children}</td>
}
