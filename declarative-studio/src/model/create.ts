/*
 * What the model knows how to create. The "+ New" picker is just an enumeration
 * of these creatable kinds, and each one's preview is GENERATED — so "create" is
 * another projection of the model, not a hand-built flow per product area. Add a
 * kind here and it appears in +New, the per-area +, and ⌘N for free.
 */

export interface Creatable {
  kind: string
  label: string
  /** Which sidebar area this kind belongs to (drives the per-area + button). */
  area: string
  language: 'sql' | 'bash'
  /** The statement that would run — generated from the typed name. */
  preview: (name: string) => string
}

export const creatables: Creatable[] = [
  {
    kind: 'table',
    label: 'Table',
    area: 'Tables',
    language: 'sql',
    preview: (n) =>
      `create table public.${n || 'new_table'} (\n  id bigint generated always as identity primary key,\n  created_at timestamptz not null default now()\n);`,
  },
  {
    kind: 'bucket',
    label: 'Storage bucket',
    area: 'File Buckets',
    language: 'sql',
    preview: (n) =>
      `insert into storage.buckets (id, name, public)\nvalues ('${n || 'new-bucket'}', '${n || 'new-bucket'}', false);`,
  },
  {
    kind: 'edge-function',
    label: 'Edge Function',
    area: 'Edge Functions',
    language: 'bash',
    preview: (n) => `supabase functions new ${n || 'new-function'}`,
  },
  {
    kind: 'policy',
    label: 'RLS Policy',
    area: 'Policies',
    language: 'sql',
    preview: (n) =>
      `create policy "${n || 'New policy'}"\non public.<table>\nfor select\nto authenticated\nusing (true);`,
  },
  {
    kind: 'notebook',
    label: 'Notebook',
    area: 'Notebooks',
    language: 'sql',
    preview: (n) => `-- ${n || 'Untitled'}\n-- a new notebook over the resource graph`,
  },
]

export function creatableFor(kind: string | null): Creatable | undefined {
  return creatables.find((c) => c.kind === kind)
}
