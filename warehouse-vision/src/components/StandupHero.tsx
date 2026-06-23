import { standup } from '../model/standup'
import type { StandupTone } from '../model/types'
import { isFootnoteActive } from '../lib/evidence'
import { allQueryIds, getQuery } from '../model/queries'
import { useVision } from '../state/store'
import { FootnotePill } from './FootnotePill'
import { InsightMeta } from './InsightMeta'

const toneClass: Record<StandupTone, string> = {
  positive: 'text-brand',
  warning: 'text-amber',
  danger: 'text-red',
}

export function StandupHero() {
  const { activeEvidence, openEvidence } = useVision()

  return (
    <section className="mb-6">
      <h1 className="mb-5 text-[13px] font-medium uppercase tracking-wider text-fg-faint">
        Today&apos;s standup
      </h1>

      <div className="space-y-4">
        {standup.paragraphs.map((paragraph, pIdx) => (
          <p
            key={pIdx}
            className="text-[26px] font-medium leading-[1.35] tracking-[-0.02em] text-fg md:text-[30px] text-balance"
          >
            {paragraph.map((seg, i) => (
              <span key={i} className={seg.tone ? toneClass[seg.tone] : undefined}>
                {seg.text}
                {seg.citation && (
                  <FootnotePill
                    align="hero"
                    n={seg.citation.ref}
                    active={isFootnoteActive(activeEvidence, {
                      queryId: seg.citation.queryId,
                      source: 'standup',
                      ref: seg.citation.ref,
                    })}
                    sentiment={getQuery(seg.citation.queryId)?.sentiment}
                    onClick={() =>
                      openEvidence({
                        queryId: seg.citation!.queryId,
                        source: 'standup',
                        ref: seg.citation!.ref,
                      })
                    }
                  />
                )}
              </span>
            ))}
          </p>
        ))}
      </div>

      <InsightMeta
        className="mt-4"
        confidence={standup.meta.confidence}
        queryIds={allQueryIds}
      />
    </section>
  )
}
