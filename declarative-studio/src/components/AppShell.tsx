import { ChevronsUpDown, GitBranch, GitCompare, PanelRightOpen } from 'lucide-react'
import { useEffect } from 'react'

import { useStudio } from '../state/store'
import { CommandPalette } from './CommandPalette'
import { CreateDialog } from './CreateDialog'
import { InspectorPanel } from './InspectorPanel'
import { ModelDrawer } from './ModelDrawer'
import { ResourceDetail } from './ResourceDetail'
import { ResourceList } from './ResourceList'
import { ReviewDrawer } from './ReviewDrawer'
import { SupabaseLogo } from './SupabaseLogo'
import { SurfaceView } from './SurfaceView'

/*
 * The shell: top bar / sidebar / main / inspector / model drawer. The top bar
 * carries the two nods (a static branch switcher + "diff vs main") without
 * making branches the primary IA — resource navigation stays primary.
 */
export function AppShell() {
  const {
    resource,
    projection,
    surface,
    modelOpen,
    toggleModel,
    setProjection,
    setPaletteOpen,
    openCreate,
  } = useStudio()

  // Keyboard layer — the Linear feel. ⌘K palette, \ model drawer, [ ] / 1-9 projections.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA'
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        openCreate()
        return
      }
      if (typing) return
      if (e.key === '\\') {
        e.preventDefault()
        toggleModel()
      } else if (!surface && (e.key === '[' || e.key === ']')) {
        const list = resource.projections
        const idx = list.findIndex((p) => p.type === projection.type)
        const next = e.key === ']' ? (idx + 1) % list.length : (idx - 1 + list.length) % list.length
        setProjection(list[next].type)
      } else if (!surface && /^[1-9]$/.test(e.key)) {
        const p = resource.projections[Number(e.key) - 1]
        if (p) setProjection(p.type)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [resource, projection, surface, toggleModel, setProjection, setPaletteOpen, openCreate])

  return (
    <div className="flex h-full flex-col">
      <TopBar modelOpen={modelOpen} onToggleModel={toggleModel} />
      <div className="flex min-h-0 flex-1">
        <div className="w-60 shrink-0 border-r border-border">
          <ResourceList />
        </div>
        {surface ? (
          <div className="flex h-full min-w-0 flex-1 flex-col">
            <SurfaceView surface={surface} />
          </div>
        ) : (
          <ResourceDetail />
        )}
        {!surface && <InspectorPanel resource={resource} />}
        <ModelDrawer />
        <ReviewDrawer />
      </div>
      <CommandPalette />
      <CreateDialog />
    </div>
  )
}

function TopBar({ modelOpen, onToggleModel }: { modelOpen: boolean; onToggleModel: () => void }) {
  const { pendingChanges, reviewOpen, toggleReview } = useStudio()
  const totalChanges = pendingChanges.reduce((n, c) => n + c.diff.changes.length, 0)
  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border px-3">
      <div className="flex items-center gap-2 pr-1">
        <SupabaseLogo className="size-[18px] shrink-0" />
        <span className="text-[13px] font-semibold text-fg">Studio</span>
      </div>

      {/* Branch nod — static. Branches are a later slice, not primary IA here. */}
      <button
        className="ds-focus-ring flex items-center gap-1.5 rounded-md border border-border bg-panel px-2 py-1 text-[12px] text-fg-light hover:bg-elevated"
        title="Branch switcher (nod) — branches as primary IA is a later slice"
      >
        <GitBranch className="size-3.5 text-fg-muted" />
        main
        <ChevronsUpDown className="size-3 text-fg-faint" />
      </button>

      <div className="flex-1" />

      {pendingChanges.length > 0 && (
        <button
          onClick={toggleReview}
          title="Review unsaved changes"
          className={`ds-focus-ring flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] font-medium transition-colors ${
            reviewOpen
              ? 'border-brand bg-brand text-brand-fg'
              : 'border-brand-dim bg-brand-dim/30 text-brand hover:bg-brand-dim/50'
          }`}
        >
          <GitCompare className="size-3.5" />
          {totalChanges} unsaved
        </button>
      )}
      <button
        onClick={onToggleModel}
        className={`ds-focus-ring flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] transition-colors ${
          modelOpen
            ? 'border-brand-dim bg-brand-dim/30 text-brand'
            : 'border-border bg-panel text-fg-light hover:bg-elevated'
        }`}
        title="Toggle Model drawer (\)"
      >
        <PanelRightOpen className="size-3.5" />
        Model
        <kbd className="ml-0.5 rounded bg-elevated px-1 text-[10px] text-fg-faint">\</kbd>
      </button>
    </header>
  )
}
