import { Bot, Wrench, X } from 'lucide-react'
import { useMemo } from 'react'

import type { Resource } from '../model/types'
import { useStudio } from '../state/store'

/*
 * The reveal. Prints the exact declaration driving the current view, with the
 * active projection highlighted. Framed as "what an agent reads & writes": the
 * single source of truth behind UI + tools + docs + config. On a bespoke surface
 * there is no single declaration — and the drawer says so, which is the clearest
 * illustration of the generated-vs-bespoke line.
 */
export function ModelDrawer() {
  const { resource, projection, surface, modelOpen, toggleModel } = useStudio()
  const json = useMemo(() => serialize(resource), [resource])
  if (!modelOpen) return null

  const Header = (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <Bot className="size-4 text-brand" />
        <div>
          <div className="text-[13px] font-medium text-fg">Model</div>
          <div className="text-[11px] text-fg-muted">What an agent reads &amp; writes</div>
        </div>
      </div>
      <button
        onClick={toggleModel}
        className="ds-focus-ring text-fg-muted hover:text-fg"
        title="Close (\)"
      >
        <X className="size-4" />
      </button>
    </div>
  )

  if (surface) {
    return (
      <div className="ds-slide flex h-full w-[420px] shrink-0 flex-col border-l border-border bg-overlay">
        {Header}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <Wrench className="size-6 text-fg-faint" />
          <div className="text-[13px] font-medium text-fg">
            No model — this is a bespoke surface
          </div>
          <p className="text-[12px] leading-relaxed text-fg-muted">
            The <span className="text-fg-light capitalize">{surface.id.replace('-', ' ')}</span>{' '}
            surface is a hand-built single pane of glass that spans the whole project. It isn't
            generated from one resource declaration, so there's nothing to show here. This is the
            ~25% the model deliberately doesn't try to generate.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="ds-slide flex h-full w-[420px] shrink-0 flex-col border-l border-border bg-overlay">
      {Header}
      <div className="border-b border-border px-4 py-2 text-[11px] text-fg-muted">
        Rendering <span className="text-brand">{projection.label}</span> projection ·{' '}
        <span className="text-fg-light">{projection.renderer}</span> ·{' '}
        {projection.generated ? 'generated' : 'bespoke'}
      </div>

      <pre className="flex-1 overflow-auto p-4 font-mono text-[11.5px] leading-relaxed text-fg-light">
        <code>{json}</code>
      </pre>

      <div className="border-t border-border px-4 py-2 text-[11px] text-fg-faint">
        Every projection above renders from this object. No hand-built pages.
      </div>
    </div>
  )
}

/** A compact, readable serialization of the slice that drives the UI. */
function serialize(resource: Resource): string {
  const slim = {
    id: resource.id,
    kind: resource.kind,
    category: resource.category,
    qualified: resource.qualified,
    fields: resource.fields?.map((f) => ({
      name: f.name,
      type: f.type,
      ...(f.isPrimaryKey ? { pk: true } : {}),
      ...(f.nullable === false ? { notNull: true } : {}),
      ...(f.default ? { default: f.default } : {}),
    })),
    relations: resource.relations,
    actions: resource.actions?.map((a) => ({ id: a.id, kind: a.kind, label: a.label })),
    signals: resource.signals?.map((s) => ({ id: s.id, kind: s.kind, value: s.value })),
    projections: resource.projections,
    ...(resource.data?.config ? { config: resource.data.config } : {}),
  }
  return JSON.stringify(slim, null, 2)
}
