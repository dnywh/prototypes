import type { Resource } from '../types'

/*
 * The hero resource. One declaration; seven projections (Data, Schema, Policies,
 * API, Warehouse, Activity, Usage) all render from it. The table owns the
 * experience — Warehouse and Policies are relations of THIS object, not pages.
 */
export const events: Resource = {
  id: 'public.events',
  kind: 'table',
  category: 'Database',
  name: 'events',
  qualified: 'public.events',
  description: 'Append-only product analytics events. The heap table behind everything.',
  docsUrl: 'https://supabase.com/docs/guides/database/tables',

  fields: [
    {
      name: 'id',
      type: 'bigint',
      isPrimaryKey: true,
      isIdentity: true,
      nullable: false,
      source: 'column',
      comment: 'Surrogate key',
    },
    {
      name: 'user_id',
      type: 'uuid',
      nullable: true,
      source: 'column',
      comment: 'References auth.users; null for anonymous events',
    },
    { name: 'name', type: 'text', nullable: false, source: 'column', comment: 'Event name' },
    {
      name: 'properties',
      type: 'jsonb',
      nullable: false,
      default: "'{}'::jsonb",
      source: 'column',
    },
    { name: 'session_id', type: 'uuid', nullable: true, source: 'column' },
    {
      name: 'created_at',
      type: 'timestamptz',
      nullable: false,
      default: 'now()',
      source: 'column',
    },
  ],

  relations: [
    { kind: 'governs', label: 'Row Level Security policy', target: 'policy.events_select_own' },
    { kind: 'invokes', label: 'Webhook on insert', target: 'function.events-webhook' },
  ],

  actions: [
    {
      id: 'edit',
      label: 'Edit table',
      kind: 'edit',
      intent: 'default',
      description: 'Rename, add columns, change types.',
    },
    {
      id: 'open-editor',
      label: 'Open in Table Editor',
      kind: 'open',
      description: 'Open the heavyweight (bespoke) spreadsheet editor for this table.',
    },
    {
      id: 'view-logs',
      label: 'View logs',
      kind: 'view-logs',
      description: 'Jump to the Logs explorer, pre-filtered to this table.',
    },
    {
      id: 'share',
      label: 'Share to marketplace',
      kind: 'share',
      disabled: true,
      description: 'Coming soon — publish this resource definition as a reusable template.',
    },
    {
      id: 'delete',
      label: 'Delete table',
      kind: 'delete',
      intent: 'danger',
      description: 'Drops the table and all dependent objects.',
      preview: { sql: 'drop table public.events cascade;' },
    },
  ],

  signals: [
    {
      id: 'api-requests',
      label: 'API requests',
      kind: 'metric',
      unit: '/min',
      value: 1248,
      delta: '+12%',
      series: [820, 910, 880, 1040, 990, 1120, 1080, 1180, 1210, 1190, 1248],
    },
    {
      id: 'row-count',
      label: 'Live rows',
      kind: 'usage',
      value: '2.4M',
      delta: '+38k today',
      series: [2.0, 2.05, 2.1, 2.18, 2.24, 2.3, 2.33, 2.36, 2.38, 2.39, 2.4],
    },
    {
      id: 'storage',
      label: 'Table size',
      kind: 'usage',
      value: '512 MB',
      delta: '+4 MB/day',
      series: [470, 478, 484, 490, 495, 499, 503, 506, 508, 510, 512],
    },
    {
      id: 'slow-queries',
      label: 'Slow queries',
      kind: 'metric',
      unit: '> 500ms',
      value: 3,
      delta: '-2',
      series: [9, 7, 8, 6, 5, 6, 4, 5, 3, 4, 3],
    },
    {
      id: 'errors',
      label: 'Recent errors',
      kind: 'error',
      value: 2,
      rows: [
        {
          timestamp: '12:04:51',
          level: 'error',
          message: 'new row violates row-level security policy for table "events"',
          meta: 'POST /rest/v1/events · 403',
        },
        {
          timestamp: '11:58:12',
          level: 'error',
          message: 'null value in column "name" violates not-null constraint',
          meta: 'POST /rest/v1/events · 400',
        },
      ],
    },
    {
      id: 'recent-activity',
      label: 'Recent requests',
      kind: 'log',
      rows: [
        {
          timestamp: '12:05:02',
          level: 'info',
          message: 'GET /rest/v1/events?select=*',
          meta: '200 · 41ms',
        },
        {
          timestamp: '12:05:01',
          level: 'info',
          message: 'POST /rest/v1/events',
          meta: '201 · 12ms',
        },
        {
          timestamp: '12:04:59',
          level: 'info',
          message: 'POST /rest/v1/events',
          meta: '201 · 9ms',
        },
        {
          timestamp: '12:04:51',
          level: 'error',
          message: 'POST /rest/v1/events',
          meta: '403 · RLS',
        },
        {
          timestamp: '12:04:48',
          level: 'info',
          message: 'GET /rest/v1/events?name=eq.signup',
          meta: '200 · 23ms',
        },
      ],
    },
  ],

  data: {
    rows: [
      {
        id: 90241,
        user_id: 'a1c9…4f2',
        name: 'signup',
        properties: '{"plan":"free"}',
        session_id: 'sx_91…',
        created_at: '12:05:02',
      },
      {
        id: 90240,
        user_id: 'b7e2…81a',
        name: 'page_view',
        properties: '{"path":"/pricing"}',
        session_id: 'sx_44…',
        created_at: '12:05:01',
      },
      {
        id: 90239,
        user_id: null,
        name: 'page_view',
        properties: '{"path":"/"}',
        session_id: 'sx_77…',
        created_at: '12:04:59',
      },
      {
        id: 90238,
        user_id: 'c3a8…9d1',
        name: 'project_created',
        properties: '{"region":"us-east-1"}',
        session_id: 'sx_12…',
        created_at: '12:04:55',
      },
      {
        id: 90237,
        user_id: 'd9f1…22c',
        name: 'invite_sent',
        properties: '{"count":3}',
        session_id: 'sx_88…',
        created_at: '12:04:50',
      },
    ],
    api: [
      {
        label: 'JavaScript',
        language: 'ts',
        code: `const { data } = await supabase\n  .from('events')\n  .select('id, name, properties, created_at')\n  .order('created_at', { ascending: false })\n  .limit(20)`,
      },
      {
        label: 'cURL',
        language: 'bash',
        code: `curl '$SUPABASE_URL/rest/v1/events?select=*&limit=20' \\\n  -H "apikey: $SUPABASE_ANON_KEY" \\\n  -H "Authorization: Bearer $SUPABASE_ANON_KEY"`,
      },
    ],
    // ATTACHED: heap table in Postgres + a synced Iceberg copy in the Warehouse.
    warehouse: {
      state: 'attached',
      format: 'iceberg',
      partitionedBy: 'created_at (day)',
      endpoint: 'https://abcd1234.warehouse.supabase.co/iceberg',
      identifier: 'project_abcd1234.public.events',
      token: 'whk_live_8f2c…a91',
      namespace: 'public',
      sync: { lastSync: '3s ago', lag: '~4s behind' },
    },
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
