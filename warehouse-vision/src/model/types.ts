export type GoalStatus = 'ahead' | 'on-track' | 'at-risk'

export type Confidence = 'high' | 'medium' | 'low'

export interface Goal {
  id: string
  label: string
  target: string
  current: string
  status: GoalStatus
  sparkline: number[]
  progress: number
}

export interface EvidenceItem {
  text: string
  queryId: string
}

export interface Suggestion {
  id: string
  goalId: string
  action: string
  evidence: EvidenceItem[]
  queryIds: string[]
  confidence: Confidence
}

export interface LiveQuery {
  id: string
  label: string
  goalId: string
  sql: string
  timeWindow: string
  tables: string[]
  latencyMs: number
  rowCount: string
  sparkline: number[]
  insight: string
  sentiment: 'positive' | 'warning' | 'danger'
}

export type SourceConnection = 'in-warehouse' | 'attached' | 'external-feed'

export interface DataSource {
  id: string
  label: string
  type: 'postgres' | 'fdw' | 'external'
  connection: SourceConnection
  detail: string
}

export interface StandupMeta {
  confidence: Confidence
  queryCount: number
}

export type StandupTone = 'positive' | 'warning' | 'danger'

export interface StandupCitation {
  ref: number
  queryId: string
}

export interface StandupSegment {
  text: string
  tone?: StandupTone
  citation?: StandupCitation
}

export interface Standup {
  date: string
  paragraphs: StandupSegment[][]
  meta: StandupMeta
}

export interface PaletteAnswer {
  id: string
  triggers: string[]
  question: string
  answer: string
  evidence: EvidenceItem[]
  confidence: Confidence
  queryIds: string[]
}

export interface WarehouseStats {
  queryCount: number
  rowCount: string
  p95LatencyMs: number
}
