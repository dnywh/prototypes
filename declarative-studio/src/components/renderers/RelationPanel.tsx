import { ArrowUpRight, Info, TriangleAlert } from 'lucide-react'

import { getResource, incomingRelations } from '../../model/registry'
import type { Projection, Relation, Resource } from '../../model/types'
import { useStudio } from '../../state/store'
import { kindIcon, kindLabel } from '../icons'
import { Badge } from '../primitives'

/*
 * Makes the resource graph tangible. Relations render as cards you can click to
 * navigate — table → warehouse copy → back, table → policy. This same renderer
 * powers the Policies and Warehouse projections (each is just a relation of the
 * table) and the "Related" tab on secondary resources.
 */
export function RelationPanel({
  resource,
  projection,
}: {
  resource: Resource
  projection: Projection
}) {
  const out = resource.relations ?? []
  const incoming = incomingRelations(resource.id)

  // Each projection focuses the relevant slice of the graph.
  let edges: Array<{ targetId: string; label: string; relKind?: Relation['kind'] }> = []
  if (projection.type === 'policies') {
    edges = [
      ...out
        .filter((r) => r.kind === 'governs')
        .map((r) => ({ targetId: r.target, label: r.label, relKind: r.kind })),
      ...incoming
        .filter((i) => i.from.kind === 'policy')
        .map((i) => ({ targetId: i.from.id, label: i.label })),
    ]
  } else if (projection.type === 'storage') {
    edges = out
      .filter((r) => r.kind === 'syncs-from')
      .map((r) => ({ targetId: r.target, label: r.label, relKind: r.kind }))
  } else {
    edges = [
      ...out.map((r) => ({ targetId: r.target, label: r.label, relKind: r.kind })),
      ...incoming.map((i) => ({ targetId: i.from.id, label: i.label })),
    ]
  }

  const warning = resource.data?.warning

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      {warning && (
        <div
          className={`flex items-start gap-2 rounded-[var(--radius-panel)] border p-3 text-[13px] ${
            warning.tone === 'danger'
              ? 'border-red-dim bg-red-dim/20 text-red'
              : warning.tone === 'warn'
                ? 'border-amber-dim bg-amber-dim/20 text-amber'
                : 'border-border bg-panel text-fg-light'
          }`}
        >
          {warning.tone === 'info' ? (
            <Info className="mt-0.5 size-4 shrink-0" />
          ) : (
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          )}
          <div>
            <div className="font-medium">{warning.title}</div>
            <div className="text-fg-muted">{warning.body}</div>
          </div>
        </div>
      )}

      {edges.length === 0 && (
        <div className="rounded-[var(--radius-panel)] border border-dashed border-border p-6 text-center text-[13px] text-fg-muted">
          No related resources.
        </div>
      )}

      {edges.map((edge, i) => {
        const target = getResource(edge.targetId)
        if (!target) return null
        return <RelationCard key={`${edge.targetId}-${i}`} target={target} label={edge.label} />
      })}
    </div>
  )
}

function RelationCard({ target, label }: { target: Resource; label: string }) {
  const { select } = useStudio()
  const Icon = kindIcon(target.kind)
  return (
    <button
      onClick={() => select(target.id)}
      className="ds-focus-ring group flex items-center gap-3 rounded-[var(--radius-panel)] border border-border bg-panel p-3 text-left transition-colors duration-100 hover:border-border-strong hover:bg-elevated"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-overlay">
        <Icon className="size-4 text-brand" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-fg-faint">{label}</span>
          <Badge tone="muted">{kindLabel(target.kind)}</Badge>
        </div>
        <div className="truncate font-medium text-fg">{target.qualified}</div>
        {target.description && (
          <div className="truncate text-[12px] text-fg-muted">{target.description}</div>
        )}
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-fg-faint transition-colors group-hover:text-fg" />
    </button>
  )
}
