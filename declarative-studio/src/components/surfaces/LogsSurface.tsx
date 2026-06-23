import { NotebookPen, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getResource } from '../../model/registry'
import { logStream, type LogEntry, type LogService } from '../../model/surfaces'
import { useStudio } from '../../state/store'
import { Badge, Button } from '../primitives'

/*
 * The Logs explorer — a BESPOKE single pane of glass. Ad-hoc, cross-cutting
 * query over the whole project's log stream: you don't yet know which resource
 * is at fault, so it can't be a projection of one. It IS deep-linkable: a
 * resource's "View logs" opens this pre-filtered to that resource.
 */
const SERVICES: LogService[] = ['api', 'auth', 'database', 'storage', 'edge', 'realtime']

export function LogsSurface({ resourceId }: { resourceId?: string }) {
  const { openSurface, select, saveToNotebook } = useStudio()
  const [service, setService] = useState<LogService | 'all'>('all')
  const [errorsOnly, setErrorsOnly] = useState(false)
  const [query, setQuery] = useState('')

  const scoped = resourceId ? getResource(resourceId) : undefined

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logStream.filter(
      (l) =>
        (!resourceId || l.resourceId === resourceId) &&
        (service === 'all' || l.service === service) &&
        (!errorsOnly || l.level === 'error') &&
        (!q || l.message.toLowerCase().includes(q))
    )
  }, [resourceId, service, errorsOnly, query])

  return (
    <div className="ds-fade flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-5">
        <h1 className="text-[15px] font-semibold text-fg">Logs</h1>
        <Badge tone="muted">bespoke · single pane</Badge>
        {scoped && (
          <button
            onClick={() => openSurface('logs')}
            className="ds-focus-ring ml-1 flex items-center gap-1 rounded-md border border-brand-dim bg-brand-dim/30 px-1.5 py-0.5 text-[11px] text-brand"
            title="Clear resource filter"
          >
            resource: {scoped.qualified}
            <X className="size-3" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 py-3">
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-panel px-2">
          <Search className="size-3.5 text-fg-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter messages…"
            className="h-7 w-56 bg-transparent text-[12px] text-fg outline-none placeholder:text-fg-faint"
          />
        </div>
        <Chip label="all" active={service === 'all'} onClick={() => setService('all')} />
        {SERVICES.map((s) => (
          <Chip key={s} label={s} active={service === s} onClick={() => setService(s)} />
        ))}
        <Chip
          label="errors only"
          active={errorsOnly}
          onClick={() => setErrorsOnly((v) => !v)}
          tone="red"
        />
        <div className="ml-auto">
          <Button
            disabled={rows.length === 0}
            onClick={() =>
              saveToNotebook(scoped ? `Logs: ${scoped.name}` : 'Logs query', {
                type: 'logs',
                label: `${service === 'all' ? 'all services' : service}${errorsOnly ? ' · errors' : ''}${scoped ? ` · ${scoped.qualified}` : ''}`,
                rows: rows.map((l) => ({
                  ts: l.ts,
                  level: l.level,
                  service: l.service,
                  message: l.message,
                })),
              })
            }
            title="Promote this filter into a durable, shareable notebook block"
          >
            <NotebookPen className="size-3.5" /> Save as notebook
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border font-mono text-[12px]">
          {rows.map((l, i) => (
            <LogRow key={i} log={l} onResource={(id) => select(id)} />
          ))}
          {rows.length === 0 && (
            <div className="px-3 py-8 text-center text-fg-muted">No matching log lines.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function LogRow({ log, onResource }: { log: LogEntry; onResource: (id: string) => void }) {
  const levelColor =
    log.level === 'error' ? 'text-red' : log.level === 'warn' ? 'text-amber' : 'text-fg-muted'
  return (
    <div className="flex items-start gap-3 border-b border-border/60 px-3 py-1.5 last:border-0 hover:bg-panel/60">
      <span className="shrink-0 text-fg-faint">{log.ts}</span>
      <span className={`w-12 shrink-0 ${levelColor}`}>{log.level.toUpperCase()}</span>
      <span className="w-16 shrink-0 text-blue">{log.service}</span>
      {log.status && (
        <span className={`w-9 shrink-0 ${log.status >= 400 ? 'text-red' : 'text-fg-muted'}`}>
          {log.status}
        </span>
      )}
      <span className="flex-1 text-fg-light">{log.message}</span>
      {log.resourceId && (
        <button
          onClick={() => onResource(log.resourceId!)}
          className="ds-focus-ring shrink-0 text-fg-faint hover:text-brand"
          title="Go to resource"
        >
          {log.resourceId.replace(/^(public|function)\./, '')}
        </button>
      )}
    </div>
  )
}

function Chip({
  label,
  active,
  onClick,
  tone,
}: {
  label: string
  active: boolean
  onClick: () => void
  tone?: 'red'
}) {
  return (
    <button
      onClick={onClick}
      className={`ds-focus-ring rounded-md px-2 py-1 text-[12px] transition-colors ${
        active
          ? tone === 'red'
            ? 'bg-red-dim/40 text-red'
            : 'bg-elevated text-fg'
          : 'text-fg-muted hover:bg-panel hover:text-fg-light'
      }`}
    >
      {label}
    </button>
  )
}
