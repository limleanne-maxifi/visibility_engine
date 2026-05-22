// ─── Report data contract ─────────────────────────────────────────────────────
// This type is the single source of truth between:
//   1. The /r/[token] presentation layer (this stage)
//   2. The Claude teaser generator (Stage 3)
//   3. The Python visibility engine's measured JSON output (Stage 6)
//
// Free sections (s1–s4) are ASSESSMENTS based on self-reported data.
// Paid sections (s5–s8) are MEASUREMENTS from the engine's live AI testing.
// Never use measurement language ("we found", "X% of queries") in free sections.

// ─── Meta & score ─────────────────────────────────────────────────────────────

export interface ReportMeta {
  token: string
  generatedAt: string       // ISO 8601
  entityName: string        // company name (or lead name if no company)
  industry: string
  occupation: string
  website: string | null
  paid: boolean
}

export type ScoreBand = 'Critical' | 'Low' | 'Developing' | 'Established' | 'Strong'

export interface ScoreData {
  /** 0–100 estimated visibility score */
  score: number
  band: ScoreBand
  /** Industry median for benchmarking */
  benchmarkAvg: number
  benchmarkLabel: string    // e.g. "B2B SaaS / Enterprise Software average"
  /** One-sentence caveat displayed alongside the score */
  scoringNote: string
}

// ─── Section 1 — Visibility Assessment (FREE) ────────────────────────────────
// Qualitative; based on self-reported testing. Never claims measurement.

export type PlatformStatus =
  | 'likely-present'
  | 'likely-absent'
  | 'competitor-cited'
  | 'cited-with-issues'
  | 'not-tested'

export interface PlatformAssessmentRow {
  platform: string
  status: PlatformStatus
  /** Short qualitative note — "Based on your testing" or "Not yet checked" */
  note: string
}

export interface VisibilityAssessmentSection {
  headline: string
  summary: string
  platforms: PlatformAssessmentRow[]
  /** Honesty footer — always rendered below the platform table */
  assessmentCaveat: string
}

// ─── Section 2 — Failure Mode Diagnosis (FREE) ───────────────────────────────

export type FailureModeKey =
  | 'not-cited'
  | 'competitor-displaced'
  | 'cited-inaccurately'
  | 'cited-stale'
  | 'untested'

export interface DiagnosisSection {
  failureMode: FailureModeKey
  modeLabel: string
  severity: 'high' | 'medium' | 'low'
  headline: string
  explanation: string
  rootCauses: string[]
  likelyImpact: string
}

// ─── Section 3 — Platform Priority Overview (FREE) ───────────────────────────
// Qualitative priority — not measured citation percentages.

export type PlatformPriority = 'primary' | 'secondary' | 'monitor'
export type BuyerPresence = 'high' | 'medium' | 'low'

export interface PlatformPriorityRow {
  platform: string
  priority: PlatformPriority
  /** Why this platform matters for this industry/buyer model */
  rationale: string
  /** How much buyers in this sector actually use this platform */
  buyerPresence: BuyerPresence
}

export interface PlatformPrioritySection {
  headline: string
  summary: string
  platforms: PlatformPriorityRow[]
  /** Qualitative caveat — not measured percentages */
  priorityNote: string
}

// ─── Section 4 — Positioning vs. Sector Assessment (FREE) ────────────────────

export type AlignmentLevel = 'strong' | 'partial' | 'weak' | 'missing'

export interface PositioningAssessmentSection {
  headline: string
  /** The positioning statement the lead provided */
  entityPositioning: string
  sectorContext: string
  alignmentLevel: AlignmentLevel
  alignmentLabel: string
  observations: string[]
  opportunities: string[]
  assessmentCaveat: string
}

// ─── Section 5 — Competitor Displacement (PAID / MEASURED) ───────────────────

export interface CompetitorEntry {
  name: string
  /** Which platforms cite them instead of the entity */
  platforms: string[]
  /** Structural reason they're winning */
  advantage: string
  /** What the entity specifically lacks vs this competitor */
  yourGap: string
}

export interface CompetitorDisplacementSection {
  headline: string
  summary: string
  competitors: CompetitorEntry[]
  displacementPattern: string
  queriesAnalyzed: number
}

// ─── Section 6 — Positioning Gap Report (PAID / MEASURED) ────────────────────

export type GapSeverity = 'high' | 'medium' | 'low'

export interface PositioningGapItem {
  gap: string
  severity: GapSeverity
  fixApproach: string
}

export interface PositioningGapSection {
  headline: string
  currentPerception: string
  targetPerception: string
  gapScore: number          // 0–100; 0 = perfect alignment
  gaps: PositioningGapItem[]
  urgencyNote: string
}

// ─── Section 7 — Target Query Coverage (PAID / MEASURED) ─────────────────────

export type QueryStatus =
  | 'present'
  | 'competitor-cited'
  | 'not-appearing'
  | 'inaccurate'

export interface QueryCoverageRow {
  query: string
  status: QueryStatus
  /** Competitor cited instead, if applicable */
  competitorCited?: string
  /** For status=inaccurate: what the AI got wrong */
  inaccuracyDetail?: string
  /** For status=inaccurate: recommended one-line fix */
  fixSuggestion?: string
  priority: 'high' | 'medium' | 'low'
}

export interface QueryGapSection {
  headline: string
  summary: string
  queries: QueryCoverageRow[]
  primaryPlatform: string
  queriesAnalyzed: number
  queriesWon: number
}

// ─── Section 8 — 60-Day Action Queue (PAID / MEASURED) ───────────────────────

export type ActionCategory = 'content' | 'authority' | 'technical' | 'competitive'
export type EffortLevel = 'low' | 'medium' | 'high'

export interface ActionItem {
  week: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  title: string
  description: string
  effort: EffortLevel
  impact: 'high' | 'medium' | 'low'
  category: ActionCategory
}

export interface ActionQueueSection {
  headline: string
  /** A single action completable today in < 30 min */
  quickWin: string
  actions: ActionItem[]
  expectedOutcome: string
}

// ─── Full report data object ──────────────────────────────────────────────────

export interface ReportData {
  meta: ReportMeta
  score: ScoreData

  // Free sections — always populated
  s1Visibility: VisibilityAssessmentSection
  s2Diagnosis: DiagnosisSection
  s3Platforms: PlatformPrioritySection
  s4Positioning: PositioningAssessmentSection

  // Paid sections — null when report is not paid.
  // When null, the renderer shows a locked blurred-preview card.
  s5Competitors: CompetitorDisplacementSection | null
  s6PositioningGap: PositioningGapSection | null
  s7QueryGap: QueryGapSection | null
  s8ActionQueue: ActionQueueSection | null

  // CTAs
  reportPrice: string       // e.g. "$249"
  unlockUrl: string         // checkout / upgrade URL
  calendlyUrl: string       // book-a-walkthrough URL
}
