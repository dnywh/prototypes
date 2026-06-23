import { ArrowUpRight } from 'lucide-react'

import { ensureBucketResource, resources } from '../../model/registry'
import { buckets } from '../../model/surfaces'
import type { Resource } from '../../model/types'
import { useStudio, type CollectionId } from '../../state/store'
import { kindIcon } from '../icons'

/*
 * A product-area destination. The sidebar's core areas (Policies, Email
 * Templates, Edge Functions, File Buckets) open here — a list of what's in that
 * area. This is the "Tables surface" pattern generalised: an area is a list view
 * of its resources, reached from the always-present sidebar nav.
 */
const META: Record<CollectionId, { title: string; blurb: string }> = {
  policies: { title: 'Policies', blurb: 'Row-level security policies across your tables.' },
  templates: { title: 'Email Templates', blurb: 'Transactional auth emails sent to your users.' },
  functions: { title: 'Edge Functions', blurb: 'Deno functions deployed to the edge.' },
  buckets: {
    title: 'File Buckets',
    blurb: 'Storage buckets. Objects and migrations are tables — open them in the Table Editor.',
  },
}

interface Item {
  key: string
  label: string
  sublabel: string
  kind: Resource['kind']
  onOpen: () => void
}

export function CollectionSurface({ collection }: { collection: CollectionId }) {
  const { select } = useStudio()
  const meta = META[collection]

  const fromResources = (predicate: (r: Resource) => boolean): Item[] =>
    resources.filter(predicate).map((r) => ({
      key: r.id,
      label: r.qualified,
      sublabel: r.description ?? '',
      kind: r.kind,
      onOpen: () => select(r.id),
    }))

  let items: Item[] = []
  if (collection === 'policies') items = fromResources((r) => r.kind === 'policy')
  else if (collection === 'templates') items = fromResources((r) => r.kind === 'auth-template')
  else if (collection === 'functions') items = fromResources((r) => r.category === 'Edge Functions')
  else
    items = buckets.map((b) => ({
      key: `bucket.${b.name}`,
      label: b.name,
      sublabel: `${b.objects} objects · ${b.size} · ${b.public ? 'public' : 'private'}`,
      kind: 'bucket' as const,
      onOpen: () => select(ensureBucketResource(b.name)),
    }))

  return (
    <div className="ds-fade flex h-full flex-col">
      <div className="px-5 pt-5">
        <h1 className="text-[15px] font-semibold text-fg">{meta.title}</h1>
        <p className="mt-0.5 text-[12px] text-fg-muted">{meta.blurb}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex max-w-3xl flex-col gap-px overflow-hidden rounded-[var(--radius-panel)] border border-border">
          {items.map((it) => {
            const Icon = kindIcon(it.kind)
            return (
              <button
                key={it.key}
                onClick={it.onOpen}
                className="group flex items-center gap-3 bg-panel px-3 py-2.5 text-left transition-colors hover:bg-elevated"
              >
                <Icon className="size-4 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-fg">{it.label}</div>
                  {it.sublabel && (
                    <div className="truncate text-[12px] text-fg-muted">{it.sublabel}</div>
                  )}
                </div>
                <ArrowUpRight className="size-3.5 shrink-0 text-fg-faint opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )
          })}
          {items.length === 0 && (
            <div className="bg-panel px-3 py-8 text-center text-[13px] text-fg-muted">
              Nothing here yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
