/*
 * Staged editing. The key design answer: edits are NOT applied WYSIWYG. You edit
 * a draft, the model GENERATES a diff (a migration for tables/policies, a TOML
 * diff for config), you review it, then Apply. Because every surface is rendered
 * from declarations, the diff is free — regenerate from the draft and compare.
 */

import { configLeaf, generatePolicySQL, generateWarehouseMigration } from '../model/sql'
import type { ConfigKey, Field, Resource, WarehouseState } from '../model/types'

// --- Draft shapes -----------------------------------------------------------

export type WarehouseAction = 'attach' | 'detach' | 'migrate' | 'copy-back'

export interface ConfigDraft {
  kind: 'config'
  values: Record<string, string | number | boolean>
}
export interface PolicyDraft {
  kind: 'policy'
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  roles: string
  using: string
  check: string
}
export interface ColumnDraft {
  name: string
  type: string
  nullable: boolean
  default: string
  /** Original name, so we can detect renames and adds. Empty for new columns. */
  origName: string
}
export interface TableDraft {
  kind: 'table'
  description: string
  columns: ColumnDraft[]
}
export interface WarehouseDraft {
  kind: 'warehouse'
  action: WarehouseAction
}
export type Draft = ConfigDraft | PolicyDraft | TableDraft | WarehouseDraft

/** Staged edits per resource — table schema and storage can queue independently. */
export interface ResourcePending {
  table?: TableDraft
  policy?: PolicyDraft
  config?: ConfigDraft
  warehouse?: WarehouseDraft
}

export function isResourcePendingEmpty(p: ResourcePending | undefined): boolean {
  if (!p) return true
  return !p.table && !p.policy && !p.config && !p.warehouse
}

export function mergeResourcePending(
  a: ResourcePending | undefined,
  b: ResourcePending
): ResourcePending {
  return {
    table: b.table ?? a?.table,
    policy: b.policy ?? a?.policy,
    config: b.config ?? a?.config,
    warehouse: b.warehouse ?? a?.warehouse,
  }
}

/** Apply all pending parts, including storage (used on Save / diff baseline). */
export function applyResourcePending(base: Resource, pending: ResourcePending): Resource {
  let r = base
  if (pending.config) r = applyDraft(r, pending.config)
  if (pending.policy) r = applyDraft(r, pending.policy)
  if (pending.table) r = applyDraft(r, pending.table)
  if (pending.warehouse) r = applyDraft(r, pending.warehouse)
  return r
}

/** Live UI overlay — schema/config/policy preview only; storage waits for Save. */
export function applyResourcePendingDisplay(base: Resource, pending: ResourcePending): Resource {
  let r = base
  if (pending.config) r = applyDraft(r, pending.config)
  if (pending.policy) r = applyDraft(r, pending.policy)
  if (pending.table) r = applyDraft(r, pending.table)
  return r
}

export function isEditable(resource: Resource): boolean {
  return (
    resource.kind === 'table' ||
    resource.kind === 'policy' ||
    (resource.kind === 'config-key' && !!resource.data?.configGroup)
  )
}

// --- Build a draft from current state ---------------------------------------

export function initDraft(resource: Resource): Draft {
  if (resource.kind === 'config-key' && resource.data?.configGroup) {
    const values: ConfigDraft['values'] = {}
    for (const k of resource.data.configGroup) values[k.key] = k.value
    return { kind: 'config', values }
  }
  if (resource.kind === 'policy') {
    const p = resource.data?.policy
    return {
      kind: 'policy',
      command: p?.command ?? 'SELECT',
      roles: (p?.roles ?? []).join(', '),
      using: p?.using ?? '',
      check: p?.check ?? '',
    }
  }
  return {
    kind: 'table',
    description: resource.description ?? '',
    columns: (resource.fields ?? []).map((f) => ({
      name: f.name,
      type: f.type,
      nullable: f.nullable !== false,
      default: f.default ?? '',
      origName: f.name,
    })),
  }
}

// --- Apply a draft, producing a new resource --------------------------------

export function applyDraft(base: Resource, draft: Draft): Resource {
  if (draft.kind === 'config' && base.data?.configGroup) {
    const configGroup: ConfigKey[] = base.data.configGroup.map((k) => ({
      ...k,
      value: draft.values[k.key] ?? k.value,
    }))
    return { ...base, data: { ...base.data, configGroup } }
  }
  if (draft.kind === 'policy') {
    const roles = draft.roles
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
    const policy = {
      ...(base.data?.policy ?? { name: base.name, table: 'public.events' }),
      command: draft.command,
      roles,
      using: draft.using || undefined,
      check: draft.check || undefined,
    }
    // Keep the Definition (FieldTable) projection in sync with the new metadata.
    const fields: Field[] = [
      { name: 'command', type: draft.command, source: 'declaration' },
      { name: 'roles', type: roles.join(', ') || '—', source: 'declaration' },
      { name: 'using', type: draft.using || '—', source: 'declaration' },
      { name: 'with check', type: draft.check || '—', source: 'declaration' },
    ]
    return { ...base, fields, data: { ...base.data, policy } }
  }
  if (draft.kind === 'table') {
    const fields: Field[] = draft.columns.map((c) => ({
      name: c.name,
      type: c.type,
      nullable: c.nullable,
      default: c.default || null,
    }))
    return { ...base, description: draft.description, fields }
  }
  if (draft.kind === 'warehouse') {
    const warehouse = applyWarehouseAction(base, draft.action)
    return { ...base, data: { ...base.data, warehouse } }
  }
  return base
}

function applyWarehouseAction(base: Resource, action: WarehouseAction): WarehouseState {
  const current = base.data?.warehouse ?? { state: 'none' as const }
  const schema = base.qualified.includes('.') ? base.qualified.split('.')[0]! : 'public'
  const copyName = `warehouse.${base.name}`

  if (action === 'attach') {
    return {
      state: 'attached',
      format: 'iceberg',
      partitionedBy: 'created_at (day)',
      endpoint: 'https://abcd1234.warehouse.supabase.co/iceberg',
      identifier: `project_abcd1234.${base.qualified}`,
      token: 'whk_live_8f2c…a91',
      namespace: schema,
      sync: { lastSync: 'just now', lag: '~0s behind' },
    }
  }
  if (action === 'detach') {
    return { state: 'none' }
  }
  if (action === 'migrate') {
    return {
      state: 'warehouse-only',
      format: current.format ?? 'iceberg',
      partitionedBy: current.partitionedBy ?? 'created_at (day)',
      endpoint: current.endpoint ?? 'https://abcd1234.warehouse.supabase.co/iceberg',
      identifier: current.identifier ?? `project_abcd1234.${base.qualified}`,
      token: current.token ?? 'whk_live_8f2c…a91',
      namespace: current.namespace ?? schema,
    }
  }
  // copy-back
  void copyName
  return { state: 'none' }
}

// --- Diff -------------------------------------------------------------------

export interface DiffChange {
  label: string
  before?: string
  after?: string
  flag?: 'restart' | 'danger' | 'add' | 'remove'
}
export interface DiffResult {
  changes: DiffChange[]
  /** The generated migration to apply — SQL or a TOML diff. */
  migration: string
  language: 'sql' | 'toml'
  notes: string[]
}

export function computeDiff(before: Resource, draft: Draft): DiffResult {
  if (draft.kind === 'config') return configDiff(before, draft)
  if (draft.kind === 'policy') return policyDiff(before, draft)
  if (draft.kind === 'warehouse') return warehouseDiff(before, draft)
  return tableDiff(before, draft)
}

const STORAGE_MODE_LABEL: Record<WarehouseState['state'], string> = {
  none: 'Postgres',
  attached: 'Postgres + Warehouse copy',
  'warehouse-only': 'Warehouse-only',
}

function warehouseDiff(before: Resource, draft: WarehouseDraft): DiffResult {
  const beforeState = before.data?.warehouse ?? { state: 'none' as const }
  const afterResource = applyDraft(before, draft)
  const afterState = afterResource.data?.warehouse ?? { state: 'none' as const }
  const migration = generateWarehouseMigration(before, draft.action)
  const notes: string[] = []
  const changes: DiffChange[] = [
    {
      label: 'Storage',
      before: STORAGE_MODE_LABEL[beforeState.state],
      after: STORAGE_MODE_LABEL[afterState.state],
      flag:
        draft.action === 'detach' || draft.action === 'copy-back'
          ? 'remove'
          : draft.action === 'migrate'
            ? 'danger'
            : 'add',
    },
  ]

  if (draft.action === 'attach') {
    notes.push(
      'Table keeps serving from Postgres. Changes propagate one-way to the Warehouse copy.'
    )
  }
  if (draft.action === 'migrate') {
    notes.push("The Postgres heap is dropped once the move completes. This can't be undone.")
  }
  if (draft.action === 'detach') {
    notes.push('The Warehouse copy is deleted. Postgres is unaffected.')
  }
  if (draft.action === 'copy-back') {
    notes.push('Re-materialises the table as a Postgres heap. Expensive for large tables.')
  }

  return { changes, migration, language: 'sql', notes }
}

function configDiff(before: Resource, draft: ConfigDraft): DiffResult {
  const keys = before.data?.configGroup ?? []
  const changes: DiffChange[] = []
  const lines: string[] = []
  const notes: string[] = []
  let restart = false
  for (const k of keys) {
    const next = draft.values[k.key]
    if (next === undefined || next === k.value) continue
    changes.push({
      label: k.label,
      before: String(k.value),
      after: String(next),
      flag: k.requiresRestart ? 'restart' : k.dangerous ? 'danger' : undefined,
    })
    lines.push(`- ${configLeaf(k.key)} = ${fmtToml(k.type, k.value)}`)
    lines.push(`+ ${configLeaf(k.key)} = ${fmtToml(k.type, next)}`)
    if (k.requiresRestart) restart = true
  }
  if (restart) notes.push('Some changes require a restart to take effect.')
  return { changes, migration: lines.join('\n'), language: 'toml', notes }
}

function fmtToml(type: ConfigKey['type'], v: unknown): string {
  if (type === 'boolean' || type === 'number') return String(v)
  return `"${v}"`
}

function policyDiff(before: Resource, draft: PolicyDraft): DiffResult {
  const p = before.data?.policy
  if (!p) return { changes: [], migration: '', language: 'sql', notes: [] }
  const after = {
    ...p,
    command: draft.command,
    roles: draft.roles
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean),
    using: draft.using || undefined,
    check: draft.check || undefined,
  }
  const changes: DiffChange[] = []
  if (p.command !== after.command)
    changes.push({ label: 'Command', before: p.command, after: after.command })
  if (p.roles.join(', ') !== after.roles.join(', '))
    changes.push({ label: 'Roles', before: p.roles.join(', '), after: after.roles.join(', ') })
  if ((p.using ?? '') !== (after.using ?? ''))
    changes.push({ label: 'USING', before: p.using ?? '—', after: after.using ?? '—' })
  if ((p.check ?? '') !== (after.check ?? ''))
    changes.push({ label: 'WITH CHECK', before: p.check ?? '—', after: after.check ?? '—' })

  // Postgres has no in-place edit for most of this — it's drop + recreate.
  const migration =
    changes.length === 0
      ? ''
      : `drop policy "${p.name}" on ${p.table};\n\n${generatePolicySQL(after)}`
  return {
    changes,
    migration,
    language: 'sql',
    notes: changes.length ? ['Applied as DROP POLICY + CREATE POLICY in one migration.'] : [],
  }
}

function tableDiff(before: Resource, draft: TableDraft): DiffResult {
  const table = before.qualified
  const orig = before.fields ?? []
  const changes: DiffChange[] = []
  const stmts: string[] = []

  for (const col of draft.columns) {
    if (!col.origName) {
      changes.push({ label: `Add column ${col.name}`, after: col.type, flag: 'add' })
      const bits = [`add column ${col.name} ${col.type}`]
      if (!col.nullable) bits.push('not null')
      if (col.default) bits.push(`default ${col.default}`)
      stmts.push(`alter table ${table} ${bits.join(' ')};`)
      continue
    }
    const prev = orig.find((f) => f.name === col.origName)
    if (!prev) continue
    if (prev.name !== col.name) {
      changes.push({ label: 'Rename column', before: prev.name, after: col.name })
      stmts.push(`alter table ${table} rename column ${prev.name} to ${col.name};`)
    }
    if (prev.type !== col.type) {
      changes.push({ label: `${col.name} type`, before: prev.type, after: col.type })
      stmts.push(`alter table ${table} alter column ${col.name} type ${col.type};`)
    }
    const prevNullable = prev.nullable !== false
    if (prevNullable !== col.nullable) {
      changes.push({
        label: `${col.name} nullable`,
        before: String(prevNullable),
        after: String(col.nullable),
      })
      stmts.push(
        `alter table ${table} alter column ${col.name} ${col.nullable ? 'drop not null' : 'set not null'};`
      )
    }
    const prevDefault = prev.default ?? ''
    if (prevDefault !== col.default) {
      changes.push({
        label: `${col.name} default`,
        before: prevDefault || '—',
        after: col.default || '—',
      })
      stmts.push(
        col.default
          ? `alter table ${table} alter column ${col.name} set default ${col.default};`
          : `alter table ${table} alter column ${col.name} drop default;`
      )
    }
  }

  // Dropped columns.
  for (const f of orig) {
    if (!draft.columns.some((c) => c.origName === f.name)) {
      changes.push({ label: `Drop column ${f.name}`, before: f.type, flag: 'remove' })
      stmts.push(`alter table ${table} drop column ${f.name};`)
    }
  }

  if ((before.description ?? '') !== draft.description) {
    changes.push({
      label: 'Comment',
      before: before.description ?? '—',
      after: draft.description || '—',
    })
    stmts.push(`comment on table ${table} is '${draft.description.replace(/'/g, "''")}';`)
  }

  return { changes, migration: stmts.join('\n'), language: 'sql', notes: [] }
}
