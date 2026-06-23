# Declarative Studio — prototype

A throwaway prototype exploring one idea: **Studio should be resource-centric, not
page-centric.** Instead of hand-designing every page, model Supabase as a graph of
**resources** that carry **fields, relations, actions, signals, and projections** —
then render the UI as projections of that shared model.

This is a proof of stance, not a Studio rebuild. It is fully isolated: a standalone
Vite + React + TypeScript app with its own minimal theme. No dependency on
`apps/studio` or `packages/ui`, and it is **not** part of the pnpm workspace.

## Run it

```bash
cd declarative-studio
npm install
npm run dev   # http://localhost:5173
```

## How to read the demo

`public.events` is the hero resource. One declaration
([`src/model/resources/events.ts`](src/model/resources/events.ts)) produces **seven
projections** — Data, Schema, Policies, API, Warehouse, Activity, Usage — each rendered
by a shared generic component. The table owns the experience; Policies and Warehouse
are _relations_ of the table, not separate pages.

The sidebar is populated with a fuller, realistic multi-tenant SaaS project
([`src/model/resources/catalog.ts`](src/model/resources/catalog.ts)) — tables (profiles,
organizations, members, projects, documents), the RLS policies that govern them, the
project's auth email templates, and several edge functions — all declared compactly via
[`builders.ts`](src/model/resources/builders.ts) and rendered by the same components.

**Warehouse is folded into the table.** It is not a sidebar category — it's _state on the
table_, shown as the table's **Warehouse** projection. Every table has the tab, and it
renders one of three states from `data.warehouse.state`: **not attached** (Postgres heap
only, with an Attach CTA), **attached** (heap + synced Iceberg copy — see `public.events`),
or **warehouse-only** (migrated; storage lives in the warehouse — see `public.page_views`).
The contextual actions (Attach / Migrate / Detach / Connect) change with the state.

### Two tiers: resources and surfaces

The sidebar has a top group of **bespoke tools/surfaces** (Table Editor, SQL Editor, Logs,
Notebooks, Settings) as plain links, then the **resource areas** that enumerate their items
(collapsible sections with a count): **Tables, File Buckets, Policies, Email Templates, Edge
Functions**. Long lists truncate to the first few with a **"Show all N →"** that opens the area's
browse surface — so the sidebar shows your working set and the surface is the full filtered browser
(complementary, not a 1:1 duplicate). **Favorites** sits at the bottom as an _addition_ (pin via the
★ on a resource header). Storage is just **File Buckets**; `storage.objects` / `storage.migrations`
are tables, reached via the Table Editor / the Tables area.

**Creating** is generated from the model ([`src/model/create.ts`](src/model/create.ts)): a global
**"+ New"** picker (⌘N, or the + by search) enumerates the creatable kinds; each area's header has a
**"+"** for in-context creation. Picking a kind shows a name field and a **generated** `create …`
preview, staged like an edit. Add a kind to `creatables` and it appears in +New, the per-area +,
and ⌘N for free.

The area browse surfaces live in [`src/components/surfaces/`](src/components/surfaces/):

- **Tables** — browse _all_ tables across _all_ schemas (`public`, `auth`, `storage`,
  `realtime`, `cron`, `net`, `vault`). Schema is a filter. It's the **list view of the table
  collection**: every row opens as a resource (unmodelled ones as a metadata stub).
- **Policies / Email Templates / File Buckets / Edge Functions** — area list surfaces (one generic
  `CollectionSurface`) listing that area's items; each row opens a resource.
- **Logs** — ad-hoc cross-cutting explorer. A resource's "View logs" opens it **pre-filtered** to
  that resource (resource-scoped signals stay on the resource as Activity/Usage; cross-cutting
  hunting happens here). "Save as notebook" promotes the current filter into a notebook block.
- **SQL Editor** — sibling of Logs. Where ad-hoc SQL is authored; Run shows results; "Save to
  notebook" promotes the query into a notebook block.
- **Notebooks** — durable, composable, shareable analysis. The Logs explorer and SQL Editor are
  the ephemeral scratchpads; **Notebooks are where saved blocks live** (markdown / metric / query /
  logs). Saving from either tool creates a real notebook here.
- **Table Editor** — the heavyweight spreadsheet editor, an escalation opened _from_ a table
  ("Open in Table Editor"). Coexists with the lightweight generated **Data** tab (quick look vs
  power edit).

Surfaces are badged **bespoke**, and the Model drawer shows "no model — this is a bespoke
surface" for them. That's the ~25% the model deliberately doesn't generate. The per-tab
generated/bespoke dot now appears _only_ on bespoke tabs (silent when everything's generated).

Things to try:

- **Cycle the tabs** on `public.events`. Every view is generated from the same object.
- **Toggle the Model drawer** (`\` or the top-right button). It prints the exact
  declaration behind the current view — framed as _what an agent reads and writes_.
- **Follow relations.** From the table, open Warehouse → click into `warehouse.events`
  (sync status, query endpoint, token) → jump back via the inspector. That is the
  resource graph.
- **Open `config.toml`** (under Config). It has two projections of the same data: a
  friendly **Settings** form grouped by section, and the **raw file**. They are generated
  from one set of declarations — so you can see and edit the file _or_ the form, and they
  stay in sync. This is the answer to "why can't I see/edit config.toml in Studio?": you
  can; the settings UI is just a view of the file (Notion's "one schema, many views").
- **Edit something inline** — toggle a value in **Settings**, or "Edit table" / "Edit policy".
  Watch the **"N unsaved"** pill appear top-right; open it to review the generated diffs and Save.
- **`⌘K`** to jump to anything, **`⌘N`** to create. `[` / `]` or `1–9` switch tabs.

A small dot on each tab marks **generated** (brand) vs **bespoke** (grey).

## Editing: inline, with a global review/save

Edits don't apply immediately and there's no per-resource "edit mode" gate. You change values
**inline** — toggle a setting, edit a field — and changes collect in a global **working set**
(pending vs committed in [`store.tsx`](src/state/store.tsx)). A prominent **"N unsaved"** pill
appears top-right; it opens a **Review** drawer (Saxon's primitive-diff panel) listing every
changed resource with a **generated diff**, and **Save all** / **Discard all**.

- **Settings (config.toml)** → edit values directly; the Review shows a `config.toml` diff
  (`- key = old` / `+ key = new`) with restart/danger flags. Save applies to the file.
- **Tables / policies** → the editor stages into the same working set; the Review shows the
  `ALTER TABLE` / `DROP+CREATE POLICY` migration.

The diff falls out of the declarative model for free: every surface is generated from
declarations, so regenerating from the pending draft and comparing committed _is_ the diff. This
is the "diff state, not code" direction — one place to review and commit everything, so you don't
forget to save.

## The model

Five primitives in [`src/model/types.ts`](src/model/types.ts): `Resource`, `Field`,
`Relation`, `Action`, `Signal`, plus `Projection` (which names a generic renderer) and
`ConfigKey` (the exact config-key shape from the design discussion).

Only **four generic renderers** draw everything — reuse is the whole point:

| Renderer        | Drives                                                       |
| --------------- | ------------------------------------------------------------ |
| `FieldTable`    | Schema, **and the generated Data grid**                      |
| `SignalPanel`   | Activity + Usage, for the table _and_ the edge fn            |
| `KeyValuePanel` | Config settings, Warehouse details, API snippets, policy SQL |
| `RelationPanel` | Policies, Warehouse, and graph navigation                    |

SQL is **generated from the model** ([`src/model/sql.ts`](src/model/sql.ts)): table DDL
from fields, `CREATE POLICY` from policy metadata. It is never a stored string.

## Honest notes & where this leads

- **"Folding the explorer in":** the Data tab is _generated_ here, not hand-built. With
  mock data that looks easy — the real test is whether a generated data view survives
  inline editing, pagination, and scale. The `generated` flag stays a first-class part
  of the model so any surface that resists generation can fall back to a classic
  "single pane of glass."
- **Nods, not features** (kept deliberately small so a demo about restraint doesn't
  sprawl):
  - The **Model drawer** is framed as the agent's read/write surface — one declaration
    driving UI + tools + docs + config.
  - A static **branch switcher** + _diff vs main_ in the top bar. Branches/state-diffing
    (diff _capabilities_, not code) is a natural next slice over the same graph — but
    resource navigation stays the primary IA here, not branches.
  - A disabled **Share to marketplace** action — resources/projections are meant to be
    open and extensible, with a future `workbook` projection shareable like a template.
