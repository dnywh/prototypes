export type EvidenceSource = 'standup' | 'action' | 'thread' | 'goal'

export interface ActiveFootnote {
  queryId: string
  source: EvidenceSource
  ref: number
  threadId?: string
}

export function isFootnoteActive(
  active: ActiveFootnote | null | undefined,
  target: ActiveFootnote
): boolean {
  if (!active || active.source !== target.source) return false
  if (target.source === 'thread') {
    return active.threadId === target.threadId && active.ref === target.ref
  }
  return active.queryId === target.queryId && active.ref === target.ref
}

export function footnoteContentKey(footnote: ActiveFootnote): string {
  if (footnote.source === 'thread') {
    return `${footnote.threadId}:${footnote.ref}`
  }
  return `${footnote.source}:${footnote.queryId}:${footnote.ref}`
}
