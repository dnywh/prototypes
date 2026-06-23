import { Eye, EyeOff, RotateCw, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

import type { WarehouseAction } from '../../edit/editing'
import { configLeaf, configSection, generateConfigToml, generatePolicySQL } from '../../model/sql'
import type { ConfigKey, Projection, Resource } from '../../model/types'
import { useStudio } from '../../state/store'
import { Badge, Button, Card, SectionLabel, SqlBlock } from '../primitives'

/*
 * The workhorse renderer. The SAME component renders config.toml settings,
 * warehouse connection details, API snippets, and generated policy SQL — three
 * resources, four projection types, one renderer. That reuse is the thesis.
 */
export function KeyValuePanel({
  resource,
  projection,
}: {
  resource: Resource
  projection: Projection
}) {
  if (projection.type === 'file' && resource.data?.configGroup) {
    return <ConfigFile keys={resource.data.configGroup} />
  }
  if (projection.type === 'config' && resource.data?.configGroup) {
    return <ConfigSettings resourceId={resource.id} keys={resource.data.configGroup} />
  }
  if (projection.type === 'config' && resource.data?.config) {
    return <ConfigEditor cfg={resource.data.config} />
  }
  if (projection.type === 'storage') return <StorageDetails resource={resource} />
  if (projection.type === 'api') return <ApiSnippets resource={resource} />
  if (projection.type === 'policies') return <PolicySql resource={resource} />
  return <StorageDetails resource={resource} />
}

/* The raw config.toml — generated from the same keys as the Settings form. */
function ConfigFile({ keys }: { keys: ConfigKey[] }) {
  return (
    <div className="max-w-3xl">
      <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-2 text-[12px] text-fg-light">
        <span className="size-1.5 rounded-full bg-brand" />
        This file is the source of truth. The Settings tab is a generated view of it — edit either.
      </div>
      <SqlBlock sql={generateConfigToml(keys)} />
    </div>
  )
}

/* The friendly Settings form — grouped by config.toml section. */
function ConfigSettings({ resourceId, keys }: { resourceId: string; keys: ConfigKey[] }) {
  const { setConfigValue } = useStudio()
  const sections: Array<{ section: string; items: ConfigKey[] }> = []
  for (const k of keys) {
    const section = configSection(k.key) || 'project'
    let group = sections.find((s) => s.section === section)
    if (!group) {
      group = { section, items: [] }
      sections.push(group)
    }
    group.items.push(k)
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <p className="text-[12px] text-fg-muted">
        Edit values directly — no edit mode. Changes collect in the top-right review and apply to
        config.toml on Save.
      </p>
      {sections.map((group) => (
        <div key={group.section}>
          <div className="mb-2 font-mono text-[12px] text-fg-muted">[{group.section}]</div>
          <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border">
            {group.items.map((cfg) => (
              <ConfigRow
                key={cfg.key}
                cfg={cfg}
                onChange={(v) => setConfigValue(resourceId, cfg.key, v)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ConfigRow({
  cfg,
  onChange,
}: {
  cfg: ConfigKey
  onChange: (value: string | number | boolean) => void
}) {
  const changed = cfg.value !== cfg.default
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 bg-panel px-3 py-2.5 last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-fg">{cfg.label}</span>
          <code className="truncate font-mono text-[11px] text-fg-faint">
            {configLeaf(cfg.key)}
          </code>
          {changed && <Badge tone="brand">changed</Badge>}
          {cfg.requiresRestart && (
            <span title="Requires restart">
              <RotateCw className="size-3 text-amber" />
            </span>
          )}
          {cfg.dangerous && (
            <span title="Dangerous">
              <TriangleAlert className="size-3 text-red" />
            </span>
          )}
        </div>
        {cfg.description && (
          <div className="truncate text-[12px] text-fg-muted">{cfg.description}</div>
        )}
      </div>
      <EditableValue cfg={cfg} onChange={onChange} />
    </div>
  )
}

function EditableValue({
  cfg,
  onChange,
}: {
  cfg: ConfigKey
  onChange: (value: string | number | boolean) => void
}) {
  if (cfg.type === 'boolean') {
    const on = Boolean(cfg.value)
    return (
      <button
        onClick={() => onChange(!on)}
        className={`ds-focus-ring flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${on ? 'justify-end bg-brand' : 'justify-start bg-border-strong'}`}
      >
        <span className="size-4 rounded-full bg-fg shadow" />
      </button>
    )
  }
  return (
    <input
      value={String(cfg.value)}
      onChange={(e) => onChange(cfg.type === 'number' ? Number(e.target.value) : e.target.value)}
      className="ds-focus-ring h-7 w-56 rounded-md border border-border bg-overlay px-2 text-right text-[12px] text-fg outline-none focus:border-border-strong"
    />
  )
}

function ConfigEditor({ cfg }: { cfg: ConfigKey }) {
  const changed = cfg.value !== cfg.default
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[14px] font-medium text-fg">{cfg.label}</div>
            <code className="text-[12px] text-fg-muted">{cfg.key}</code>
            {cfg.description && (
              <p className="mt-2 max-w-prose text-[13px] text-fg-light">{cfg.description}</p>
            )}
          </div>
          <ValueControl cfg={cfg} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {cfg.requiresRestart && (
            <Badge tone="amber">
              <RotateCw className="size-3" /> Requires restart
            </Badge>
          )}
          {cfg.dangerous && (
            <Badge tone="red">
              <TriangleAlert className="size-3" /> Dangerous
            </Badge>
          )}
          <Badge tone="muted">source: {cfg.source}</Badge>
          <Badge tone="muted">default: {String(cfg.default)}</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Available on">
          <div className="flex flex-wrap gap-1">
            {cfg.planAvailability.map((p) => (
              <Badge key={p} tone="brand">
                {p}
              </Badge>
            ))}
          </div>
        </Field>
        <Field label="Docs">
          <a
            href={`https://supabase.com${cfg.docsPath}`}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] text-brand hover:underline"
          >
            {cfg.docsPath}
          </a>
        </Field>
      </div>

      {changed && (
        <div>
          <SectionLabel>Diff vs default</SectionLabel>
          <div className="overflow-hidden rounded-md border border-border font-mono text-[12px]">
            <div className="bg-red-dim/20 px-3 py-1 text-red">
              - {cfg.key} = {String(cfg.default)}
            </div>
            <div className="bg-brand-dim/20 px-3 py-1 text-brand">
              + {cfg.key} = {String(cfg.value)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ValueControl({ cfg }: { cfg: ConfigKey }) {
  if (cfg.type === 'boolean') {
    const on = Boolean(cfg.value)
    return (
      <div
        className={`flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${on ? 'justify-end bg-brand' : 'justify-start bg-border-strong'}`}
      >
        <span className="size-4 rounded-full bg-fg shadow" />
      </div>
    )
  }
  return (
    <code className="shrink-0 rounded-md border border-border bg-overlay px-2 py-1 text-[13px] text-fg">
      {String(cfg.value)}
    </code>
  )
}

/*
 * Storage is a projection of the table, driven by data.warehouse.state.
 *   none           → Postgres heap only; offer Attach (copy).
 *   attached       → heap + synced Iceberg copy; offer Move / Detach / Connect.
 *   warehouse-only → moved; storage in Warehouse; offer Connect / copy-back.
 */
function StorageDetails({ resource }: { resource: Resource }) {
  const { stageWarehouseAction, pendingChanges, toggleReview } = useStudio()
  const wh = resource.data?.warehouse ?? { state: 'none' as const }
  const [preview, setPreview] = useState<string | null>(null)
  const pendingWarehouse = pendingChanges.some((c) => c.id === `${resource.id}:warehouse`)

  const catalogDetails: Array<{ label: string; value?: string; secret?: boolean }> = [
    { label: 'Copy name', value: `warehouse.${resource.name}` },
    { label: 'Format', value: wh.format },
    { label: 'Partitioned by', value: wh.partitionedBy },
    { label: 'Query endpoint', value: wh.endpoint },
    { label: 'Catalog identifier', value: wh.identifier },
    { label: 'Access token', value: wh.token, secret: true },
    { label: 'Namespace', value: wh.namespace },
  ].filter((d) => d.value)

  const stage = (action: WarehouseAction, note: string) => {
    setPreview(note)
    stageWarehouseAction(resource.id, action)
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <StatusBanner wh={wh} tableSize={resource.signals?.find((s) => s.id === 'size')?.value} />

      {pendingWarehouse && (
        <div className="rounded-md border border-brand/30 bg-brand-dim/10 px-3 py-2 text-[12px] text-fg-light">
          Storage change staged in{' '}
          <button type="button" className="text-brand hover:underline" onClick={toggleReview}>
            Unsaved changes
          </button>
          . Catalog connection details appear after Save.
        </div>
      )}

      {wh.state === 'none' && (
        <div className="rounded-[var(--radius-panel)] border border-dashed border-border p-6 text-center">
          <p className="mx-auto max-w-md text-[13px] text-fg-muted">
            This table lives in the Postgres heap. Attach it to Warehouse to keep a synced Iceberg
            copy for columnar analytics — queryable from external engines via the catalog.
          </p>
          <div className="mt-3 flex justify-center">
            <StorageAction
              label="Attach to Warehouse"
              intent="primary"
              onClick={() =>
                stage(
                  'attach',
                  `Creates an Iceberg copy of ${resource.qualified} and starts a sync pipeline. The table keeps serving from Postgres.`
                )
              }
            />
          </div>
        </div>
      )}

      {wh.state !== 'none' && (
        <div>
          <p className="mb-2 text-[12px] font-medium text-fg-light">Catalog connection</p>
          <p className="mb-3 text-[12px] text-fg-muted">
            Connect external engines (Spark, DuckDB, Trino) to this table through the REST catalog.
          </p>
          <div className="flex flex-col gap-px overflow-hidden rounded-[var(--radius-panel)] border border-border">
            {catalogDetails.map((d) => (
              <DetailRow key={d.label} label={d.label} value={d.value!} secret={d.secret} />
            ))}
          </div>
        </div>
      )}

      {wh.state === 'attached' && (
        <div className="flex flex-wrap gap-1.5">
          <StorageAction
            label="Move to Warehouse"
            intent="primary"
            onClick={() =>
              stage(
                'migrate',
                `Moves ${resource.qualified} fully into Warehouse: backfills history, then drops the Postgres heap. The table is then served from Iceberg only.`
              )
            }
          />
          <StorageAction
            label="Detach copy"
            intent="danger"
            onClick={() =>
              stage(
                'detach',
                `Stops sync and drops the Warehouse copy warehouse.${resource.name}. The Postgres heap table is untouched.`
              )
            }
          />
        </div>
      )}

      {wh.state === 'warehouse-only' && (
        <div className="flex flex-wrap gap-1.5">
          <StorageAction
            label="Copy back to Postgres"
            intent="danger"
            onClick={() =>
              stage(
                'copy-back',
                `Re-materialises ${resource.qualified} as a Postgres heap table. Expensive for large tables.`
              )
            }
          />
        </div>
      )}

      {preview && (
        <div className="ds-fade rounded-md border border-border bg-overlay p-3 text-[12px] text-fg-light">
          <span className="text-fg-muted">Preview · </span>
          {preview}
        </div>
      )}
    </div>
  )
}

function StatusBanner({
  wh,
  tableSize,
}: {
  wh: NonNullable<Resource['data']>['warehouse']
  tableSize?: number | string
}) {
  if (!wh) return null
  if (wh.state === 'none') {
    return (
      <Card>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="size-2 rounded-full bg-fg-faint" />
          <span className="text-[13px] font-medium text-fg">Postgres</span>
          {tableSize !== undefined && (
            <span className="text-[12px] text-fg-muted">· {String(tableSize)} heap</span>
          )}
        </div>
      </Card>
    )
  }
  if (wh.state === 'attached') {
    return (
      <Card>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="size-2 rounded-full bg-brand" />
          <span className="text-[13px] font-medium text-fg">Copy · synced</span>
          <span className="text-[12px] text-fg-muted">
            Postgres heap + Iceberg copy
            {wh.sync ? ` · last sync ${wh.sync.lastSync} · ${wh.sync.lag}` : ''}
          </span>
        </div>
      </Card>
    )
  }
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="size-2 rounded-full bg-blue" />
        <span className="text-[13px] font-medium text-fg">Moved</span>
        <span className="text-[12px] text-fg-muted">
          Storage in Warehouse · no Postgres heap
          {tableSize !== undefined && ` · ${String(tableSize)} columnar`}
        </span>
      </div>
    </Card>
  )
}

function StorageAction({
  label,
  intent,
  onClick,
}: {
  label: string
  intent?: 'default' | 'primary' | 'danger'
  onClick: () => void
}) {
  return (
    <Button intent={intent} onClick={onClick}>
      {label}
    </Button>
  )
}

function DetailRow({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [revealed, setRevealed] = useState(false)
  const shown = secret && !revealed ? '•'.repeat(16) : value
  return (
    <div className="flex items-center justify-between gap-4 bg-panel px-3 py-2">
      <span className="text-[12px] text-fg-muted">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[12px] text-fg-light">{shown}</span>
        {secret && (
          <button
            onClick={() => setRevealed((v) => !v)}
            className="ds-focus-ring text-fg-muted hover:text-fg"
            title={revealed ? 'Hide' : 'Reveal'}
          >
            {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        )}
      </span>
    </div>
  )
}

function ApiSnippets({ resource }: { resource: Resource }) {
  const snippets = resource.data?.api ?? []
  const [active, setActive] = useState(0)
  if (snippets.length === 0) return null
  return (
    <div className="max-w-2xl">
      <div className="mb-2 flex gap-1">
        {snippets.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setActive(i)}
            className={`ds-focus-ring rounded-md px-2.5 py-1 text-[12px] transition-colors ${i === active ? 'bg-elevated text-fg' : 'text-fg-muted hover:text-fg-light'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <SqlBlock sql={snippets[active].code} />
    </div>
  )
}

function PolicySql({ resource }: { resource: Resource }) {
  const shape = resource.data?.policy
  return (
    <div className="max-w-2xl">
      <SqlBlock sql={shape ? generatePolicySQL(shape) : '-- no policy metadata'} />
      <p className="mt-2 text-[12px] text-fg-muted">
        <code>CREATE POLICY</code> generated from the policy's declared command, roles and
        expression — not stored as a string.
      </p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  )
}
