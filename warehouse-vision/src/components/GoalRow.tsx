import { ChevronRight } from 'lucide-react'

import { isFootnoteActive } from '../lib/evidence'
import { sentimentColor } from '../lib/sentiment'
import { getQueriesForGoal } from '../model/queries'
import type { Goal, GoalStatus } from '../model/types'
import { useVision } from '../state/store'
import { FootnotePill } from './FootnotePill'
import { Badge } from './primitives'
import { Sparkline } from './Sparkline'

const statusTone: Record<GoalStatus, 'brand' | 'amber'> = {
  ahead: 'brand',
  'on-track': 'brand',
  'at-risk': 'amber',
}

const statusLabel: Record<GoalStatus, string> = {
  ahead: 'Ahead',
  'on-track': 'On track',
  'at-risk': 'At risk',
}

const sparkColor: Record<GoalStatus, string> = {
  ahead: sentimentColor.positive,
  'on-track': sentimentColor.positive,
  'at-risk': sentimentColor.warning,
}

interface GoalRowProps {
  goal: Goal
}

export function GoalRow({ goal }: GoalRowProps) {
  const { selectedGoalId, toggleGoal, openEvidence, activeEvidence } = useVision()

  const expanded = selectedGoalId === goal.id
  const queries = getQueriesForGoal(goal.id)

  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => toggleGoal(goal.id)}
        className="wv-focus-ring flex w-full items-center gap-2 text-left"
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="text-[13px] font-medium text-fg">{goal.label}</span>
          <ChevronRight
            className={`size-3.5 shrink-0 text-fg-faint transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
          <Badge tone={statusTone[goal.status]}>{statusLabel[goal.status]}</Badge>
        </div>
        <Sparkline data={goal.sparkline} color={sparkColor[goal.status]} width={48} height={20} />
      </button>

      {expanded && (
        <ul className="mt-4 mb-1 space-y-2">
          {queries.map((q, idx) => {
            const ref = idx + 1
            const target = {
              queryId: q.id,
              source: 'goal' as const,
              ref,
            }
            return (
              <li key={q.id} className="flex items-start gap-1 text-[12px] text-fg-light">
                <span className="flex-1">{q.insight}</span>
                <FootnotePill
                  n={ref}
                  active={isFootnoteActive(activeEvidence, target)}
                  sentiment={q.sentiment}
                  onClick={() => openEvidence(target)}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
