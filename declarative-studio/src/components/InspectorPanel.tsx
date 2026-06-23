import { ArrowUpRight, BookText } from 'lucide-react'

import { getResource, incomingRelations } from '../model/registry'
import type { Resource } from '../model/types'
import { useStudio } from '../state/store'
import { kindIcon, kindLabel } from './icons'
import { SectionLabel } from './primitives'
import { storageSummaryForResource } from './storageSummary'

/*
 * The right inspector — Figma-style: a quiet, consistent panel over the shared
 * object graph. Fields summary, relations (navigable), and docs. Same panel for
 * every resource, so learning one teaches all.
 */
export function InspectorPanel({ resource }: { resource: Resource }) {
  const { select, setProjection } = useStudio()
  const fields = resource.fields ?? []
  const storageLabel = storageSummaryForResource(resource)

  // Combine outgoing + incoming edges, deduped by the related resource so each
  // neighbour in the graph shows once. Outgoing labels win — they read better
  // from this resource's point of view ("Warehouse copy" vs "Source heap table").
  const seen = new Set<string>()
  const relations: Array<{ target: Resource; label: string }> = []
  for (const rel of resource.relations ?? []) {
    const target = getResource(rel.target)
    if (target && !seen.has(target.id)) {
      seen.add(target.id)
      relations.push({ target, label: rel.label })
    }
  }
  for (const inc of incomingRelations(resource.id)) {
    if (!seen.has(inc.from.id)) {
      seen.add(inc.from.id)
      relations.push({ target: inc.from, label: inc.label })
    }
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col gap-5 overflow-y-auto border-l border-border p-4">
      <div>
        <SectionLabel>Resource</SectionLabel>
        <div className="flex flex-col gap-1.5 text-[12px]">
          <Row label="Kind" value={kindLabel(resource.kind)} />
          <Row label="Identifier" value={resource.qualified} mono />
          <Row label="Category" value={resource.category} />
          <Row label="Projections" value={String(resource.projections.length)} />
          {storageLabel && (
            <button
              type="button"
              onClick={() => setProjection('storage')}
              className="ds-focus-ring flex w-full items-center justify-between gap-2 rounded-md px-0 py-0.5 text-left hover:text-brand"
            >
              <span className="text-fg-muted">Storage</span>
              <span className="text-fg-light">{storageLabel}</span>
            </button>
          )}
        </div>
      </div>

      {fields.length > 0 && (
        <div>
          <SectionLabel>Fields ({fields.length})</SectionLabel>
          <div className="flex flex-col gap-1">
            {fields.map((f) => (
              <div key={f.name} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="truncate text-fg-light">{f.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-fg-muted">{f.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {relations.length > 0 && (
        <div>
          <SectionLabel>Relations</SectionLabel>
          <div className="flex flex-col gap-1">
            {relations.map((rel, i) => (
              <RelationLink
                key={i}
                label={rel.label}
                target={rel.target}
                onClick={() => select(rel.target.id)}
              />
            ))}
          </div>
        </div>
      )}

      {resource.docsUrl && (
        <a
          href={resource.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="ds-focus-ring mt-auto flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-2 text-[12px] text-fg-light hover:bg-elevated"
        >
          <BookText className="size-3.5 text-fg-muted" />
          Documentation
          <ArrowUpRight className="ml-auto size-3.5 text-fg-faint" />
        </a>
      )}
    </aside>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-fg-muted">{label}</span>
      <span className={`truncate text-fg-light ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function RelationLink({
  label,
  target,
  onClick,
}: {
  label: string
  target: Resource
  onClick: () => void
}) {
  const Icon = kindIcon(target.kind)
  return (
    <button
      onClick={onClick}
      className="ds-focus-ring group flex items-center gap-2 rounded-md px-1.5 py-1 text-left text-[12px] hover:bg-panel"
    >
      <Icon className="size-3.5 shrink-0 text-fg-muted" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-fg-light">{target.name}</span>
        <span className="block truncate text-[10px] uppercase tracking-wide text-fg-faint">
          {label}
        </span>
      </span>
      <ArrowUpRight className="size-3 shrink-0 text-fg-faint opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
