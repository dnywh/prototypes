/*
 * A fuller, realistic project: a multi-tenant SaaS. Tables for profiles, orgs,
 * membership, projects and documents; the RLS policies that govern them; the
 * project's auth email templates; and a handful of edge functions. All declared
 * compactly via the builders, all rendered by the same shared components.
 */

import type { Resource } from '../types'
import { makeFunction, makePolicy, makeTable, makeTemplate } from './builders'

// --- Tables -----------------------------------------------------------------

export const tables: Resource[] = [
  makeTable({
    name: 'profiles',
    description: 'Public profile per auth user, 1:1 with auth.users.',
    stats: { rows: '8.1k', reqRate: 320, size: '2.1 MB' },
    fields: [
      {
        name: 'id',
        type: 'uuid',
        isPrimaryKey: true,
        nullable: false,
        source: 'column',
        comment: 'References auth.users',
      },
      { name: 'username', type: 'text', isUnique: true, nullable: false, source: 'column' },
      { name: 'full_name', type: 'text', nullable: true, source: 'column' },
      { name: 'avatar_url', type: 'text', nullable: true, source: 'column' },
      {
        name: 'updated_at',
        type: 'timestamptz',
        nullable: false,
        default: 'now()',
        source: 'column',
      },
    ],
    rows: [
      {
        id: 'a1c9…4f2',
        username: 'alice',
        full_name: 'Alice Ng',
        avatar_url: '/a.png',
        updated_at: '12:01',
      },
      {
        id: 'b7e2…81a',
        username: 'bren',
        full_name: 'Bren Cole',
        avatar_url: '/b.png',
        updated_at: '11:58',
      },
      {
        id: 'c3a8…9d1',
        username: 'cai',
        full_name: 'Cai Roe',
        avatar_url: null,
        updated_at: '11:40',
      },
    ],
  }),
  makeTable({
    name: 'organizations',
    description: 'Top-level tenant. Everything else hangs off an organization.',
    stats: { rows: '1.2k', reqRate: 90, size: '480 kB' },
    fields: [
      {
        name: 'id',
        type: 'uuid',
        isPrimaryKey: true,
        nullable: false,
        default: 'gen_random_uuid()',
        source: 'column',
      },
      { name: 'name', type: 'text', nullable: false, source: 'column' },
      { name: 'slug', type: 'text', isUnique: true, nullable: false, source: 'column' },
      { name: 'plan', type: 'text', nullable: false, default: "'free'", source: 'column' },
      {
        name: 'created_at',
        type: 'timestamptz',
        nullable: false,
        default: 'now()',
        source: 'column',
      },
    ],
    rows: [
      { id: 'org_91…', name: 'Acme Inc', slug: 'acme', plan: 'team', created_at: '2026-01-04' },
      { id: 'org_44…', name: 'Globex', slug: 'globex', plan: 'pro', created_at: '2026-02-12' },
    ],
  }),
  makeTable({
    name: 'organization_members',
    description: 'Membership join table: which user belongs to which org, and their role.',
    stats: { rows: '14.7k', reqRate: 410, size: '5.6 MB' },
    fields: [
      {
        name: 'id',
        type: 'bigint',
        isPrimaryKey: true,
        isIdentity: true,
        nullable: false,
        source: 'column',
      },
      {
        name: 'org_id',
        type: 'uuid',
        nullable: false,
        source: 'column',
        comment: 'FK → organizations',
      },
      {
        name: 'user_id',
        type: 'uuid',
        nullable: false,
        source: 'column',
        comment: 'FK → profiles',
      },
      { name: 'role', type: 'text', nullable: false, default: "'member'", source: 'column' },
      {
        name: 'created_at',
        type: 'timestamptz',
        nullable: false,
        default: 'now()',
        source: 'column',
      },
    ],
    relations: [
      { kind: 'belongs-to', label: 'Organization', target: 'public.organizations' },
      { kind: 'belongs-to', label: 'Profile', target: 'public.profiles' },
    ],
    rows: [
      { id: 5012, org_id: 'org_91…', user_id: 'a1c9…4f2', role: 'admin', created_at: '2026-01-04' },
      {
        id: 5013,
        org_id: 'org_91…',
        user_id: 'b7e2…81a',
        role: 'member',
        created_at: '2026-01-06',
      },
    ],
  }),
  makeTable({
    name: 'projects',
    description: 'A project belongs to an organization. Mirrors a Supabase project.',
    stats: { rows: '3.4k', reqRate: 160, size: '1.1 MB' },
    fields: [
      {
        name: 'id',
        type: 'uuid',
        isPrimaryKey: true,
        nullable: false,
        default: 'gen_random_uuid()',
        source: 'column',
      },
      {
        name: 'org_id',
        type: 'uuid',
        nullable: false,
        source: 'column',
        comment: 'FK → organizations',
      },
      { name: 'name', type: 'text', nullable: false, source: 'column' },
      { name: 'ref', type: 'text', isUnique: true, nullable: false, source: 'column' },
      { name: 'region', type: 'text', nullable: false, source: 'column' },
      {
        name: 'created_at',
        type: 'timestamptz',
        nullable: false,
        default: 'now()',
        source: 'column',
      },
    ],
    relations: [{ kind: 'belongs-to', label: 'Organization', target: 'public.organizations' }],
    rows: [
      {
        id: 'prj_a1…',
        org_id: 'org_91…',
        name: 'web',
        ref: 'abcd1234',
        region: 'us-east-1',
        created_at: '2026-01-05',
      },
      {
        id: 'prj_b2…',
        org_id: 'org_44…',
        name: 'api',
        ref: 'efgh5678',
        region: 'eu-west-2',
        created_at: '2026-02-13',
      },
    ],
  }),
  makeTable({
    name: 'page_views',
    description: 'High-volume analytics table, migrated to warehouse-only storage.',
    stats: { rows: '480M', reqRate: 30, size: '64 GB' },
    warehouse: {
      // WAREHOUSE-ONLY: this table was migrated. Its storage lives in the warehouse
      // (Iceberg); Postgres queries it as an external table. No heap copy.
      state: 'warehouse-only',
      format: 'iceberg',
      partitionedBy: 'viewed_at (day)',
      endpoint: 'https://abcd1234.warehouse.supabase.co/iceberg',
      identifier: 'project_abcd1234.public.page_views',
      token: 'whk_live_2b71…c04',
      namespace: 'public',
    },
    fields: [
      {
        name: 'id',
        type: 'bigint',
        isPrimaryKey: true,
        isIdentity: true,
        nullable: false,
        source: 'column',
      },
      { name: 'path', type: 'text', nullable: false, source: 'column' },
      { name: 'referrer', type: 'text', nullable: true, source: 'column' },
      { name: 'session_id', type: 'uuid', nullable: true, source: 'column' },
      {
        name: 'viewed_at',
        type: 'timestamptz',
        nullable: false,
        default: 'now()',
        source: 'column',
      },
    ],
    rows: [
      {
        id: 480_000_001,
        path: '/',
        referrer: 'google.com',
        session_id: 'sx_91…',
        viewed_at: '12:05:02',
      },
      {
        id: 480_000_000,
        path: '/pricing',
        referrer: null,
        session_id: 'sx_44…',
        viewed_at: '12:05:01',
      },
    ],
  }),
  makeTable({
    name: 'documents',
    description: 'Collaborative documents scoped to a project.',
    stats: { rows: '92.0k', reqRate: 540, size: '210 MB' },
    fields: [
      {
        name: 'id',
        type: 'uuid',
        isPrimaryKey: true,
        nullable: false,
        default: 'gen_random_uuid()',
        source: 'column',
      },
      {
        name: 'project_id',
        type: 'uuid',
        nullable: false,
        source: 'column',
        comment: 'FK → projects',
      },
      { name: 'title', type: 'text', nullable: false, source: 'column' },
      { name: 'body', type: 'text', nullable: true, source: 'column' },
      { name: 'created_by', type: 'uuid', nullable: false, source: 'column' },
      {
        name: 'updated_at',
        type: 'timestamptz',
        nullable: false,
        default: 'now()',
        source: 'column',
      },
    ],
    relations: [{ kind: 'belongs-to', label: 'Project', target: 'public.projects' }],
    rows: [
      {
        id: 'doc_71…',
        project_id: 'prj_a1…',
        title: 'Launch plan',
        body: '# Q3…',
        created_by: 'a1c9…4f2',
        updated_at: '12:02',
      },
      {
        id: 'doc_72…',
        project_id: 'prj_a1…',
        title: 'Runbook',
        body: '## On call…',
        created_by: 'b7e2…81a',
        updated_at: '11:50',
      },
    ],
  }),
]

// --- Policies ---------------------------------------------------------------

const orgMembershipExpr =
  'org_id in (select org_id from organization_members where user_id = auth.uid())'

export const policies: Resource[] = [
  makePolicy({
    slug: 'profiles_select_all',
    name: 'Profiles are viewable by everyone',
    table: 'profiles',
    command: 'SELECT',
    roles: ['anon', 'authenticated'],
    using: 'true',
    description: 'Public read access to profiles.',
  }),
  makePolicy({
    slug: 'profiles_update_own',
    name: 'Users can update their own profile',
    table: 'profiles',
    command: 'UPDATE',
    roles: ['authenticated'],
    using: 'auth.uid() = id',
    check: 'auth.uid() = id',
    description: 'A user may only edit their own profile row.',
  }),
  makePolicy({
    slug: 'org_members_read',
    name: 'Members can read their organizations',
    table: 'organizations',
    command: 'SELECT',
    roles: ['authenticated'],
    using: `id in (select org_id from organization_members where user_id = auth.uid())`,
    description: 'You can read orgs you belong to.',
  }),
  makePolicy({
    slug: 'org_admin_manage_members',
    name: 'Org admins manage members',
    table: 'organization_members',
    command: 'ALL',
    roles: ['authenticated'],
    using: `org_id in (select org_id from organization_members where user_id = auth.uid() and role = 'admin')`,
    description: 'Only admins of an org may add/remove members.',
  }),
  makePolicy({
    slug: 'projects_member_read',
    name: 'Members can read org projects',
    table: 'projects',
    command: 'SELECT',
    roles: ['authenticated'],
    using: orgMembershipExpr,
    description: 'Project visibility follows org membership.',
  }),
  makePolicy({
    slug: 'documents_member_crud',
    name: 'Members can manage org documents',
    table: 'documents',
    command: 'ALL',
    roles: ['authenticated'],
    using: 'project_id in (select id from projects where ' + orgMembershipExpr + ')',
    description: 'Full access to documents within your orgs.',
  }),
]

// --- Auth email templates ---------------------------------------------------

const tmpl = (title: string, cta: string) =>
  `<h2>${title}</h2>\n<p>Follow this link to ${cta}:</p>\n<p><a href="{{ .ConfirmationURL }}">${title}</a></p>\n<p>Or copy this code: {{ .Token }}</p>`

export const templates: Resource[] = [
  makeTemplate({
    slug: 'confirmation',
    name: 'Confirm signup',
    subject: 'Confirm your email',
    description: 'Sent when a new user signs up.',
    body: tmpl('Confirm your email', 'confirm your account'),
  }),
  makeTemplate({
    slug: 'invite',
    name: 'Invite user',
    subject: 'You have been invited',
    description: 'Sent when an admin invites a user.',
    body: tmpl('You have been invited', 'accept your invite'),
  }),
  makeTemplate({
    slug: 'magic_link',
    name: 'Magic Link',
    subject: 'Your magic link',
    description: 'Passwordless sign-in link.',
    body: tmpl('Your magic link', 'sign in'),
  }),
  makeTemplate({
    slug: 'recovery',
    name: 'Reset password',
    subject: 'Reset your password',
    description: 'Sent for password recovery.',
    body: tmpl('Reset your password', 'choose a new password'),
  }),
  makeTemplate({
    slug: 'email_change',
    name: 'Change email',
    subject: 'Confirm your new email',
    description: 'Sent when a user changes their email.',
    body: tmpl('Confirm your new email', 'confirm the change'),
  }),
]

// --- Edge functions ---------------------------------------------------------

export const functions: Resource[] = [
  makeFunction({
    slug: 'stripe-webhook',
    description: 'Receives Stripe events and syncs subscription state.',
    invocations: 78,
    errorRate: '0.2%',
    latency: 64,
  }),
  makeFunction({
    slug: 'send-welcome-email',
    description: 'Sends a welcome email after a profile is created.',
    invocations: 140,
    errorRate: '0.5%',
    latency: 220,
  }),
  makeFunction({
    slug: 'generate-og-image',
    description: 'Renders an Open Graph image for a shared document.',
    invocations: 36,
    errorRate: '1.1%',
    latency: 410,
  }),
  makeFunction({
    slug: 'nightly-cleanup',
    description: 'Scheduled job that prunes soft-deleted rows.',
    schedule: '0 3 * * *',
    invocations: 1,
    errorRate: '0%',
    latency: 1800,
    logRows: [
      { timestamp: '03:00:01', level: 'info', message: 'cron triggered', meta: 'schedule' },
      { timestamp: '03:00:09', level: 'info', message: 'pruned 1,204 rows', meta: 'done' },
    ],
  }),
]
