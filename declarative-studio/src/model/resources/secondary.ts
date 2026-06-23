import type { Resource } from '../types'

/*
 * Secondary resources tied to the hero events table: the RLS policy that governs
 * it and the edge function it invokes. (Warehouse is no longer a separate
 * resource — it's folded into the table as state; see the Warehouse projection.)
 */

export const eventsSelectPolicy: Resource = {
  id: 'policy.events_select_own',
  kind: 'policy',
  category: 'Auth',
  name: 'Users can read their own events',
  qualified: 'policy: events_select_own',
  description: 'RLS policy on public.events — authenticated users see only their own rows.',
  docsUrl: 'https://supabase.com/docs/guides/database/postgres/row-level-security',

  fields: [
    { name: 'command', type: 'SELECT', source: 'declaration' },
    { name: 'roles', type: 'authenticated', source: 'declaration' },
    { name: 'using', type: 'auth.uid() = user_id', source: 'declaration' },
    { name: 'with check', type: '—', source: 'declaration' },
    { name: 'permissive', type: 'true', source: 'declaration' },
  ],

  relations: [{ kind: 'belongs-to', label: 'Table', target: 'public.events' }],

  actions: [
    { id: 'edit', label: 'Edit policy', kind: 'edit', intent: 'default' },
    { id: 'delete', label: 'Delete policy', kind: 'delete', intent: 'danger' },
  ],

  data: {
    policy: {
      name: 'Users can read their own events',
      table: 'public.events',
      command: 'SELECT',
      roles: ['authenticated'],
      using: 'auth.uid() = user_id',
    },
    warning: {
      tone: 'info',
      title: 'RLS is enabled on public.events',
      body: 'If RLS were disabled, this table would be fully exposed through the API. The model surfaces that warning here automatically.',
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

export const eventsWebhook: Resource = {
  id: 'function.events-webhook',
  kind: 'edge-function',
  category: 'Edge Functions',
  name: 'events-webhook',
  qualified: 'edge: events-webhook',
  description: 'Fires on insert into public.events and forwards to downstream consumers.',
  docsUrl: 'https://supabase.com/docs/guides/functions',

  fields: [
    { name: 'runtime', type: 'deno', source: 'config' },
    { name: 'verify_jwt', type: 'false', source: 'config' },
    { name: 'entrypoint', type: 'index.ts', source: 'config' },
  ],

  relations: [{ kind: 'belongs-to', label: 'Triggered by table', target: 'public.events' }],

  actions: [
    { id: 'edit', label: 'Edit function', kind: 'edit' },
    { id: 'view-logs', label: 'View logs', kind: 'view-logs' },
  ],

  signals: [
    {
      id: 'invocations',
      label: 'Invocations',
      kind: 'metric',
      unit: '/min',
      value: 412,
      delta: '+8%',
      series: [300, 320, 360, 340, 380, 400, 390, 405, 410, 408, 412],
    },
    {
      id: 'error-rate',
      label: 'Error rate',
      kind: 'metric',
      unit: '%',
      value: '0.4%',
      delta: '-0.1%',
      series: [1.1, 0.9, 0.8, 0.7, 0.6, 0.7, 0.5, 0.5, 0.4, 0.5, 0.4],
    },
    {
      id: 'latency',
      label: 'Latency p95',
      kind: 'metric',
      unit: 'ms',
      value: 86,
      delta: '-12ms',
      series: [120, 112, 108, 101, 99, 95, 92, 90, 88, 87, 86],
    },
    {
      id: 'logs',
      label: 'Recent logs',
      kind: 'log',
      rows: [
        {
          timestamp: '12:05:02',
          level: 'info',
          message: 'booted (deno) in 38ms',
          meta: 'cold start',
        },
        {
          timestamp: '12:05:02',
          level: 'info',
          message: 'forwarded event signup → analytics',
          meta: '200',
        },
        {
          timestamp: '12:05:00',
          level: 'warn',
          message: 'retry 1/3 to downstream',
          meta: 'timeout',
        },
        {
          timestamp: '12:04:59',
          level: 'info',
          message: 'forwarded event page_view → analytics',
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
      hint: 'Same SignalPanel as the table — signals belong to resources.',
    },
    { type: 'activity', label: 'Logs', renderer: 'SignalPanel', generated: true },
    { type: 'schema', label: 'Config', renderer: 'FieldTable', generated: true },
    { type: 'data', label: 'Related', renderer: 'RelationPanel', generated: true },
  ],
}
