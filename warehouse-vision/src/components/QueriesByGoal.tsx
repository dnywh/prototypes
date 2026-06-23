import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import { goals } from '../model/goals'
import { SectionLabel } from './primitives'
import { GoalRow } from './GoalRow'
import { useVision } from '../state/store'

export function QueriesByGoal() {
  const [open, setOpen] = useState(false)
  const { activeEvidence } = useVision()

  useEffect(() => {
    if (activeEvidence?.source === 'goal') setOpen(true)
  }, [activeEvidence])

  return (
    <section className="mb-8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="wv-focus-ring mb-2 flex w-full items-center gap-1.5 text-left"
      >
        <SectionLabel className="mb-0">Queries by goal</SectionLabel>
        <ChevronRight
          className={`size-3.5 shrink-0 text-fg-faint transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <span className="ml-auto text-[11px] text-fg-faint">{goals.length} items</span>
      </button>

      {open && (
        <div className="rounded-[var(--radius-panel)] border border-border bg-panel">
          {goals.map((goal) => (
            <GoalRow key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </section>
  )
}
