/*
 * Builders that produce standard Resource shapes from compact specs. Because the
 * projections, actions and API snippets are derived here, declaring a realistic
 * project stays terse — and every table/policy/function gets the same grammar.
 */

import type { Field, Resource, Signal, WarehouseState } from '../types'

function apiSnippet(name: string, fields: Field[]): string {
  const cols = fields
    .slice(0, 4)
    .map((f) => f.name)
    .join(', ')
  return `const { data } = await supabase\n  .from('${name}')\n  .select('${cols}')\n  .limit(20)`
}

function metric(
  id: string,
  label: string,
  value: number | string,
  unit: string,
  series: number[],
  delta?: string
): Signal {
  return { id, label, kind: 'metric', value, unit, series, delta }
}
function usage(id: string, label: string, value: string, series: number[], delta?: string): Signal {
  return { id, label, kind: 'usage', value, series, delta }
}
function requestLog(name: string): Signal {
  return {
    id: 'recent',
    label: 'Recent requests',
    kind: 'log',
    rows: [
      {
        timestamp: '12:05:02',
        level: 'info',
        message: `GET /rest/v1/${name}?select=*`,
        meta: '200 · 28ms',
      },
      {
        timestamp: '12:05:00',
        level: 'info',
        message: `POST /rest/v1/${name}`,
        meta: '201 · 11ms',
      },
      {
        timestamp: '12:04:57',
        level: 'info',
        message: `PATCH /rest/v1/${name}?id=eq.1`,
        meta: '200 · 14ms',
      },
    ],
  }
}

export interface TableSpec {
  name: string
  description: string
  fields: Field[]
  rows?: Array<Record<string, unknown>>
  relations?: Resource['relations']
  stats?: { rows: string; reqRate: number; size: string }
  warehouse?: WarehouseState
}

export function makeTable(spec: TableSpec): Resource {
  const stats = spec.stats ?? { rows: '12.4k', reqRate: 240, size: '3.2 MB' }
  const warehouse: WarehouseState = spec.warehouse ?? { state: 'none' }
  return {
    id: `public.${spec.name}`,
    kind: 'table',
    category: 'Database',
    name: spec.name,
    qualified: `public.${spec.name}`,
    description: spec.description,
    docsUrl: 'https://supabase.com/docs/guides/database/tables',
    fields: spec.fields,
    relations: spec.relations ?? [],
    actions: [
      { id: 'edit', label: 'Edit table', kind: 'edit' },
      { id: 'open-editor', label: 'Open in Table Editor', kind: 'open' },
      { id: 'view-logs', label: 'View logs', kind: 'view-logs' },
      { id: 'share', label: 'Share to marketplace', kind: 'share', disabled: true },
      {
        id: 'delete',
        label: 'Delete table',
        kind: 'delete',
        intent: 'danger',
        preview: { sql: `drop table public.${spec.name} cascade;` },
      },
    ],
    signals: [
      metric(
        'api-requests',
        'API requests',
        stats.reqRate,
        '/min',
        [
          stats.reqRate * 0.7,
          stats.reqRate * 0.8,
          stats.reqRate * 0.85,
          stats.reqRate * 0.9,
          stats.reqRate * 0.95,
          stats.reqRate,
        ],
        '+6%'
      ),
      usage('row-count', 'Live rows', stats.rows, [70, 76, 80, 88, 94, 100], `${stats.rows} total`),
      usage('size', 'Table size', stats.size, [60, 68, 74, 82, 90, 100], 'steady'),
      requestLog(spec.name),
    ],
    data: {
      rows: spec.rows ?? [],
      api: [{ label: 'JavaScript', language: 'ts', code: apiSnippet(spec.name, spec.fields) }],
      warehouse,
    },
    projections: [
      {
        type: 'data',
        label: 'Data',
        renderer: 'FieldTable',
        generated: true,
        hint: 'Grid generated from the field declarations over sample rows.',
      },
      {
        type: 'storage',
        label: 'Storage',
        renderer: 'KeyValuePanel',
        generated: true,
      },
      { type: 'schema', label: 'Schema', renderer: 'FieldTable', generated: true },
      {
        type: 'policies',
        label: 'Policies',
        renderer: 'RelationPanel',
        generated: true,
        hint: 'Policies that govern this table, from the resource graph.',
      },
      {
        type: 'api',
        label: 'API',
        renderer: 'KeyValuePanel',
        generated: true,
        hint: 'Snippets generated from the table name + columns.',
      },

      { type: 'activity', label: 'Activity', renderer: 'SignalPanel', generated: true },
      { type: 'usage', label: 'Usage', renderer: 'SignalPanel', generated: true },
    ],
  }
}

export interface PolicySpec {
  slug: string
  name: string
  table: string
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  roles: string[]
  using?: string
  check?: string
  description: string
}

export function makePolicy(spec: PolicySpec): Resource {
  return {
    id: `policy.${spec.slug}`,
    kind: 'policy',
    category: 'Auth',
    name: spec.name,
    qualified: `policy: ${spec.slug}`,
    description: spec.description,
    docsUrl: 'https://supabase.com/docs/guides/database/postgres/row-level-security',
    fields: [
      { name: 'command', type: spec.command, source: 'declaration' },
      { name: 'roles', type: spec.roles.join(', '), source: 'declaration' },
      { name: 'using', type: spec.using ?? '—', source: 'declaration' },
      { name: 'with check', type: spec.check ?? '—', source: 'declaration' },
    ],
    relations: [{ kind: 'belongs-to', label: 'Table', target: `public.${spec.table}` }],
    actions: [
      { id: 'edit', label: 'Edit policy', kind: 'edit', intent: 'default' },
      { id: 'delete', label: 'Delete policy', kind: 'delete', intent: 'danger' },
    ],
    data: {
      policy: {
        name: spec.name,
        table: `public.${spec.table}`,
        command: spec.command,
        roles: spec.roles,
        using: spec.using,
        check: spec.check,
      },
    },
    projections: [
      { type: 'schema', label: 'Definition', renderer: 'FieldTable', generated: true },
      {
        type: 'policies',
        label: 'SQL',
        renderer: 'KeyValuePanel',
        generated: true,
        hint: 'CREATE POLICY generated from the fields above.',
      },
      { type: 'data', label: 'Related', renderer: 'RelationPanel', generated: true },
    ],
  }
}

export interface TemplateSpec {
  slug: string
  name: string
  subject: string
  body: string
  description: string
}

export function makeTemplate(spec: TemplateSpec): Resource {
  return {
    id: `auth.template.${spec.slug}`,
    kind: 'auth-template',
    category: 'Auth',
    name: spec.name,
    qualified: `auth.email.${spec.slug}`,
    description: spec.description,
    docsUrl: 'https://supabase.com/docs/guides/auth/auth-email-templates',
    fields: [
      { name: 'subject', type: spec.subject, source: 'config.toml' },
      {
        name: 'content_path',
        type: `./supabase/templates/${spec.slug}.html`,
        source: 'config.toml',
      },
    ],
    relations: [],
    actions: [
      {
        id: 'edit',
        label: 'Edit template',
        kind: 'edit',
        intent: 'primary',
        preview: {
          note: 'Editing a template is a staged change like everything else — subject + body produce a diff against config.toml before apply.',
        },
      },
    ],
    data: {
      api: [{ label: 'HTML', language: 'html', code: spec.body }],
    },
    projections: [
      {
        type: 'schema',
        label: 'Settings',
        renderer: 'FieldTable',
        generated: true,
        hint: 'Subject + template path, from config.toml.',
      },
      {
        type: 'api',
        label: 'Body',
        renderer: 'KeyValuePanel',
        generated: true,
        hint: 'The HTML body. Variables like {{ .ConfirmationURL }} are interpolated at send time.',
      },
    ],
  }
}

export interface FunctionSpec {
  slug: string
  description: string
  schedule?: string
  invocations: number
  errorRate: string
  latency: number
  logRows?: Signal['rows']
}

export function makeFunction(spec: FunctionSpec): Resource {
  const fields: Field[] = [
    { name: 'runtime', type: 'deno', source: 'config' },
    { name: 'verify_jwt', type: 'false', source: 'config' },
    { name: 'entrypoint', type: 'index.ts', source: 'config' },
  ]
  if (spec.schedule) fields.push({ name: 'schedule', type: spec.schedule, source: 'config' })
  return {
    id: `function.${spec.slug}`,
    kind: 'edge-function',
    category: 'Edge Functions',
    name: spec.slug,
    qualified: `edge: ${spec.slug}`,
    description: spec.description,
    docsUrl: 'https://supabase.com/docs/guides/functions',
    fields,
    relations: [],
    actions: [
      {
        id: 'edit',
        label: 'Edit function',
        kind: 'edit',
        preview: { note: 'Opens the function source.' },
      },
      { id: 'view-logs', label: 'View logs', kind: 'view-logs' },
    ],
    signals: [
      metric(
        'invocations',
        'Invocations',
        spec.invocations,
        '/min',
        [
          spec.invocations * 0.6,
          spec.invocations * 0.7,
          spec.invocations * 0.85,
          spec.invocations * 0.9,
          spec.invocations * 0.95,
          spec.invocations,
        ],
        '+9%'
      ),
      metric(
        'error-rate',
        'Error rate',
        spec.errorRate,
        '%',
        [1.0, 0.8, 0.7, 0.6, 0.5, 0.4],
        '-0.1%'
      ),
      metric(
        'latency',
        'Latency p95',
        spec.latency,
        'ms',
        [
          spec.latency * 1.4,
          spec.latency * 1.3,
          spec.latency * 1.15,
          spec.latency * 1.05,
          spec.latency,
          spec.latency,
        ],
        '-8ms'
      ),
      {
        id: 'logs',
        label: 'Recent logs',
        kind: 'log',
        rows: spec.logRows ?? [
          {
            timestamp: '12:05:02',
            level: 'info',
            message: `booted (deno) in 41ms`,
            meta: 'cold start',
          },
          {
            timestamp: '12:05:01',
            level: 'info',
            message: `${spec.slug} handled request`,
            meta: '200',
          },
        ],
      },
    ],
    projections: [
      {
        type: 'usage',
        label: 'Metrics',
        renderer: 'SignalPanel',
        generated: true,
        hint: 'Same SignalPanel as tables — signals belong to resources.',
      },
      { type: 'activity', label: 'Logs', renderer: 'SignalPanel', generated: true },
      { type: 'schema', label: 'Config', renderer: 'FieldTable', generated: true },
      { type: 'data', label: 'Related', renderer: 'RelationPanel', generated: true },
    ],
  }
}
