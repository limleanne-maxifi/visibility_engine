// lib/types-v2.ts
// Types-only — no runtime code. All interfaces exported.
// Generated from docs/system-design.md sections 1, 2, and 7.

// ─── Section IDs ──────────────────────────────────────────────────────────────

export type SectionId =
  | 'citation_snapshot'        // free  (section 1)
  | 'failure_mode_diagnosis'   // free  (section 2)
  | 'platform_visibility'      // free  (section 3)
  | 'benchmark_comparison'     // free  (section 4)
  | 'competitor_displacement'  // locked (section 5)
  | 'positioning_gap'          // locked (section 6)
  | 'query_gap'                // locked (section 7)
  | 'action_queue';            // locked (section 8)

export type PlatformStatus = 'cited' | 'displaced' | 'missing' | 'inaccurate' | 'stale' | 'unknown';
export type FixCategory = 'content_structure' | 'brand_authority' | 'third_party_references' | 'competitor_gap';
export type FailureMode = 'not_structured' | 'low_authority' | 'displaced' | 'inaccurate' | 'stale' | 'untested';
export type EffortLevel = 'low' | 'medium' | 'high';
export type ImpactLevel = 'low' | 'medium' | 'high';
export type Confidence = 'computed' | 'ai_generated' | 'placeholder';
export type ReportTier = 'free' | 'full';
export type UnlockMethod = 'stripe' | 'admin' | 'coupon';
export type ScoreConfidence = 'self_reported' | 'undiagnosed';

// ─── Section 1 — Citation Snapshot ───────────────────────────────────────────

export interface CitationPlatform {
  name: string;
  status: PlatformStatus;
  search_url: string;
  badge_label: string;
}

export interface CitationSnapshotData {
  platforms: CitationPlatform[];
  query_used: string;
  query_is_generic: boolean;
  tested_date: string;
}

// ─── Section 2 — Failure Mode Diagnosis ──────────────────────────────────────

export interface RootCause {
  rank: number;
  cause: string;
  fix_category: FixCategory;
}

export interface FailureModeData {
  opportunity_headline: string;
  opportunity_body: string;
  root_causes: RootCause[];
  primary_failure_mode: FailureMode;
}

// ─── Section 3 — Platform Visibility ─────────────────────────────────────────

export interface PlatformVisibilityEntry {
  name: string;
  status: PlatformStatus;
  notes: string | null;
}

export interface PlatformVisibilityData {
  platforms: PlatformVisibilityEntry[];
  checked_count: number;
  unchecked_platforms: string[];
}

// ─── Section 4 — Benchmark Comparison ────────────────────────────────────────

export interface BenchmarkData {
  score: number;
  benchmark: number;
  industry: string;
  gap: number;
  buyer_x: number;
  buyer_y: number;
  score_confidence: ScoreConfidence;
  benchmark_note: string;
}

// ─── Section 5 — Competitor Displacement (locked) ────────────────────────────

export interface CompetitorAssessment {
  name: string;
  ai_generated_assessment: string;
  displacement_likely: boolean;
}

export interface CompetitorDisplacementData {
  competitors: CompetitorAssessment[];
  displacement_summary: string;
  ai_narrative: string;
}

// ─── Section 6 — Positioning Gap (locked) ────────────────────────────────────

export interface PositioningGapData {
  gap_summary: string;
  positioning_provided: string | null;
  website_url: string | null;
  content_structure_issues: string[];
  recommended_angle: string;
  ai_narrative: string;
}

// ─── Section 7 — Query Gap (locked) ──────────────────────────────────────────

export interface QueryGapData {
  queries_provided: string[];
  queries_derived: string[];
  coverage_assessment: string;
  missing_query_types: string[];
  recommended_queries: string[];
  ai_narrative: string;
}

// ─── Section 8 — 60-Day Action Queue (locked) ────────────────────────────────

export interface ActionStep {
  num: number;
  week: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  title: string;
  body: string;
  effort: EffortLevel;
  impact: ImpactLevel;
  section_reference: SectionId;
}

export interface ActionQueueData {
  steps: ActionStep[];
  quick_win: string;
  total_steps: number;
}

// ─── ReportSection wrapper ────────────────────────────────────────────────────

export type SectionData =
  | CitationSnapshotData
  | FailureModeData
  | PlatformVisibilityData
  | BenchmarkData
  | CompetitorDisplacementData
  | PositioningGapData
  | QueryGapData
  | ActionQueueData;

export interface ReportSection {
  id: SectionId;
  version: number;
  generated_at: string;
  inputs_hash: string;
  data: SectionData;
  confidence: Confidence;
  warnings: string[];
}

// ─── Section group types (Pick from a shared map) ────────────────────────────

export interface AllReportSections {
  citation_snapshot: CitationSnapshotData;
  failure_mode_diagnosis: FailureModeData;
  platform_visibility: PlatformVisibilityData;
  benchmark_comparison: BenchmarkData;
  competitor_displacement: CompetitorDisplacementData;
  positioning_gap: PositioningGapData;
  query_gap: QueryGapData;
  action_queue: ActionQueueData;
}

export type FreeReportSections = Pick<
  AllReportSections,
  'citation_snapshot' | 'failure_mode_diagnosis' | 'platform_visibility' | 'benchmark_comparison'
>;

export type FullReportSections = Pick<
  AllReportSections,
  'competitor_displacement' | 'positioning_gap' | 'query_gap' | 'action_queue'
>;

// ─── API response interfaces (section 7 of system-design.md) ─────────────────

export interface GenerateResponse {
  snapshot_id: string;
  token: string;
  report: FreeReportSections;
}

export interface FreeReportResponse {
  snapshot_id: string;
  sections: FreeReportSections;
  is_unlocked: boolean;
}

export interface FullReportResponse {
  snapshot_id: string;
  sections: FullReportSections;
}

export interface GeneratingResponse {
  status: 'generating';
}

export interface PaymentRequiredResponse {
  code: 'PAYMENT_REQUIRED';
  checkout_url: string;
}

export interface GateRequest {
  email: string;
  snapshot_id: string;
}

export interface GateResponse {
  status: 'sent' | 'already_verified';
}

export interface CheckoutRequest {
  snapshot_id: string;
}

export interface CheckoutResponse {
  checkout_url: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
}

// ─── Database row types (mirrors Postgres schema in section 2) ────────────────

export interface LeadRow {
  id: string;
  created_at: string;
  email: string;
  first_name: string;
  email_verified: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

export interface SnapshotRow {
  id: string;
  lead_id: string;
  created_at: string;
  occupation: string;
  industry: string;
  company_name: string | null;
  website_url: string | null;
  awareness: string;
  platform: string;
  platform_other: string | null;
  challenges: string[] | null;
  aeo_outcome: string | null;
  competitors: string | null;
  positioning: string | null;
  target_queries: string | null;
  session_id: string | null;
}

export interface ReportRow {
  id: string;
  snapshot_id: string;
  created_at: string;
  version: number;
  tier: ReportTier;
  citation_snapshot: CitationSnapshotData | null;
  failure_mode_diagnosis: FailureModeData | null;
  platform_visibility: PlatformVisibilityData | null;
  benchmark_comparison: BenchmarkData | null;
  competitor_displacement: CompetitorDisplacementData | null;
  positioning_gap: PositioningGapData | null;
  query_gap: QueryGapData | null;
  action_queue: ActionQueueData | null;
  generation_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
}

export interface UnlockEventRow {
  id: string;
  report_id: string;
  snapshot_id: string;
  lead_id: string;
  created_at: string;
  method: UnlockMethod;
  stripe_session_id: string | null;
  stripe_payment_id: string | null;
  amount_cents: number | null;
  currency: string;
  coupon_code: string | null;
}

export interface ReportTokenRow {
  id: string;
  snapshot_id: string;
  token: string;
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
  revoked: boolean;
  email_verified_at: string | null;  // set on magic-link click (section 5.7)
}
