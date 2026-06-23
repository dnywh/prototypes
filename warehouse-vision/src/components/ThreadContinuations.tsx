import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

import { isFootnoteActive } from '../lib/evidence'
import { getQuery } from '../model/queries'
import { scrollToElement } from '../lib/scroll'
import type { PaletteAnswer } from '../model/types'
import { useVision } from '../state/store'
import { FootnotePill } from './FootnotePill'
import { InsightMeta } from './InsightMeta'

const itemMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const },
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-fg-muted wv-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}

function ThreadItem({ threadId, answer }: { threadId: string; answer: PaletteAnswer }) {
  const { activeEvidence, openEvidence } = useVision()

  return (
    <motion.div className="space-y-3" {...itemMotion}>
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-border bg-elevated px-4 py-2.5 text-[13px] text-fg-light">
          {answer.question}
        </div>
      </div>
      <div className="max-w-[95%] text-[13px] leading-relaxed text-fg-light">{answer.answer}</div>
      {answer.evidence.length > 0 && (
        <ul className="space-y-1.5">
          {answer.evidence.map((item, idx) => {
            const ref = idx + 1
            const target = {
              queryId: item.queryId,
              source: 'thread' as const,
              ref,
              threadId,
            }
            return (
              <li key={`${threadId}:${ref}`} className="flex items-start gap-1 text-[12px] text-fg-muted">
                <span className="flex-1">{item.text}</span>
                <FootnotePill
                  n={ref}
                  active={isFootnoteActive(activeEvidence, target)}
                  sentiment={getQuery(item.queryId)?.sentiment}
                  onClick={() => openEvidence(target)}
                />
              </li>
            )
          })}
        </ul>
      )}
      <InsightMeta confidence={answer.confidence} queryIds={answer.queryIds} />
    </motion.div>
  )
}

function PendingFollowUp() {
  const { pendingFollowUp } = useVision()
  if (!pendingFollowUp) return null

  return (
    <motion.div className="space-y-3" {...itemMotion}>
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-border bg-elevated px-4 py-2.5 text-[13px] text-fg-light">
          {pendingFollowUp.answer.question}
        </div>
      </div>
      <TypingIndicator />
    </motion.div>
  )
}

export function ThreadContinuations() {
  const { threadContinuations, pendingFollowUp } = useVision()
  const ref = useRef<HTMLElement>(null)
  const prevCount = useRef(threadContinuations.length)

  useEffect(() => {
    if (!pendingFollowUp && threadContinuations.length === prevCount.current) return
    prevCount.current = threadContinuations.length

    const delay = pendingFollowUp ? 80 : 300
    const timer = setTimeout(() => scrollToElement(ref.current, true), delay)
    return () => clearTimeout(timer)
  }, [pendingFollowUp, threadContinuations.length])

  if (threadContinuations.length === 0 && !pendingFollowUp) return null

  return (
    <section ref={ref} className="mb-6 scroll-mb-48 space-y-8">
      <AnimatePresence initial={false}>
        {threadContinuations.map((item) => (
          <ThreadItem key={item.id} threadId={item.id} answer={item.answer} />
        ))}
      </AnimatePresence>
      <AnimatePresence>{pendingFollowUp && <PendingFollowUp key="pending" />}</AnimatePresence>
    </section>
  )
}
