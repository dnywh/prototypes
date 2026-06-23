import { useDemoMode } from '../state/store'
import { AppHeader } from './AppHeader'
import { DataFabricPopover } from './DataFabricPopover'
import { EvidenceScrollManager } from './EvidenceScrollManager'
import { EvidenceSlot } from './EvidenceSlot'
import { RecommendedActions } from './RecommendedActions'
import { StandupHero } from './StandupHero'
import { ThreadComposer } from './ThreadComposer'
import { QueriesByGoal } from './QueriesByGoal'
import { ThreadContinuations } from './ThreadContinuations'

export function Shell() {
  useDemoMode()

  return (
    <div className="flex min-h-full flex-col px-4">
      <AppHeader />
      <EvidenceScrollManager />

      <main className="mx-auto w-full max-w-2xl flex-1 pb-44 pt-30">
        <StandupHero />
        <EvidenceSlot source="standup" />
        <RecommendedActions />
        <EvidenceSlot source="action" />
        <QueriesByGoal />
        <EvidenceSlot source="goal" />
        <ThreadContinuations />
        <EvidenceSlot source="thread" />
      </main>

      <ThreadComposer />
      <DataFabricPopover />
    </div>
  )
}
