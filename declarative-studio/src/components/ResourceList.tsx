import {
  ChevronDown,
  ChevronRight,
  NotebookText,
  Plus,
  Rows3,
  ScrollText,
  Search,
  SlidersHorizontal,
  Star,
  TerminalSquare,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'

import { ensureBucketResource, resources } from '../model/registry'
import { buckets } from '../model/surfaces'
import type { Resource } from '../model/types'
import { useStudio, type CollectionId } from '../state/store'
import { kindIcon } from './icons'

const CAP = 5

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  active: boolean
  onOpen: () => void
}
interface CollectionData {
  label: string
  createKind?: string
  total: number
  showAll: () => void
  active: boolean
  items: NavItem[]
}

/*
 * Sidebar: a small group of bespoke tools (Table Editor, SQL Editor, Logs,
 * Settings), then the resource AREAS — soft text headings that enumerate their
 * items. Favorites of each kind float to the top of their own section. Headings
 * show a count that swaps to a "+" on hover for in-context create.
 */
export function ResourceList() {
  const {
    resource,
    surface,
    pinned,
    notebooks,
    select,
    openSurface,
    togglePin,
    setPaletteOpen,
    openCreate,
  } = useStudio()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const isHere = (id: string) => !surface && resource.id === id
  const onCollection = (c: CollectionId) =>
    surface?.id === 'collection' && surface.params?.collection === c
  const resItems = (predicate: (r: Resource) => boolean): NavItem[] =>
    resources.filter(predicate).map((r) => ({
      id: r.id,
      label: r.qualified,
      icon: kindIcon(r.kind),
      active: isHere(r.id),
      onOpen: () => select(r.id),
    }))

  const tools: Array<{ label: string; icon: LucideIcon; active: boolean; go: () => void }> = [
    {
      label: 'Table Editor',
      icon: Rows3,
      active: surface?.id === 'table-editor',
      go: () => openSurface('table-editor', { resourceId: 'public.events' }),
    },
    {
      label: 'SQL Editor',
      icon: TerminalSquare,
      active: surface?.id === 'sql',
      go: () => openSurface('sql'),
    },
    {
      label: 'Logs',
      icon: ScrollText,
      active: surface?.id === 'logs',
      go: () => openSurface('logs'),
    },
    {
      label: 'Settings',
      icon: SlidersHorizontal,
      active: !surface && resource.id === 'config.toml',
      go: () => select('config.toml'),
    },
  ]

  const collections: CollectionData[] = [
    {
      label: 'Tables',
      createKind: 'table',
      total: resources.filter((r) => r.kind === 'table' && r.category === 'Database').length,
      showAll: () => openSurface('tables'),
      active: surface?.id === 'tables',
      items: resItems((r) => r.kind === 'table' && r.category === 'Database'),
    },
    {
      label: 'File Buckets',
      createKind: 'bucket',
      total: buckets.length,
      showAll: () => openSurface('collection', { collection: 'buckets' }),
      active: onCollection('buckets'),
      items: buckets.map((b) => ({
        id: `bucket.${b.name}`,
        label: b.name,
        icon: kindIcon('bucket'),
        active: isHere(`bucket.${b.name}`),
        onOpen: () => select(ensureBucketResource(b.name)),
      })),
    },
    {
      label: 'Policies',
      createKind: 'policy',
      total: resources.filter((r) => r.kind === 'policy').length,
      showAll: () => openSurface('collection', { collection: 'policies' }),
      active: onCollection('policies'),
      items: resItems((r) => r.kind === 'policy'),
    },
    {
      label: 'Email Templates',
      total: resources.filter((r) => r.kind === 'auth-template').length,
      showAll: () => openSurface('collection', { collection: 'templates' }),
      active: onCollection('templates'),
      items: resItems((r) => r.kind === 'auth-template'),
    },
    {
      label: 'Edge Functions',
      createKind: 'edge-function',
      total: resources.filter((r) => r.category === 'Edge Functions').length,
      showAll: () => openSurface('collection', { collection: 'functions' }),
      active: onCollection('functions'),
      items: resItems((r) => r.category === 'Edge Functions'),
    },
    {
      label: 'Notebooks',
      createKind: 'notebook',
      total: notebooks.length,
      showAll: () => openSurface('notebooks'),
      active: surface?.id === 'notebooks',
      items: notebooks.map((n) => ({
        id: n.id,
        label: n.title,
        icon: NotebookText,
        active: surface?.id === 'notebooks' && surface.params?.notebookId === n.id,
        onOpen: () => openSurface('notebooks', { notebookId: n.id }),
      })),
    },
  ]

  return (
    <nav className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPaletteOpen(true)}
          className="ds-focus-ring flex flex-1 items-center gap-2 rounded-md border border-border bg-panel px-2 py-1.5 text-[12px] text-fg-muted hover:bg-elevated hover:text-fg-light"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded bg-elevated px-1 text-[10px] text-fg-faint">⌘K</kbd>
        </button>
        <button
          onClick={() => openCreate()}
          title="Create new… (⌘N)"
          className="ds-focus-ring grid size-7 shrink-0 place-items-center rounded-md border border-border bg-panel text-fg-muted hover:bg-elevated hover:text-fg"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <ul className="flex flex-col gap-px">
        {tools.map((t) => (
          <LinkRow key={t.label} label={t.label} icon={t.icon} active={t.active} onClick={t.go} />
        ))}
      </ul>

      <div className="flex flex-col gap-1.5">
        {collections.map((c) => (
          <CollectionSection
            key={c.label}
            section={c}
            pinned={pinned}
            collapsed={!!collapsed[c.label]}
            onToggle={() => setCollapsed((s) => ({ ...s, [c.label]: !s[c.label] }))}
            onCreate={c.createKind ? () => openCreate(c.createKind) : undefined}
            onTogglePin={togglePin}
          />
        ))}
      </div>
    </nav>
  )
}

function LinkRow({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`ds-focus-ring flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-100 ${
          active ? 'bg-elevated text-fg' : 'text-fg-light hover:bg-panel hover:text-fg'
        }`}
      >
        <Icon className={`size-3.5 shrink-0 ${active ? 'text-brand' : 'text-fg-muted'}`} />
        {label}
      </button>
    </li>
  )
}

function CollectionSection({
  section,
  pinned,
  collapsed,
  onToggle,
  onCreate,
  onTogglePin,
}: {
  section: CollectionData
  pinned: string[]
  collapsed: boolean
  onToggle: () => void
  onCreate?: () => void
  onTogglePin: (id: string) => void
}) {
  // Favorites of this kind float to the top.
  const sorted = [...section.items].sort(
    (a, b) => Number(pinned.includes(b.id)) - Number(pinned.includes(a.id))
  )
  const shown = sorted.slice(0, CAP)
  const hasMore = section.total > shown.length

  return (
    <div>
      <div className="group/sec flex items-center px-2 py-0.5">
        <button
          onClick={onToggle}
          className="ds-focus-ring flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-fg-faint hover:text-fg-muted"
        >
          <span>{section.label}</span>
          {collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        <div className="flex-1" />
        {/* Count and + share one fixed-size box so the hover swap never shifts layout. */}
        <span className="relative grid size-4 shrink-0 place-items-center">
          <span
            className={`text-[10px] text-fg-faint ${onCreate ? 'group-hover/sec:opacity-0' : ''}`}
          >
            {section.total}
          </span>
          {onCreate && (
            <button
              onClick={onCreate}
              title={`New in ${section.label}`}
              className="ds-focus-ring absolute inset-0 grid place-items-center rounded text-fg-muted opacity-0 hover:text-fg group-hover/sec:opacity-100"
            >
              <Plus className="size-3" />
            </button>
          )}
        </span>
      </div>

      {!collapsed && (
        <ul className="flex flex-col gap-px">
          {shown.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              pinned={pinned.includes(it.id)}
              onTogglePin={() => onTogglePin(it.id)}
            />
          ))}
          {hasMore && (
            <li>
              <button
                onClick={section.showAll}
                className="ds-focus-ring px-2 py-1 pl-3 text-left text-[12px] text-fg-muted hover:text-brand"
              >
                Show all {section.total} →
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function ItemRow({
  item,
  pinned,
  onTogglePin,
}: {
  item: NavItem
  pinned: boolean
  onTogglePin: () => void
}) {
  const Icon = item.icon
  return (
    <li className="group/row relative">
      <button
        onClick={item.onOpen}
        className={`ds-focus-ring flex w-full items-center gap-2 rounded-md py-1 pl-2 pr-7 text-left text-[13px] transition-colors duration-100 ${
          item.active ? 'bg-elevated text-fg' : 'text-fg-light hover:bg-panel hover:text-fg'
        }`}
      >
        <Icon className={`size-3.5 shrink-0 ${item.active ? 'text-brand' : 'text-fg-muted'}`} />
        <span className="truncate">{item.label}</span>
      </button>
      <button
        onClick={onTogglePin}
        title={pinned ? 'Unpin' : 'Pin to top'}
        className={`ds-focus-ring absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 transition-opacity ${
          pinned
            ? 'text-brand opacity-100'
            : 'text-fg-faint opacity-0 hover:text-fg group-hover/row:opacity-100'
        }`}
      >
        <Star className="size-3" fill={pinned ? 'currentColor' : 'none'} />
      </button>
    </li>
  )
}
