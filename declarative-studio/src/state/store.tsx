/*
 * One tiny store. Holds navigation (selected resource + active projection), the
 * Model-drawer and command-palette toggles, and the staged-edit state. Committed
 * edits live as `overrides` keyed by resource id, applied on top of the base
 * declaration — so Apply mutates the live model and every projection updates.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import {
  applyResourcePending,
  applyResourcePendingDisplay,
  computeDiff,
  initDraft,
  isResourcePendingEmpty,
  mergeResourcePending,
  type DiffResult,
  type Draft,
  type ResourcePending,
  type WarehouseAction,
} from '../edit/editing'
import { getResource, resources } from '../model/registry'
import { notebooks as seedNotebooks, type Notebook, type NotebookBlock } from '../model/surfaces'
import type { Projection, Resource } from '../model/types'

export interface PendingChange {
  id: string
  resourceId: string
  label: string
  kind: Resource['kind']
  diff: DiffResult
  projection?: string
}

export type SurfaceId = 'tables' | 'logs' | 'notebooks' | 'table-editor' | 'sql' | 'collection'
export type CollectionId = 'policies' | 'templates' | 'functions' | 'buckets'
export interface SurfaceNav {
  id: SurfaceId
  params?: {
    resourceId?: string
    notebookId?: string
    tableKey?: string
    collection?: CollectionId
  }
}

interface StudioState {
  resource: Resource
  projection: Projection
  modelOpen: boolean
  paletteOpen: boolean
  select: (resourceId: string, projectionType?: string) => void
  setProjection: (projectionType: string) => void
  toggleModel: () => void
  setPaletteOpen: (open: boolean) => void
  resolveResource: (resourceId: string) => Resource | undefined
  surface: SurfaceNav | null
  openSurface: (id: SurfaceId, params?: SurfaceNav['params']) => void
  closeSurface: () => void
  notebooks: Notebook[]
  saveToNotebook: (title: string, block: NotebookBlock) => void
  pinned: string[]
  togglePin: (id: string) => void
  creating: { kind: string | null } | null
  openCreate: (kind?: string) => void
  closeCreate: () => void
  editing: boolean
  draft: Draft | null
  beginEdit: () => void
  setDraft: (draft: Draft) => void
  doneEdit: () => void
  cancelEdit: () => void
  setConfigValue: (resourceId: string, key: string, value: string | number | boolean) => void
  stageWarehouseAction: (resourceId: string, action: WarehouseAction) => void
  pendingChanges: PendingChange[]
  saveAll: () => void
  discardAll: () => void
  discardChange: (id: string) => void
  reviewOpen: boolean
  toggleReview: () => void
  setReviewOpen: (open: boolean) => void
}

const StudioContext = createContext<StudioState | null>(null)

let idCounter = 1

function resolveFrom(
  id: string,
  committed: Record<string, ResourcePending>,
  pending: Record<string, ResourcePending>
): Resource | undefined {
  const base = getResource(id)
  if (!base) return undefined
  let r = applyResourcePending(base, committed[id] ?? {})
  r = applyResourcePendingDisplay(r, pending[id] ?? {})
  return r
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [resourceId, setResourceId] = useState<string>(resources[0].id)
  const [projectionType, setProjectionType] = useState<string>(resources[0].projections[0].type)
  const [modelOpen, setModelOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [committed, setCommitted] = useState<Record<string, ResourcePending>>({})
  const [pending, setPending] = useState<Record<string, ResourcePending>>({})
  const [reviewOpen, setReviewOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraftState] = useState<Draft | null>(null)
  const [surface, setSurface] = useState<SurfaceNav | null>(null)
  const [notebooks, setNotebooks] = useState<Notebook[]>(seedNotebooks)
  const [pinned, setPinned] = useState<string[]>(['public.events'])
  const [creating, setCreating] = useState<{ kind: string | null } | null>(null)

  const resolve = useCallback(
    (id: string) => resolveFrom(id, committed, pending),
    [committed, pending]
  )

  const resource = resolve(resourceId) ?? resources[0]
  const projection =
    resource.projections.find((p) => p.type === projectionType) ?? resource.projections[0]
  const editing = editingId === resourceId && draft != null

  const select = useCallback((nextId: string, nextProjection?: string) => {
    const next = getResource(nextId)
    if (!next) return
    setEditingId(null)
    setDraftState(null)
    setSurface(null)
    setResourceId(nextId)
    setProjectionType(nextProjection ?? next.projections[0].type)
  }, [])

  const togglePin = useCallback((id: string) => {
    setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }, [])

  const openCreate = useCallback((kind?: string) => setCreating({ kind: kind ?? null }), [])
  const closeCreate = useCallback(() => setCreating(null), [])

  const setProjection = useCallback((type: string) => setProjectionType(type), [])

  const toggleModel = useCallback(() => {
    setModelOpen((v) => !v)
    setReviewOpen(false)
  }, [])
  const toggleReview = useCallback(() => {
    setReviewOpen((v) => !v)
    setModelOpen(false)
  }, [])

  const openSurface = useCallback((id: SurfaceId, params?: SurfaceNav['params']) => {
    setEditingId(null)
    setDraftState(null)
    setSurface({ id, params })
  }, [])
  const closeSurface = useCallback(() => setSurface(null), [])

  const saveToNotebook = useCallback((title: string, block: NotebookBlock) => {
    const id = `nb.${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${idCounter++}`
    const notebook: Notebook = {
      id,
      title,
      description: 'Saved from an exploration.',
      updatedAt: 'just now',
      author: 'you',
      blocks: [
        {
          type: 'markdown',
          text: 'Promoted from an ephemeral query into a durable, shareable notebook.',
        },
        block,
      ],
    }
    setNotebooks((list) => [notebook, ...list])
    setSurface({ id: 'notebooks', params: { notebookId: id } })
  }, [])

  const beginEdit = useCallback(() => {
    const current = resolve(resourceId)
    if (!current) return
    setEditingId(resourceId)
    setDraftState(initDraft(current))
  }, [resourceId, resolve])

  const setDraft = useCallback(
    (next: Draft) => {
      setDraftState(next)
      if (!editingId) return
      setPending((p) => {
        const cur = p[editingId] ?? {}
        if (next.kind === 'table') return { ...p, [editingId]: { ...cur, table: next } }
        if (next.kind === 'policy') return { ...p, [editingId]: { ...cur, policy: next } }
        return p
      })
    },
    [editingId]
  )

  const doneEdit = useCallback(() => {
    setEditingId(null)
    setDraftState(null)
  }, [])

  const cancelEdit = useCallback(() => {
    if (editingId && draft) {
      setPending((p) => {
        const cur = p[editingId]
        if (!cur) return p
        const nextPart = { ...cur }
        if (draft.kind === 'table') delete nextPart.table
        if (draft.kind === 'policy') delete nextPart.policy
        const next = { ...p }
        if (isResourcePendingEmpty(nextPart)) delete next[editingId]
        else next[editingId] = nextPart
        return next
      })
    }
    setEditingId(null)
    setDraftState(null)
  }, [editingId, draft])

  const setConfigValue = useCallback(
    (resourceId: string, key: string, value: string | number | boolean) => {
      setPending((p) => {
        const base = getResource(resourceId)
        const existing = p[resourceId]?.config
        const current =
          existing ??
          (() => {
            const fromCommitted = committed[resourceId]?.config
            if (fromCommitted) return fromCommitted
            return base ? (initDraft(base) as Extract<Draft, { kind: 'config' }>) : null
          })()
        if (!current || current.kind !== 'config') return p
        return {
          ...p,
          [resourceId]: {
            ...p[resourceId],
            config: { kind: 'config', values: { ...current.values, [key]: value } },
          },
        }
      })
    },
    [committed]
  )

  const stageWarehouseAction = useCallback((resourceId: string, action: WarehouseAction) => {
    setPending((p) => ({
      ...p,
      [resourceId]: {
        ...p[resourceId],
        warehouse: { kind: 'warehouse', action },
      },
    }))
    setReviewOpen(true)
  }, [])

  const pendingChanges = useMemo<PendingChange[]>(() => {
    const out: PendingChange[] = []
    for (const id of Object.keys(pending)) {
      const base = getResource(id)
      if (!base) continue
      const p = pending[id]!
      const before = applyResourcePending(base, committed[id] ?? {})

      if (p.config) {
        const diff = computeDiff(before, p.config)
        if (diff.changes.length > 0) {
          out.push({
            id: `${id}:config`,
            resourceId: id,
            label: `${base.qualified} · settings`,
            kind: base.kind,
            diff,
            projection: 'config',
          })
        }
      }
      if (p.policy) {
        const diff = computeDiff(before, p.policy)
        if (diff.changes.length > 0) {
          out.push({
            id: `${id}:policy`,
            resourceId: id,
            label: `${base.qualified} · policy`,
            kind: base.kind,
            diff,
            projection: 'schema',
          })
        }
      }
      if (p.table) {
        const diff = computeDiff(before, p.table)
        if (diff.changes.length > 0) {
          out.push({
            id: `${id}:table`,
            resourceId: id,
            label: `${base.qualified} · schema`,
            kind: base.kind,
            diff,
            projection: 'schema',
          })
        }
      }
      if (p.warehouse) {
        const diff = computeDiff(before, p.warehouse)
        if (diff.changes.length > 0) {
          out.push({
            id: `${id}:warehouse`,
            resourceId: id,
            label: `${base.qualified} · storage`,
            kind: base.kind,
            diff,
            projection: 'storage',
          })
        }
      }
    }
    return out
  }, [pending, committed])

  const saveAll = useCallback(() => {
    setCommitted((c) => {
      const next = { ...c }
      for (const [id, p] of Object.entries(pending)) {
        if (isResourcePendingEmpty(p)) continue
        next[id] = mergeResourcePending(c[id], p)
      }
      return next
    })
    setPending({})
    setReviewOpen(false)
  }, [pending])

  const discardAll = useCallback(() => {
    setPending({})
    setReviewOpen(false)
  }, [])

  const discardChange = useCallback((changeId: string) => {
    const sep = changeId.lastIndexOf(':')
    if (sep === -1) return
    const resourceId = changeId.slice(0, sep)
    const part = changeId.slice(sep + 1) as keyof ResourcePending

    setPending((p) => {
      const cur = p[resourceId]
      if (!cur) return p
      const nextPart = { ...cur }
      delete nextPart[part]
      const next = { ...p }
      if (isResourcePendingEmpty(nextPart)) delete next[resourceId]
      else next[resourceId] = nextPart
      return next
    })
  }, [])

  const value = useMemo<StudioState>(
    () => ({
      resource,
      projection,
      modelOpen,
      paletteOpen,
      select,
      setProjection,
      toggleModel,
      setPaletteOpen,
      resolveResource: resolve,
      surface,
      openSurface,
      closeSurface,
      notebooks,
      saveToNotebook,
      pinned,
      togglePin,
      creating,
      openCreate,
      closeCreate,
      editing,
      draft: editing ? draft : null,
      beginEdit,
      setDraft,
      doneEdit,
      cancelEdit,
      setConfigValue,
      stageWarehouseAction,
      pendingChanges,
      saveAll,
      discardAll,
      discardChange,
      reviewOpen,
      toggleReview,
      setReviewOpen,
    }),
    [
      resource,
      projection,
      modelOpen,
      paletteOpen,
      select,
      setProjection,
      toggleModel,
      resolve,
      surface,
      openSurface,
      closeSurface,
      notebooks,
      saveToNotebook,
      pinned,
      togglePin,
      creating,
      openCreate,
      closeCreate,
      editing,
      draft,
      beginEdit,
      setDraft,
      doneEdit,
      cancelEdit,
      setConfigValue,
      stageWarehouseAction,
      pendingChanges,
      saveAll,
      discardAll,
      discardChange,
      reviewOpen,
      toggleReview,
    ]
  )

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

export function useStudio(): StudioState {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error('useStudio must be used within StudioProvider')
  return ctx
}
