import {
  Box,
  CornerDownLeft,
  FunctionSquare,
  Mail,
  NotebookText,
  Rows3,
  ScrollText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Table2,
  TerminalSquare,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { resources } from '../model/registry'
import { useStudio } from '../state/store'
import { kindIcon, kindLabel } from './icons'

/*
 * ⌘K palette. Jump to any resource, any projection, or a bespoke surface. The
 * whole project is reachable in two keystrokes — the Linear-feel answer to scale
 * (you don't scroll a sidebar of hundreds, you search). Pure mock, so instant.
 */
interface Entry {
  id: string
  label: string
  sub: string
  icon: LucideIcon
  run: () => void
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, select, openSurface } = useStudio()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  const entries = useMemo<Entry[]>(() => {
    const out: Entry[] = []
    // Surfaces first — the cross-cutting tools.
    const push = (id: string, label: string, sub: string, icon: LucideIcon, run: () => void) =>
      out.push({ id, label, sub, icon, run })
    // Tools / bespoke surfaces.
    push('s:table-editor', 'Table Editor', 'Tool · bespoke', Rows3, () =>
      openSurface('table-editor', { resourceId: 'public.events' })
    )
    push('s:sql', 'SQL Editor', 'Tool · bespoke', TerminalSquare, () => openSurface('sql'))
    push('s:logs', 'Logs', 'Tool · bespoke', ScrollText, () => openSurface('logs'))
    push('s:notebooks', 'Notebooks', 'Tool · bespoke', NotebookText, () => openSurface('notebooks'))
    push('s:settings', 'Settings', 'config.toml', SlidersHorizontal, () => select('config.toml'))
    // Resource areas.
    push('s:tables', 'Tables', 'Area · all schemas', Table2, () => openSurface('tables'))
    push('s:buckets', 'File Buckets', 'Area · storage', Box, () =>
      openSurface('collection', { collection: 'buckets' })
    )
    push('s:policies', 'Policies', 'Area · RLS', ShieldCheck, () =>
      openSurface('collection', { collection: 'policies' })
    )
    push('s:templates', 'Email Templates', 'Area · auth', Mail, () =>
      openSurface('collection', { collection: 'templates' })
    )
    push('s:functions', 'Edge Functions', 'Area · functions', FunctionSquare, () =>
      openSurface('collection', { collection: 'functions' })
    )
    for (const r of resources) {
      out.push({
        id: r.id,
        label: r.qualified,
        sub: kindLabel(r.kind),
        icon: kindIcon(r.kind),
        run: () => select(r.id),
      })
      for (const p of r.projections) {
        out.push({
          id: `${r.id}:${p.type}`,
          label: `${r.name} → ${p.label}`,
          sub: `${kindLabel(r.kind)} · ${p.generated ? 'generated' : 'bespoke'}`,
          icon: kindIcon(r.kind),
          run: () => select(r.id, p.type),
        })
      }
    }
    return out
  }, [select, openSurface])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries.slice(0, 8)
    return entries.filter((e) => (e.label + e.sub).toLowerCase().includes(q)).slice(0, 10)
  }, [query, entries])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    if (!paletteOpen) {
      setQuery('')
      setCursor(0)
    }
  }, [paletteOpen])

  if (!paletteOpen) return null

  const choose = (entry?: Entry) => {
    if (!entry) return
    entry.run()
    setPaletteOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[12vh]"
      onClick={() => setPaletteOpen(false)}
    >
      <div
        className="ds-fade w-[560px] max-w-[92vw] overflow-hidden rounded-xl border border-border-strong bg-overlay shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-fg-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setCursor((c) => Math.min(c + 1, filtered.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setCursor((c) => Math.max(c - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                choose(filtered[cursor])
              } else if (e.key === 'Escape') {
                setPaletteOpen(false)
              }
            }}
            placeholder="Go to resource or projection…"
            className="h-11 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-faint"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {filtered.map((entry, i) => {
            const Icon = entry.icon
            const active = i === cursor
            return (
              <li key={entry.id}>
                <button
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => choose(entry)}
                  className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-[13px] ${active ? 'bg-elevated text-fg' : 'text-fg-light'}`}
                >
                  <Icon className={`size-4 shrink-0 ${active ? 'text-brand' : 'text-fg-muted'}`} />
                  <span className="flex-1 truncate">{entry.label}</span>
                  <span className="text-[11px] text-fg-faint">{entry.sub}</span>
                  {active && <CornerDownLeft className="size-3.5 text-fg-muted" />}
                </button>
              </li>
            )
          })}
          {filtered.length === 0 && (
            <li className="px-2.5 py-6 text-center text-[13px] text-fg-muted">No matches.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
