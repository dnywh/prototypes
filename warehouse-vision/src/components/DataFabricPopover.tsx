import { Database, X } from 'lucide-react'

import { getSourceIdsForQueries } from '../model/queries'
import { connectionLabel, sources } from '../model/sources'
import { useVision } from '../state/store'
import { Badge } from './primitives'

const typeLabel = {
  postgres: 'Postgres',
  fdw: 'FDW',
  external: 'External',
}

const connectionTone = {
  'in-warehouse': 'brand' as const,
  attached: 'blue' as const,
  'external-feed': 'muted' as const,
}

export function DataFabricPopover() {
  const { dataFabricOpen, dataFabricQueryIds, setDataFabricOpen } = useVision()

  if (!dataFabricOpen) return null

  const highlightSourceIds = dataFabricQueryIds ? getSourceIdsForQueries(dataFabricQueryIds) : null
  const filtered = highlightSourceIds !== null

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-overlay/60 pt-20 backdrop-blur-sm"
      onClick={() => setDataFabricOpen(false)}
    >
      <div
        className="wv-fade w-full max-w-md rounded-[var(--radius-panel)] border border-border bg-panel shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-brand" />
            <span className="text-[14px] font-medium text-fg">Data sources</span>
          </div>
          <button
            onClick={() => setDataFabricOpen(false)}
            className="wv-focus-ring text-fg-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="mb-4 text-[12px] text-fg-muted">
            {filtered
              ? 'Sources in use for this insight. Others are connected but not queried here.'
              : 'Sources connected to this project and informing this standup.'}
          </p>
          <ul className="space-y-2">
            {sources.map((s) => {
              const inUse = highlightSourceIds?.includes(s.id) ?? false
              return (
                <li
                  key={s.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                    filtered && inUse
                      ? 'border-brand/40 bg-brand-dim/15'
                      : filtered
                        ? 'border-border bg-elevated/30 opacity-50'
                        : 'border-border bg-elevated/50'
                  }`}
                >
                  <div>
                    <div className="text-[13px] text-fg-light">{s.label}</div>
                    <div className="text-[11px] text-fg-faint">{s.detail}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="muted">{typeLabel[s.type]}</Badge>
                    <Badge tone={connectionTone[s.connection]}>
                      {connectionLabel[s.connection]}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
