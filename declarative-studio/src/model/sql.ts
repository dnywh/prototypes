/*
 * SQL is a projection too. Rather than storing SQL strings, we generate them
 * from the declarative model — DDL from a table's fields, a CREATE POLICY from a
 * policy's metadata. Change the model, the SQL changes. That is the point.
 */

import type { ConfigKey, Field, Resource } from './types'

function formatColumn(field: Field): string {
  const parts = [`  ${field.name}`, field.type]
  if (field.isPrimaryKey) parts.push('primary key')
  if (field.isIdentity) parts.push('generated always as identity')
  if (field.isUnique && !field.isPrimaryKey) parts.push('unique')
  if (field.nullable === false && !field.isPrimaryKey) parts.push('not null')
  if (field.default != null) parts.push(`default ${field.default}`)
  return parts.join(' ')
}

/** CREATE TABLE DDL generated from a table resource's fields. */
export function generateTableDDL(resource: Resource): string {
  const fields = resource.fields ?? []
  const cols = fields.map(formatColumn).join(',\n')
  const lines = [`create table ${resource.qualified} (`, cols, ');']
  const comments = fields
    .filter((f) => f.comment)
    .map((f) => `comment on column ${resource.qualified}.${f.name} is '${f.comment}';`)
  return [lines.join('\n'), ...comments].join('\n\n')
}

type PolicyShape = NonNullable<Resource['data']>['policy']

/** CREATE POLICY generated from policy metadata held in resource.data. */
export function generatePolicySQL(p: NonNullable<PolicyShape>): string {
  const lines = [
    `create policy "${p.name}"`,
    `on ${p.table}`,
    `for ${p.command.toLowerCase()}`,
    `to ${p.roles.join(', ')}`,
  ]
  if (p.using) lines.push(`using (${p.using})`)
  if (p.check) lines.push(`with check (${p.check})`)
  return lines.join('\n') + ';'
}

/** Warehouse attach / move / detach — generated from table + action, not stored. */
export function generateWarehouseMigration(
  resource: Resource,
  action: 'attach' | 'detach' | 'migrate' | 'copy-back'
): string {
  const table = resource.name

  switch (action) {
    case 'attach':
      return `ATTACH TABLE ${table} TO WAREHOUSE;`
    case 'migrate':
      return `ALTER TABLE ${table} USING WAREHOUSE;`
    case 'detach':
      return `DETACH TABLE ${table} FROM WAREHOUSE;`
    case 'copy-back':
      return [
        `-- Re-materialise as a Postgres heap (prototype — no canonical syntax yet)`,
        `DETACH TABLE ${table} FROM WAREHOUSE;`,
      ].join('\n')
  }
}

/** TOML section for a key: everything before the last dot. 'project_id' → root (''). */
export function configSection(key: string): string {
  const i = key.lastIndexOf('.')
  return i === -1 ? '' : key.slice(0, i)
}

/** The leaf name of a key: 'auth.email.enable_confirmations' → 'enable_confirmations'. */
export function configLeaf(key: string): string {
  const i = key.lastIndexOf('.')
  return i === -1 ? key : key.slice(i + 1)
}

function formatTomlValue(cfg: ConfigKey): string {
  if (cfg.type === 'boolean') return String(cfg.value)
  if (cfg.type === 'number') return String(cfg.value)
  return `"${cfg.value}"`
}

/**
 * Generate the raw config.toml from the SAME ConfigKey declarations that power
 * the Settings form. The file and the form are two projections of one source —
 * which is exactly why you can see and edit the file in Studio.
 */
export function generateConfigToml(keys: ConfigKey[]): string {
  const root = keys.filter((k) => configSection(k.key) === '')
  const sections = new Map<string, ConfigKey[]>()
  for (const k of keys) {
    const section = configSection(k.key)
    if (section === '') continue
    if (!sections.has(section)) sections.set(section, [])
    sections.get(section)!.push(k)
  }

  const lines: string[] = []
  for (const k of root) lines.push(`${configLeaf(k.key)} = ${formatTomlValue(k)}`)
  for (const [section, items] of sections) {
    lines.push('', `[${section}]`)
    for (const k of items) lines.push(`${configLeaf(k.key)} = ${formatTomlValue(k)}`)
  }
  return lines.join('\n')
}
