/*
 * Mock data for the bespoke, cross-cutting SURFACES (Tables browse, Logs
 * explorer, Notebooks). Unlike resources, these are not generated from a single
 * declaration — they are hand-built single-pane tools that span the whole
 * project. They consume the resource graph but aren't projections of one node.
 */

// --- Tables browse: the full set across all schemas -------------------------

export interface TableSummary {
  schema: string
  name: string
  rows: string
  size: string
  rls: boolean
  /** Set when this table is fully modelled as a resource (so we can navigate to it). */
  resourceId?: string
}

export const tableCatalog: TableSummary[] = [
  // public — the modelled working set + a few unmodelled neighbours
  {
    schema: 'public',
    name: 'events',
    rows: '2.4M',
    size: '512 MB',
    rls: true,
    resourceId: 'public.events',
  },
  {
    schema: 'public',
    name: 'profiles',
    rows: '8.1k',
    size: '2.1 MB',
    rls: true,
    resourceId: 'public.profiles',
  },
  {
    schema: 'public',
    name: 'organizations',
    rows: '1.2k',
    size: '480 kB',
    rls: true,
    resourceId: 'public.organizations',
  },
  {
    schema: 'public',
    name: 'organization_members',
    rows: '14.7k',
    size: '5.6 MB',
    rls: true,
    resourceId: 'public.organization_members',
  },
  {
    schema: 'public',
    name: 'projects',
    rows: '3.4k',
    size: '1.1 MB',
    rls: true,
    resourceId: 'public.projects',
  },
  {
    schema: 'public',
    name: 'page_views',
    rows: '480M',
    size: '64 GB',
    rls: false,
    resourceId: 'public.page_views',
  },
  {
    schema: 'public',
    name: 'documents',
    rows: '92.0k',
    size: '210 MB',
    rls: true,
    resourceId: 'public.documents',
  },
  { schema: 'public', name: 'subscriptions', rows: '1.1k', size: '320 kB', rls: true },
  { schema: 'public', name: 'invoices', rows: '9.8k', size: '4.4 MB', rls: true },
  { schema: 'public', name: 'comments', rows: '210k', size: '88 MB', rls: true },
  { schema: 'public', name: 'notifications', rows: '1.9M', size: '410 MB', rls: true },
  // auth — managed by Supabase, RLS-locked
  { schema: 'auth', name: 'users', rows: '8.1k', size: '6.2 MB', rls: true },
  { schema: 'auth', name: 'sessions', rows: '22.4k', size: '12 MB', rls: true },
  { schema: 'auth', name: 'refresh_tokens', rows: '40.1k', size: '18 MB', rls: true },
  { schema: 'auth', name: 'identities', rows: '8.6k', size: '3.1 MB', rls: true },
  { schema: 'auth', name: 'mfa_factors', rows: '1.2k', size: '210 kB', rls: true },
  { schema: 'auth', name: 'audit_log_entries', rows: '512k', size: '120 MB', rls: true },
  // storage
  { schema: 'storage', name: 'buckets', rows: '6', size: '64 kB', rls: true },
  { schema: 'storage', name: 'objects', rows: '1.4M', size: '780 MB', rls: true },
  { schema: 'storage', name: 'migrations', rows: '34', size: '48 kB', rls: false },
  // realtime
  { schema: 'realtime', name: 'subscription', rows: '120', size: '96 kB', rls: false },
  { schema: 'realtime', name: 'messages', rows: '3.2M', size: '1.1 GB', rls: false },
  // cron / net / vault — extension schemas
  { schema: 'cron', name: 'job', rows: '4', size: '32 kB', rls: false },
  { schema: 'cron', name: 'job_run_details', rows: '18.2k', size: '9.0 MB', rls: false },
  { schema: 'net', name: 'http_request_queue', rows: '0', size: '16 kB', rls: false },
  { schema: 'vault', name: 'secrets', rows: '12', size: '48 kB', rls: true },
]

export const schemaList = Array.from(new Set(tableCatalog.map((t) => t.schema)))

// File buckets — the Storage product surface (objects/migrations are just tables,
// reached via the Table Editor; buckets are the thing you manage in Storage).
export interface BucketSummary {
  name: string
  public: boolean
  objects: string
  size: string
}

export const buckets: BucketSummary[] = [
  { name: 'avatars', public: true, objects: '8.1k', size: '612 MB' },
  { name: 'documents', public: false, objects: '92.0k', size: '210 GB' },
  { name: 'public-assets', public: true, objects: '342', size: '48 MB' },
  { name: 'exports', public: false, objects: '120', size: '9.4 GB' },
]

// --- Logs explorer: a cross-cutting stream ----------------------------------

export type LogService = 'api' | 'auth' | 'database' | 'storage' | 'edge' | 'realtime'

export interface LogEntry {
  ts: string
  service: LogService
  level: 'info' | 'warn' | 'error'
  method?: string
  path?: string
  status?: number
  message: string
  /** Resource this log line is about, when we can attribute it. */
  resourceId?: string
}

export const logStream: LogEntry[] = [
  {
    ts: '12:05:02.881',
    service: 'api',
    level: 'info',
    method: 'GET',
    path: '/rest/v1/events',
    status: 200,
    message: 'GET /rest/v1/events?select=*',
    resourceId: 'public.events',
  },
  {
    ts: '12:05:02.140',
    service: 'edge',
    level: 'info',
    message: 'events-webhook forwarded signup → analytics',
    resourceId: 'function.events-webhook',
  },
  {
    ts: '12:05:01.902',
    service: 'api',
    level: 'info',
    method: 'POST',
    path: '/rest/v1/events',
    status: 201,
    message: 'POST /rest/v1/events',
    resourceId: 'public.events',
  },
  {
    ts: '12:05:01.310',
    service: 'auth',
    level: 'info',
    message: 'token refreshed for user a1c9…4f2',
  },
  {
    ts: '12:05:00.774',
    service: 'database',
    level: 'warn',
    message: 'slow query 612ms on public.documents',
    resourceId: 'public.documents',
  },
  {
    ts: '12:04:59.501',
    service: 'api',
    level: 'info',
    method: 'GET',
    path: '/rest/v1/projects',
    status: 200,
    message: 'GET /rest/v1/projects',
    resourceId: 'public.projects',
  },
  {
    ts: '12:04:58.220',
    service: 'storage',
    level: 'info',
    method: 'PUT',
    path: '/storage/v1/object/avatars/a.png',
    status: 200,
    message: 'uploaded avatars/a.png',
  },
  {
    ts: '12:04:57.044',
    service: 'api',
    level: 'error',
    method: 'POST',
    path: '/rest/v1/events',
    status: 403,
    message: 'new row violates row-level security policy for table "events"',
    resourceId: 'public.events',
  },
  {
    ts: '12:04:55.990',
    service: 'edge',
    level: 'warn',
    message: 'stripe-webhook retry 1/3 to downstream',
    resourceId: 'function.stripe-webhook',
  },
  {
    ts: '12:04:55.001',
    service: 'realtime',
    level: 'info',
    message: 'channel public:documents subscribed (412 clients)',
    resourceId: 'public.documents',
  },
  {
    ts: '12:04:53.612',
    service: 'database',
    level: 'error',
    message: 'deadlock detected on organization_members',
    resourceId: 'public.organization_members',
  },
  {
    ts: '12:04:52.300',
    service: 'api',
    level: 'info',
    method: 'PATCH',
    path: '/rest/v1/profiles',
    status: 200,
    message: 'PATCH /rest/v1/profiles?id=eq.a1c9',
    resourceId: 'public.profiles',
  },
  {
    ts: '12:04:51.118',
    service: 'auth',
    level: 'warn',
    message: 'rate limit near for /token (88/100)',
  },
  {
    ts: '12:04:50.642',
    service: 'api',
    level: 'error',
    method: 'POST',
    path: '/rest/v1/events',
    status: 400,
    message: 'null value in column "name" violates not-null constraint',
    resourceId: 'public.events',
  },
  {
    ts: '12:04:49.205',
    service: 'edge',
    level: 'info',
    message: 'send-welcome-email delivered to bren@…',
    resourceId: 'function.send-welcome-email',
  },
]

// --- Notebooks: durable, composable analysis --------------------------------

export type NotebookBlock =
  | { type: 'markdown'; text: string }
  | { type: 'metric'; label: string; value: string; unit?: string; series: number[] }
  | { type: 'query'; sql: string; columns: string[]; rows: Array<Array<string | number>> }
  | {
      type: 'logs'
      label: string
      rows: Array<{ ts: string; level: string; service: string; message: string }>
    }

export interface Notebook {
  id: string
  title: string
  description: string
  updatedAt: string
  author: string
  blocks: NotebookBlock[]
}

export const notebooks: Notebook[] = [
  {
    id: 'nb.wau',
    title: 'Weekly active users',
    description: 'Rolling 7-day active users from public.events.',
    updatedAt: '2 hours ago',
    author: 'alice',
    blocks: [
      {
        type: 'markdown',
        text: 'WAU = distinct `user_id` in `public.events` over a trailing 7-day window. Source of truth for the growth dashboard.',
      },
      {
        type: 'metric',
        label: 'Weekly active users',
        value: '24.1k',
        unit: 'WAU',
        series: [18, 19, 20, 21, 22, 23, 24.1],
      },
      {
        type: 'query',
        sql: "select date_trunc('day', created_at) as day,\n       count(distinct user_id) as wau\nfrom public.events\nwhere created_at > now() - interval '7 days'\ngroup by 1 order by 1;",
        columns: ['day', 'wau'],
        rows: [
          ['Mon', 22140],
          ['Tue', 22810],
          ['Wed', 23200],
          ['Thu', 23590],
          ['Fri', 24010],
          ['Sat', 21030],
          ['Sun', 20440],
        ],
      },
    ],
  },
  {
    id: 'nb.funnel',
    title: 'Signup → project funnel',
    description: 'Conversion from signup to first project_created.',
    updatedAt: 'yesterday',
    author: 'bren',
    blocks: [
      {
        type: 'markdown',
        text: 'Funnel across three event names. Watch the **signup → project_created** step — it is the activation moment.',
      },
      {
        type: 'query',
        sql: "select name, count(*) from public.events\nwhere name in ('signup','project_created','invite_sent')\ngroup by name;",
        columns: ['step', 'count'],
        rows: [
          ['signup', 8120],
          ['project_created', 3410],
          ['invite_sent', 1980],
        ],
      },
      {
        type: 'metric',
        label: 'Activation rate',
        value: '42%',
        series: [38, 39, 40, 41, 41, 42, 42],
      },
    ],
  },
]
