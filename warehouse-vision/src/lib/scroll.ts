import type { EvidenceSource } from '../state/store'

const HEADER_CLEARANCE = 88
const COMPOSER_CLEARANCE = 208

function isInSafeBand(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()
  return rect.top >= HEADER_CLEARANCE && rect.bottom <= window.innerHeight - COMPOSER_CLEARANCE
}

/** Scroll element into view, respecting scroll-margin and fixed chrome. */
export function scrollToElement(el: HTMLElement | null, force = false) {
  if (!el) return
  if (!force && isInSafeBand(el)) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const MAX_SCROLL_ATTEMPTS = 12

/** Retry until the evidence slot has mounted and finished its height animation. */
export function scrollToEvidenceSlot(source: EvidenceSource): () => void {
  let cancelled = false
  let attempts = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  const attempt = () => {
    if (cancelled) return

    const el = document.querySelector(
      `[data-evidence-slot="${source}"]`
    ) as HTMLElement | null

    if (el && el.getBoundingClientRect().height > 48) {
      scrollToElement(el, attempts >= 3)
      if (isInSafeBand(el) || attempts >= 3) return
    }

    attempts += 1
    if (attempts < MAX_SCROLL_ATTEMPTS) {
      timer = setTimeout(attempt, 60 + attempts * 40)
    }
  }

  timer = setTimeout(() => {
    requestAnimationFrame(() => requestAnimationFrame(attempt))
  }, 120)

  return () => {
    cancelled = true
    if (timer) clearTimeout(timer)
  }
}
