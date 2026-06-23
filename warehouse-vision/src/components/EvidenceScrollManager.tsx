import { useEffect, useRef } from 'react'

import { scrollToEvidenceSlot } from '../lib/scroll'
import type { EvidenceSource } from '../state/store'
import { useVision } from '../state/store'

/** Scroll only when evidence opens or moves to a different slot — not on in-slot query swaps. */
export function EvidenceScrollManager() {
  const { activeEvidence } = useVision()
  const prevSource = useRef<EvidenceSource | null>(null)

  useEffect(() => {
    if (!activeEvidence) {
      prevSource.current = null
      return
    }

    const source = activeEvidence.source
    const shouldScroll = prevSource.current !== source
    prevSource.current = source

    if (shouldScroll) {
      return scrollToEvidenceSlot(source)
    }
  }, [activeEvidence])

  return null
}
