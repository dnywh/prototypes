import { BarChart3, ChevronDown } from 'lucide-react'
import { useEffect, useState, type MouseEvent } from 'react'

import { getSource } from '../model/sources'
import { sentimentColor } from '../lib/sentiment'
import type { LiveQuery } from '../model/types'
import { useVision } from '../state/store'
import { Button } from './primitives'
import { Sparkline } from './Sparkline'

interface LiveQueryCardProps {
  query: LiveQuery
  expanded?: boolean
}

export function LiveQueryCard({ query, expanded = false }: LiveQueryCardProps) {
  const { openDataFabric: showDataFabric } = useVision()
  const [sqlOpen, setSqlOpen] = useState(expanded)

  useEffect(() => {
    setSqlOpen(expanded)
  }, [query.id, expanded])

  const openSourceDialog = (e: MouseEvent) => {
    e.stopPropagation()
    showDataFabric([query.id])
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-fg">{query.label}</div>
          <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">{query.insight}</p>
        </div>
        <Sparkline
          data={query.sparkline}
          width={80}
          height={28}
          color={sentimentColor[query.sentiment]}
        />
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] text-fg-faint">
        <span>{query.timeWindow}</span>
        <span aria-hidden>·</span>
        {query.tables.map((tableId, i) => {
          const source = getSource(tableId)
          const label = source?.label ?? tableId
          return (
            <span key={tableId} className="inline-flex items-center gap-1">
              {i > 0 && <span aria-hidden>,</span>}
              <button
                type="button"
                onClick={openSourceDialog}
                className="wv-focus-ring text-fg-muted underline decoration-fg-faint/30 underline-offset-2 hover:text-fg-light"
              >
                {label}
              </button>
            </span>
          )
        })}
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-brand wv-pulse" aria-hidden />
          Live
        </span>
        <span aria-hidden>·</span>
        <span>{query.latencyMs}ms</span>
        <span aria-hidden>·</span>
        <span>{query.rowCount} rows</span>
        <span aria-hidden>·</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setSqlOpen(!sqlOpen)
          }}
          className="wv-focus-ring inline-flex items-center gap-0.5 text-fg-muted hover:text-fg-light"
        >
          SQL
          <ChevronDown className={`size-3 transition-transform ${sqlOpen ? 'rotate-180' : ''}`} />
        </button>
      </p>

      {sqlOpen && (
        <div className="mt-3 space-y-2">
          <pre className="overflow-x-auto rounded border border-border bg-bg p-3 font-mono text-[10px] leading-relaxed text-fg-muted">
            <code>{query.sql}</code>
          </pre>
          <Button
            type="button"
            intent="ghost"
            className="w-full text-[12px] text-fg-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <BarChart3 className="size-3.5" />
            Explore data
          </Button>
        </div>
      )}
    </div>
  )
}
