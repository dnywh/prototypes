import type { Projection, Resource, Signal } from '../../model/types'
import { Card, SectionLabel, Sparkline } from '../primitives'

/*
 * Signals belong to resources, not to a separate observability page. This one
 * renderer covers both Activity (logs) and Usage (metrics) for the table AND the
 * edge function — the projection just decides which signals to show.
 */
export function SignalPanel({
  resource,
  projection,
}: {
  resource: Resource
  projection: Projection
}) {
  const signals = resource.signals ?? []
  const wantLogs = projection.type === 'activity'

  const metrics = signals.filter((s) => s.kind === 'metric' || s.kind === 'usage')
  const logs = signals.filter((s) => s.kind === 'log' || s.kind === 'error')

  return (
    <div className="flex flex-col gap-5">
      {!wantLogs && metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {metrics.map((s) => (
            <MetricCard key={s.id} signal={s} />
          ))}
        </div>
      )}

      {(wantLogs ? logs : logs.filter((s) => s.kind === 'error')).map((s) => (
        <LogList key={s.id} signal={s} />
      ))}
    </div>
  )
}

function MetricCard({ signal }: { signal: Signal }) {
  const tone = signal.kind === 'usage' ? 'blue' : 'brand'
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] text-fg-muted">{signal.label}</div>
          <div className="mt-0.5 text-xl font-semibold text-fg">
            {signal.value}
            {signal.unit && (
              <span className="ml-1 text-[12px] font-normal text-fg-muted">{signal.unit}</span>
            )}
          </div>
        </div>
        {signal.delta && <div className="text-[11px] text-fg-muted">{signal.delta}</div>}
      </div>
      {signal.series && (
        <div className="mt-2">
          <Sparkline data={signal.series} tone={tone} />
        </div>
      )}
    </Card>
  )
}

function LogList({ signal }: { signal: Signal }) {
  const rows = signal.rows ?? []
  return (
    <div>
      <SectionLabel>{signal.label}</SectionLabel>
      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border font-mono text-[12px]">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-start gap-3 border-b border-border/60 px-3 py-1.5 last:border-0 hover:bg-panel/60"
          >
            <span className="text-fg-faint">{row.timestamp}</span>
            <span
              className={
                row.level === 'error'
                  ? 'text-red'
                  : row.level === 'warn'
                    ? 'text-amber'
                    : 'text-fg-muted'
              }
            >
              {row.level.toUpperCase()}
            </span>
            <span className="flex-1 text-fg-light">{row.message}</span>
            {row.meta && <span className="text-fg-faint">{row.meta}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
