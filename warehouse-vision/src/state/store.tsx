import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { type ActiveFootnote, isFootnoteActive } from '../lib/evidence'
import { getQuery } from '../model/queries'
import { paletteAnswers } from '../model/palette-answers'
import type { PaletteAnswer } from '../model/types'

export type { ActiveFootnote, EvidenceSource } from '../lib/evidence'

export interface ThreadContinuation {
  id: string
  answer: PaletteAnswer
}

interface PendingFollowUp {
  id: string
  answer: PaletteAnswer
}

interface VisionState {
  activeEvidence: ActiveFootnote | null
  selectedGoalId: string | null
  suggestionWhyOpen: Record<string, boolean>
  threadContinuations: ThreadContinuation[]
  pendingFollowUp: PendingFollowUp | null
  dataFabricOpen: boolean
  dataFabricQueryIds: string[] | null
  openEvidence: (target: ActiveFootnote) => void
  toggleGoal: (id: string) => void
  toggleSuggestionWhy: (id: string) => void
  requestThreadContinuation: (answer: PaletteAnswer) => void
  openDataFabric: (queryIds: string[]) => void
  setDataFabricOpen: (open: boolean) => void
}

const VisionContext = createContext<VisionState | null>(null)

const DEFAULT_WHY_OPEN: Record<string, boolean> = {
  'recruit-hg-sellers': true,
}

const FOLLOW_UP_DELAY_MS = 800

let continuationId = 0

export function VisionProvider({ children }: { children: ReactNode }) {
  const [activeEvidence, setActiveEvidence] = useState<ActiveFootnote | null>(null)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [suggestionWhyOpen, setSuggestionWhyOpen] =
    useState<Record<string, boolean>>(DEFAULT_WHY_OPEN)
  const [threadContinuations, setThreadContinuations] = useState<ThreadContinuation[]>([])
  const [pendingFollowUp, setPendingFollowUp] = useState<PendingFollowUp | null>(null)
  const [dataFabricOpen, setDataFabricOpenState] = useState(false)
  const [dataFabricQueryIds, setDataFabricQueryIds] = useState<string[] | null>(null)
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openEvidence = useCallback((target: ActiveFootnote) => {
    setActiveEvidence((prev) => (isFootnoteActive(prev, target) ? null : target))

    const query = getQuery(target.queryId)
    if (target.source === 'goal' && query?.goalId) {
      setSelectedGoalId(query.goalId)
    }
  }, [])

  const toggleGoal = useCallback((id: string) => {
    setSelectedGoalId((prev) => (prev === id ? null : id))
  }, [])

  const openDataFabric = useCallback((queryIds: string[]) => {
    setDataFabricQueryIds(queryIds)
    setDataFabricOpenState(true)
  }, [])

  const setDataFabricOpen = useCallback((open: boolean) => {
    setDataFabricOpenState(open)
    if (!open) setDataFabricQueryIds(null)
  }, [])

  const toggleSuggestionWhy = useCallback((id: string) => {
    setSuggestionWhyOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const requestThreadContinuation = useCallback((answer: PaletteAnswer) => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current)

    continuationId += 1
    const id = `thread-${continuationId}`
    setPendingFollowUp({ id, answer })
    setActiveEvidence(null)

    pendingTimer.current = setTimeout(() => {
      setPendingFollowUp(null)
      setThreadContinuations((prev) => [...prev, { id, answer }])
      pendingTimer.current = null
    }, FOLLOW_UP_DELAY_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current)
    }
  }, [])

  const value = useMemo(
    () => ({
      activeEvidence,
      selectedGoalId,
      suggestionWhyOpen,
      threadContinuations,
      pendingFollowUp,
      dataFabricOpen,
      dataFabricQueryIds,
      openEvidence,
      toggleGoal,
      toggleSuggestionWhy,
      requestThreadContinuation,
      openDataFabric,
      setDataFabricOpen,
    }),
    [
      activeEvidence,
      selectedGoalId,
      suggestionWhyOpen,
      threadContinuations,
      pendingFollowUp,
      dataFabricOpen,
      dataFabricQueryIds,
      openEvidence,
      toggleGoal,
      toggleSuggestionWhy,
      requestThreadContinuation,
      openDataFabric,
      setDataFabricOpen,
    ]
  )

  return <VisionContext.Provider value={value}>{children}</VisionContext.Provider>
}

export function useVision() {
  const ctx = useContext(VisionContext)
  if (!ctx) throw new Error('useVision must be used within VisionProvider')
  return ctx
}

export function useDemoMode() {
  const { openEvidence, requestThreadContinuation } = useVision()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') !== '1') return

    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(
      setTimeout(
        () =>
          openEvidence({
            queryId: 'category_supply_demand_ratio',
            source: 'standup',
            ref: 2,
          }),
        2000
      )
    )
    timers.push(setTimeout(() => requestThreadContinuation(paletteAnswers[0]), 5000))

    return () => timers.forEach(clearTimeout)
  }, [openEvidence, requestThreadContinuation])
}
