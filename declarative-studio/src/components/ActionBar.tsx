import {
  ArrowRightLeft,
  Pencil,
  Plug,
  Rows3,
  ScrollText,
  Share2,
  Trash2,
  Unplug,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'

import { isEditable } from '../edit/editing'
import type { Action, Resource } from '../model/types'
import { useStudio } from '../state/store'
import { Button, SqlBlock } from './primitives'

const actionIcon: Record<string, LucideIcon> = {
  edit: Pencil,
  create: Pencil,
  delete: Trash2,
  attach: Plug,
  connect: Plug,
  detach: Unplug,
  migrate: ArrowRightLeft,
  'view-logs': ScrollText,
  open: Rows3,
  share: Share2,
}

/*
 * Renders resource.actions as buttons. The prototype never mutates — clicking an
 * action with a `preview` reveals what it WOULD do (SQL / note). The disabled
 * "Share to marketplace" action is the extensibility nod.
 */
export function ActionBar({ resource }: { resource: Resource }) {
  const { beginEdit, openSurface } = useStudio()
  const [active, setActive] = useState<Action | null>(null)
  const actions = resource.actions ?? []
  if (actions.length === 0) return null

  const handle = (action: Action) => {
    // Edit actions open the staged-edit form.
    if ((action.kind === 'edit' || action.kind === 'create') && isEditable(resource)) {
      beginEdit()
      return
    }
    // Cross-cutting actions jump to a bespoke surface, pre-scoped to this resource.
    if (action.kind === 'view-logs') {
      openSurface('logs', { resourceId: resource.id })
      return
    }
    if (action.kind === 'open') {
      openSurface('table-editor', { resourceId: resource.id })
      return
    }
    if (action.preview) setActive(active?.id === action.id ? null : action)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {actions.map((action) => {
          const Icon = actionIcon[action.kind] ?? Pencil
          return (
            <Button
              key={action.id}
              intent={action.intent}
              disabled={action.disabled}
              title={action.description}
              onClick={() => handle(action)}
            >
              <Icon className="size-3.5" />
              {action.label}
            </Button>
          )
        })}
      </div>

      {active?.preview && (
        <div className="ds-fade mt-3 rounded-md border border-border bg-overlay p-3">
          <div className="mb-2 text-[12px] text-fg-light">
            <span className="text-fg-muted">Preview · </span>
            {active.preview.note ?? `Running "${active.label}" would execute:`}
          </div>
          {active.preview.sql && <SqlBlock sql={active.preview.sql} />}
        </div>
      )}
    </div>
  )
}
