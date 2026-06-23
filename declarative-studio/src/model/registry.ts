/*
 * The registry collects every declared resource and indexes the graph. The UI
 * never imports a resource directly — it asks the registry. This is what lets
 * generic renderers work across every resource and what a branch/state diff
 * would operate over.
 */

import { functions, policies, tables, templates } from './resources/catalog'
import { configToml } from './resources/config'
import { events } from './resources/events'
import { eventsSelectPolicy, eventsWebhook } from './resources/secondary'
import { buckets, tableCatalog } from './surfaces'
import type { Resource, ResourceCategory } from './types'

export const resources: Resource[] = [
  // Database — hero table first, then the rest of the schema. Warehouse copies are
  // no longer peers here: they're state on the table (its Warehouse projection).
  events,
  ...tables,
  // Auth — policies that govern those tables, plus the project's email templates.
  eventsSelectPolicy,
  ...policies,
  ...templates,
  // Edge Functions.
  eventsWebhook,
  ...functions,
  // Config.
  configToml,
]

const byId = new Map<string, Resource>(resources.map((r) => [r.id, r]))

// Tables browsed from the Tables surface that aren't hand-modelled become stub
// resources on demand — because EVERY table is a resource. The stub carries the
// catalog metadata and offers an escalation to the Table Editor; it just doesn't
// have full projections (we didn't mock its columns). This keeps one mental
// model: a table row always opens a resource, never a special-cased editor.
const synthesized = new Map<string, Resource>()

export function getResource(id: string): Resource | undefined {
  return byId.get(id) ?? synthesized.get(id)
}

/** Resolve (or lazily create) the resource id for any catalog table. */
export function ensureTableResource(schema: string, name: string): string {
  const id = `${schema}.${name}`
  if (byId.has(id) || synthesized.has(id)) return id
  const summary = tableCatalog.find((t) => t.schema === schema && t.name === name)
  synthesized.set(id, {
    id,
    kind: 'table',
    category: 'Database',
    name,
    qualified: id,
    description: summary
      ? `${summary.rows} rows · ${summary.size} · RLS ${summary.rls ? 'on' : 'off'}.`
      : undefined,
    actions: [
      { id: 'open-editor', label: 'Open in Table Editor', kind: 'open' },
      { id: 'view-logs', label: 'View logs', kind: 'view-logs' },
    ],
    data: {
      warning: {
        tone: 'info',
        title: 'Catalog metadata only',
        body: "This table isn't fully modelled in the prototype — its columns aren't loaded. Open the Table Editor to browse rows. In real Studio every table is generated from the live database.",
      },
    },
    // One overview projection (reuses RelationPanel to show the note); no fake columns.
    projections: [{ type: 'data', label: 'Overview', renderer: 'RelationPanel', generated: true }],
  })
  return id
}

/** Resolve (or lazily create) the resource id for a file bucket. */
export function ensureBucketResource(name: string): string {
  const id = `bucket.${name}`
  if (byId.has(id) || synthesized.has(id)) return id
  const b = buckets.find((x) => x.name === name)
  synthesized.set(id, {
    id,
    kind: 'bucket',
    category: 'Storage',
    name,
    qualified: name,
    description: b
      ? `${b.objects} objects · ${b.size} · ${b.public ? 'public' : 'private'}`
      : undefined,
    actions: [
      { id: 'view-logs', label: 'View logs', kind: 'view-logs' },
      { id: 'delete', label: 'Delete bucket', kind: 'delete', intent: 'danger' },
    ],
    data: {
      warning: {
        tone: 'info',
        title: 'Object browser not modelled',
        body: 'A file bucket holds objects. The object browser isn’t built in this prototype — in real Studio this lists and previews the files in the bucket.',
      },
    },
    projections: [{ type: 'data', label: 'Objects', renderer: 'RelationPanel', generated: true }],
  })
  return id
}

/** Category → resources, in sidebar display order. */
export const CATEGORY_ORDER: ResourceCategory[] = [
  'Database',
  'Auth',
  'Storage',
  'Edge Functions',
  'Config',
]

export function resourcesByCategory(): Array<{ category: ResourceCategory; items: Resource[] }> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: resources.filter((r) => r.category === category),
  })).filter((g) => g.items.length > 0)
}

/**
 * Reverse-relation lookup: which resources point AT this one. Lets the table
 * discover the policies that govern it without hardcoding the back-reference.
 */
export function incomingRelations(targetId: string): Array<{ from: Resource; label: string }> {
  const out: Array<{ from: Resource; label: string }> = []
  for (const r of resources) {
    for (const rel of r.relations ?? []) {
      if (rel.target === targetId) out.push({ from: r, label: rel.label })
    }
  }
  return out
}
