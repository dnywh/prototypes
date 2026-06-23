import { useStudio } from '../state/store'
import { Dot } from './primitives'

/*
 * Top tab bar. Tabs come straight from resource.projections. We DON'T mark every
 * tab "generated" — that's noise when they all are. A marker shows only on the
 * rare bespoke tab (generated:false), so when you see one it actually means
 * something. The generated-vs-bespoke line mostly lives at the surface level now.
 */
export function ResourceTabs() {
  const { resource, projection, setProjection } = useStudio()

  return (
    <div className="flex items-center gap-1 border-b border-border px-4">
      {resource.projections.map((p) => {
        const active = p.type === projection.type
        return (
          <button
            key={p.type}
            onClick={() => setProjection(p.type)}
            className={`ds-focus-ring relative flex items-center gap-1.5 px-2.5 py-2.5 text-[13px] transition-colors duration-100 ${
              active ? 'text-fg' : 'text-fg-muted hover:text-fg-light'
            }`}
          >
            {!p.generated && (
              <Dot tone="amber" title="Bespoke — a hand-built single pane of glass" />
            )}
            {p.label}
            {active && (
              <span className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-brand" />
            )}
          </button>
        )
      })}
    </div>
  )
}
