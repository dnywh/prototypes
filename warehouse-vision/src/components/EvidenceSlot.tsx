import { AnimatePresence, motion } from 'framer-motion'
import { useRef } from 'react'

import { footnoteContentKey } from '../lib/evidence'
import { sentimentQuoteLine } from '../lib/sentiment'
import { getQuery } from '../model/queries'
import type { EvidenceSource } from '../state/store'
import { useVision } from '../state/store'
import { FootnotePill } from './FootnotePill'
import { LiveQueryCard } from './LiveQueryCard'

const slotMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const },
}

const cardMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.12, ease: 'easeOut' as const },
}

interface EvidenceSlotProps {
  source: EvidenceSource
}

export function EvidenceSlot({ source }: EvidenceSlotProps) {
  const { activeEvidence, openEvidence } = useVision()
  const sectionRef = useRef<HTMLElement>(null)
  const show = activeEvidence?.source === source
  const query = show && activeEvidence ? getQuery(activeEvidence.queryId) : null

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {show && query && activeEvidence && (
        <motion.section
          ref={sectionRef}
          key={source}
          data-evidence-slot={source}
          {...slotMotion}
          className="mb-6 scroll-mt-24 scroll-mb-52"
        >
          <div className="flex items-stretch gap-3">
            <div className="flex shrink-0 flex-col items-center pt-0.5">
              <FootnotePill
                align="slot"
                n={activeEvidence.ref}
                active
                sentiment={query.sentiment}
                onClick={() => openEvidence(activeEvidence)}
              />
              <div
                className={`mt-1.5 w-0.5 min-h-4 flex-1 rounded-full ${sentimentQuoteLine[query.sentiment]}`}
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={footnoteContentKey(activeEvidence)} {...cardMotion}>
                  <LiveQueryCard query={query} expanded />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
