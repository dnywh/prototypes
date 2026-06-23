import { ChevronLeft, NotebookText, Plus } from 'lucide-react'

import { type Notebook, type NotebookBlock } from '../../model/surfaces'
import { useStudio } from '../../state/store'
import { Badge, Button, Card, SectionLabel, Sparkline, SqlBlock } from '../primitives'

/*
 * Notebooks — the durable, composable analysis layer. A BESPOKE surface, but the
 * blocks reuse the same primitives as everything else. Relationship to Logs +
 * SQL Editor: those are the ephemeral scratchpads; "Save to notebook" promotes a
 * query/log filter into a durable block here. Notebooks are shareable.
 */
export function NotebooksSurface({ notebookId }: { notebookId?: string }) {
  const { openSurface, notebooks } = useStudio()
  const active = notebookId ? notebooks.find((n) => n.id === notebookId) : undefined

  if (active) return <NotebookDetail notebook={active} onBack={() => openSurface('notebooks')} />

  return (
    <div className="ds-fade flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-5">
        <h1 className="text-[15px] font-semibold text-fg">Notebooks</h1>
        <Badge tone="muted">bespoke · composable</Badge>
        <div className="ml-auto">
          <Button disabled title="Marketplace nod — notebooks are shareable like templates">
            <Plus className="size-3.5" /> New notebook
          </Button>
        </div>
      </div>
      <p className="px-5 pt-1 text-[12px] text-fg-muted">
        Saved analyses over the resource graph — re-runnable, shareable. A saved log query or a
        chart over a table's signals becomes a block here.
      </p>

      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
        {notebooks.map((n) => (
          <button
            key={n.id}
            onClick={() => openSurface('notebooks', { notebookId: n.id })}
            className="ds-focus-ring rounded-[var(--radius-panel)] border border-border bg-panel p-4 text-left transition-colors hover:border-border-strong hover:bg-elevated"
          >
            <div className="flex items-center gap-2">
              <NotebookText className="size-4 text-brand" />
              <span className="font-medium text-fg">{n.title}</span>
            </div>
            <p className="mt-1 text-[12px] text-fg-muted">{n.description}</p>
            <div className="mt-3 text-[11px] text-fg-faint">
              {n.blocks.length} blocks · {n.author} · {n.updatedAt}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function NotebookDetail({ notebook, onBack }: { notebook: Notebook; onBack: () => void }) {
  return (
    <div className="ds-fade flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-5">
        <button
          onClick={onBack}
          className="ds-focus-ring text-fg-muted hover:text-fg"
          title="Back to notebooks"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h1 className="text-[15px] font-semibold text-fg">{notebook.title}</h1>
        <Badge tone="muted">
          {notebook.author} · {notebook.updatedAt}
        </Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex max-w-3xl flex-col gap-4">
          {notebook.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Block({ block }: { block: NotebookBlock }) {
  if (block.type === 'markdown') {
    return <p className="text-[13px] leading-relaxed text-fg-light">{renderInline(block.text)}</p>
  }
  if (block.type === 'metric') {
    return (
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[12px] text-fg-muted">{block.label}</div>
            <div className="mt-0.5 text-2xl font-semibold text-fg">
              {block.value}
              {block.unit && (
                <span className="ml-1 text-[12px] font-normal text-fg-muted">{block.unit}</span>
              )}
            </div>
          </div>
          <Sparkline data={block.series} />
        </div>
      </Card>
    )
  }
  if (block.type === 'logs') {
    return (
      <div>
        <SectionLabel>Logs · {block.label}</SectionLabel>
        <div className="overflow-hidden rounded-md border border-border font-mono text-[12px]">
          {block.rows.slice(0, 8).map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-3 border-b border-border/60 px-3 py-1.5 last:border-0"
            >
              <span className="text-fg-faint">{r.ts}</span>
              <span
                className={
                  r.level === 'error'
                    ? 'text-red'
                    : r.level === 'warn'
                      ? 'text-amber'
                      : 'text-fg-muted'
                }
              >
                {r.level.toUpperCase()}
              </span>
              <span className="text-blue">{r.service}</span>
              <span className="flex-1 text-fg-light">{r.message}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  // query
  return (
    <div>
      <SectionLabel>Query</SectionLabel>
      <SqlBlock sql={block.sql} />
      <div className="mt-2 overflow-hidden rounded-md border border-border text-[12px]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-panel text-left text-fg-muted">
              {block.columns.map((c) => (
                <th key={c} className="px-3 py-1.5 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {block.rows.map((row, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 text-fg-light">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Minimal **bold** support for markdown blocks. */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**'))
      return (
        <strong key={i} className="text-fg">
          {p.slice(2, -2)}
        </strong>
      )
    if (p.startsWith('`'))
      return (
        <code key={i} className="rounded bg-overlay px-1 text-brand">
          {p.slice(1, -1)}
        </code>
      )
    return <span key={i}>{p}</span>
  })
}
