/*
 * The declarative model.
 *
 * This is the whole thesis in one file: Supabase is described as a graph of
 * resources, each carrying fields, relations, actions, signals and a set of
 * projections (views). Every UI surface in the prototype is rendered from these
 * objects — there are no hand-built pages. The Model drawer prints these exact
 * structures, which is "what an agent would read and write."
 */

export type ResourceKind =
  | 'table'
  | 'policy'
  | 'edge-function'
  | 'config-key'
  | 'auth-template'
  | 'bucket'

export type ResourceCategory = 'Database' | 'Auth' | 'Storage' | 'Edge Functions' | 'Config'

/**
 * Whether a table is connected to the Warehouse (Iceberg). This is STATE ON THE
 * TABLE, not a separate resource — the whole point of folding Warehouse into the
 * table. 'attached' = heap table + synced columnar copy; 'warehouse-only' = the
 * table has been migrated, its storage lives in the warehouse.
 */
export interface WarehouseState {
  state: 'none' | 'attached' | 'warehouse-only'
  format?: string
  partitionedBy?: string
  endpoint?: string
  identifier?: string
  token?: string
  namespace?: string
  sync?: { lastSync: string; lag: string }
}

/** A single column / attribute of a resource. */
export interface Field {
  name: string
  /** Postgres-ish type, e.g. 'uuid', 'text', 'timestamptz', 'jsonb', 'boolean'. */
  type: string
  nullable?: boolean
  default?: string | null
  isPrimaryKey?: boolean
  isIdentity?: boolean
  isUnique?: boolean
  comment?: string
  /** Where the value originates — column, config.toml path, derived, etc. */
  source?: string
}

export type RelationKind =
  | 'belongs-to'
  | 'has-many'
  | 'syncs-from'
  | 'invokes'
  | 'exposed-via'
  | 'governs'

/** A typed edge in the resource graph. `target` is another resource's id. */
export interface Relation {
  kind: RelationKind
  label: string
  target: string
}

export type ActionKind =
  | 'create'
  | 'edit'
  | 'delete'
  | 'attach'
  | 'detach'
  | 'migrate'
  | 'connect'
  | 'view-logs'
  | 'open'
  | 'share'

/** A declarative action. The prototype never mutates — it shows `preview`. */
export interface Action {
  id: string
  label: string
  kind: ActionKind
  intent?: 'default' | 'primary' | 'danger'
  description?: string
  /** Disabled actions are rendered but inert (e.g. the marketplace nod). */
  disabled?: boolean
  preview?: { sql?: string; note?: string }
}

export type SignalKind = 'metric' | 'log' | 'usage' | 'error' | 'limit'

/** An observability signal attached to a resource — not a separate page. */
export interface Signal {
  id: string
  label: string
  kind: SignalKind
  unit?: string
  value?: number | string
  /** Sparkline data for metric/usage signals. */
  series?: number[]
  delta?: string
  /** Log rows for log/error signals. */
  rows?: LogRow[]
}

export interface LogRow {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  meta?: string
}

export type ProjectionType =
  | 'data'
  | 'schema'
  | 'policies'
  | 'api'
  | 'storage'
  | 'activity'
  | 'usage'
  | 'config'
  | 'file'

export type RendererName = 'FieldTable' | 'SignalPanel' | 'KeyValuePanel' | 'RelationPanel'

/** A view over a resource. The renderer reads a slice of the resource. */
export interface Projection {
  type: ProjectionType
  label: string
  renderer: RendererName
  /**
   * false = a bespoke "single pane of glass" fallback. We attempt to generate
   * everything (incl. Data); this flag keeps the boundary representable so any
   * surface that resists generation can fall back to a classic hand-built page.
   */
  generated: boolean
  /** Optional one-line note shown under the projection header. */
  hint?: string
}

/**
 * Danny's exact config-key pseudocode shape — the "let us show you what we mean"
 * settings demo. The same KeyValuePanel renders these from config.toml.
 */
export interface ConfigKey {
  key: string
  label: string
  type: 'boolean' | 'string' | 'number' | 'enum'
  value: string | number | boolean
  default: string | number | boolean
  source: string
  requiresRestart: boolean
  dangerous: boolean
  planAvailability: string[]
  docsPath: string
  description?: string
  enumOptions?: string[]
}

/** Free-form, per-resource payload consumed by specific projections. */
export interface ResourceData {
  /** Sample rows for the Data projection (keyed by field name). */
  rows?: Array<Record<string, unknown>>
  /** API code snippets for the API projection. */
  api?: Array<{ label: string; language: string; code: string }>
  /** Warehouse (Iceberg) state for the table — drives the Storage projection. */
  warehouse?: WarehouseState
  /** A single config key (for a deep-linked key). */
  config?: ConfigKey
  /** Many config keys — the whole config.toml file, rendered as Settings or raw file. */
  configGroup?: ConfigKey[]
  /** Policy metadata — the source the generated CREATE POLICY is built from. */
  policy?: {
    name: string
    table: string
    command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
    roles: string[]
    using?: string
    check?: string
  }
  /** Banner shown above a projection, e.g. an RLS-disabled warning. */
  warning?: { tone: 'warn' | 'danger' | 'info'; title: string; body: string }
}

export interface Resource {
  id: string
  kind: ResourceKind
  category: ResourceCategory
  /** Short display name, e.g. 'events'. */
  name: string
  /** Fully-qualified name, e.g. 'public.events'. */
  qualified: string
  description?: string
  fields?: Field[]
  relations?: Relation[]
  actions?: Action[]
  signals?: Signal[]
  projections: Projection[]
  data?: ResourceData
  docsUrl?: string
}
