import { Star } from 'lucide-react'

import { useStudio } from '../state/store'
import { ActionBar } from './ActionBar'
import { EditView } from './EditView'
import { kindIcon, kindLabel } from './icons'
import { Badge } from './primitives'
import { ProjectionView } from './ProjectionView'
import { ResourceTabs } from './ResourceTabs'
import { storageSummaryForResource } from './storageSummary'

/*
 * The main area. Header (name, kind, description) + ActionBar + tab bar + the
 * active projection. Every resource gets exactly this grammar — the consistency
 * across resources is the user-facing proof that the model is shared.
 */
export function ResourceDetail() {
  const { resource, projection, editing, pinned, togglePin, setProjection } = useStudio()
  const Icon = kindIcon(resource.kind)
  const isPinned = pinned.includes(resource.id)
  const storageLabel = storageSummaryForResource(resource)

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex flex-col gap-3 px-4 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md border border-border bg-panel">
              <Icon className="size-4.5 text-brand" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-[15px] font-semibold text-fg">
                  {resource.qualified}
                </h1>
                <Badge tone="muted">{kindLabel(resource.kind)}</Badge>
                {storageLabel && (
                  <button
                    type="button"
                    onClick={() => setProjection('storage')}
                    className="ds-focus-ring"
                    title="Open Storage tab"
                  >
                    <Badge tone="brand">{storageLabel}</Badge>
                  </button>
                )}
                <button
                  onClick={() => togglePin(resource.id)}
                  title={isPinned ? 'Unpin from sidebar' : 'Pin to sidebar'}
                  className={`ds-focus-ring rounded p-0.5 ${isPinned ? 'text-brand' : 'text-fg-faint hover:text-fg'}`}
                >
                  <Star className="size-3.5" fill={isPinned ? 'currentColor' : 'none'} />
                </button>
              </div>
              {resource.description && (
                <p className="mt-0.5 max-w-2xl text-[13px] text-fg-muted">{resource.description}</p>
              )}
            </div>
          </div>
        </div>
        <ActionBar resource={resource} />
      </header>

      {!editing && (
        <div className="mt-3">
          <ResourceTabs />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {editing ? (
          <EditView resource={resource} />
        ) : (
          <div className="ds-fade" key={`${resource.id}:${projection.type}`}>
            {projection.hint && (
              <p className="mb-3 flex items-center gap-1.5 text-[12px] text-fg-muted">
                <span className="size-1.5 rounded-full bg-brand" />
                {projection.hint}
              </p>
            )}
            <ProjectionView resource={resource} projection={projection} />
          </div>
        )}
      </div>
    </div>
  )
}
