import type { Projection, Resource } from '../model/types'
import { FieldTable } from './renderers/FieldTable'
import { KeyValuePanel } from './renderers/KeyValuePanel'
import { RelationPanel } from './renderers/RelationPanel'
import { SignalPanel } from './renderers/SignalPanel'

/*
 * The dispatcher: given a projection, mount the named generic renderer. This is
 * the whole "render projections of the model" idea in one switch — there are no
 * per-page components anywhere.
 */
export function ProjectionView({
  resource,
  projection,
}: {
  resource: Resource
  projection: Projection
}) {
  const props = { resource, projection }
  switch (projection.renderer) {
    case 'FieldTable':
      return <FieldTable {...props} />
    case 'SignalPanel':
      return <SignalPanel {...props} />
    case 'KeyValuePanel':
      return <KeyValuePanel {...props} />
    case 'RelationPanel':
      return <RelationPanel {...props} />
    default:
      return null
  }
}
