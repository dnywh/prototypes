import type { SurfaceNav } from '../state/store'
import { CollectionSurface } from './surfaces/CollectionSurface'
import { LogsSurface } from './surfaces/LogsSurface'
import { NotebooksSurface } from './surfaces/NotebooksSurface'
import { SqlEditorSurface } from './surfaces/SqlEditorSurface'
import { TableEditorSurface } from './surfaces/TableEditorSurface'
import { TablesSurface } from './surfaces/TablesSurface'

/*
 * Dispatches the bespoke surfaces. These are NOT projections of a resource —
 * they're hand-built cross-cutting tools, which is why each one is badged
 * bespoke and the Model drawer has nothing to show for them.
 */
export function SurfaceView({ surface }: { surface: SurfaceNav }) {
  switch (surface.id) {
    case 'tables':
      return <TablesSurface />
    case 'logs':
      return <LogsSurface resourceId={surface.params?.resourceId} />
    case 'notebooks':
      return <NotebooksSurface notebookId={surface.params?.notebookId} />
    case 'sql':
      return <SqlEditorSurface />
    case 'collection':
      return <CollectionSurface collection={surface.params?.collection ?? 'policies'} />
    case 'table-editor':
      return (
        <TableEditorSurface
          resourceId={surface.params?.resourceId}
          tableKey={surface.params?.tableKey}
        />
      )
    default:
      return null
  }
}
