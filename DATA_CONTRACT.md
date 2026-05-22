# DATA_CONTRACT.md
## AI Visibility Engine — Measured Output Contract
### Visibility View · Stage 6

**Status:** FROZEN — v1 contract. Engine build may proceed against this document.  
**Source of truth:** `lib/reportTypes.ts` (TypeScript interface `ReportData`)  
**Renderer:** `components/report/ReportPage.tsx`  
**Last updated:** 2026-05-22

---

## 1. Full Type Reference

The TypeScript interface below is the single source of truth. The engine's output must satisfy it exactly for the paid render to be complete.

```typescript
// ─── Meta & score ─────────────────────────────────────────────────────────────

interface ReportMeta {
  token: string           // UUID — do not change
  generatedAt: string     // ISO 8601 — update to engine run timestamp
  entityName: string      // company/lead name — do not change
  industry: string        // do not change
  occupation: string      // do not change
  website: string | null  // do not change
  paid: boolean           // teaser: false → fulfillment script sets true
}

type ScoreBand = 'Critical' | 'Low' | 'Developing' | 'Established' | 'Strong'

interface ScoreData {
  score: number           // 0–100 integer; measured in paid report
  band: ScoreBand         // derived from measured score
  benchmarkAvg: number    // industry median — may preserve teaser value
  benchmarkLabel: string  // e.g. "B2B SaaS / Enterprise Software average"
  scoringNote: string     // shown only in free tier; update for paid
}

// ─── Free sections (S1–S4) — ASSESSMENT, owned by Claude teaser ──────────────
// Engine must NOT modify these.

interface VisibilityAssessmentSection { ... }   // s1Visibility
interface DiagnosisSection            { ... }   // s2Diagnosis
interface PlatformPrioritySection     { ... }   // s3Platforms
interface PositioningAssessmentSection{ ... }   // s4Positioning

// ─── Paid sections (S5–S8) — MEASURED, owned by engine ───────────────────────

interface CompetitorDisplacementSection { ... } // s5Competitors
interface PositioningGapSection         { ... } // s6PositioningGap
interface QueryGapSection               { ... } // s7QueryGap
interface ActionQueueSection            { ... } // s8ActionQueue

// ─── Full object ──────────────────────────────────────────────────────────────

interface ReportData {
  meta:             ReportMeta
  score:            ScoreData
  s1Visibility:     VisibilityAssessmentSection    // FREE — do not touch
  s2Diagnosis:      DiagnosisSection               // FREE — do not touch
  s3Platforms:      PlatformPrioritySection        // FREE — do not touch
  s4Positioning:    PositioningAssessmentSection   // FREE — do not touch
  s5Competitors:    CompetitorDisplacementSection | null  // null → locked
  s6PositioningGap: PositioningGapSection         | null  // null → locked
  s7QueryGap:       QueryGapSection               | null  // null → locked
  s8ActionQueue:    ActionQueueSection            | null  // null → locked
  reportPrice:      string   // do not change
  unlockUrl:        string   // do not change
  calendlyUrl:      string   // do not change
}
```

---

## 2. Producer Classification

Every field in `ReportData` has exactly one owner. The engine must produce `MEASURED` fields and must not modify `ASSESSMENT` fields.

| Field | Producer | Notes |
|---|---|---|
| `meta.token` | **Teaser** | UUID minted at form submit — preserve |
| `meta.generatedAt` | **Engine** (update) | Set to ISO 8601 timestamp of engine run |
| `meta.entityName` | **Teaser** | Preserve |
| `meta.industry` | **Teaser** | Preserve |
| `meta.occupation` | **Teaser** | Preserve |
| `meta.website` | **Teaser** | Preserve |
| `meta.paid` | **Fulfillment script** | Set `true` after Stripe payment confirmed |
| `score.score` | **Engine** | Replaces teaser estimate with measured 0–100 integer |
| `score.band` | **Engine** | Derived from measured score using band thresholds |
| `score.benchmarkAvg` | **Teaser** (preserve — v1) | Engine does NOT compute benchmark in v1. Fulfillment script preserves teaser's static value. No silent overwrite. |
| `score.benchmarkLabel` | **Teaser** (preserve — v1) | Same as above — preserved as-is by fulfillment script. |
| `score.scoringNote` | **Engine** (update) | Teaser note is hidden in paid render; update to measurement context |
| `s1Visibility` | **Teaser** | ASSESSMENT — do not touch |
| `s2Diagnosis` | **Teaser** | ASSESSMENT — do not touch |
| `s3Platforms` | **Teaser** | ASSESSMENT — do not touch |
| `s4Positioning` | **Teaser** | ASSESSMENT — do not touch |
| `s5Competitors` | **Engine** | Required for complete paid render |
| `s6PositioningGap` | **Engine** | Required for complete paid render |
| `s7QueryGap` | **Engine** | Required for complete paid render |
| `s8ActionQueue` | **Engine** | Required for complete paid render |
| `reportPrice` | **Teaser** | Preserve |
| `unlockUrl` | **Teaser** | Preserve |
| `calendlyUrl` | **Teaser** | Preserve |

---

## 3. Measured Fields — Full Contract

### 3.1 `score` (partial update)

The engine updates `score.score`, `score.band`, and `score.scoringNote` only. It does **not** emit `benchmarkAvg` or `benchmarkLabel` in v1 — those are preserved from the teaser by the fulfillment script.

```json
{
  "score": 42,
  "band": "Developing",
  "scoringNote": "Measured from live cross-LLM citation testing across 47 queries on 2026-05-22. Score reflects citation rate across ChatGPT, Perplexity, Google AI Overviews, and Microsoft Copilot."
}
```

**Field spec:**

| Field | Type | Constraint | Notes |
|---|---|---|---|
| `score` | `integer` | 0–100 inclusive | Measured citation rate composite; not estimated |
| `band` | `string` | `Critical` \| `Low` \| `Developing` \| `Established` \| `Strong` | Must match score: 0–20 → Critical, 21–40 → Low, 41–60 → Developing, 61–75 → Established, 76–100 → Strong |
| `benchmarkAvg` | — | **Omit in v1** | Fulfillment script preserves teaser value; engine must not include this field |
| `benchmarkLabel` | — | **Omit in v1** | Same — preserved from teaser |
| `scoringNote` | `string` | Non-empty | Hidden in paid render (`!paid` guard) but must be present for type completeness |

**Renderer behaviour:** `ScoreCircle` receives `showScore={paid}`. When `paid=true`, the numeric score is displayed definitively with no disclaimer. The `scoringNote` is **not rendered** in paid reports — it exists solely for the free teaser.

---

### 3.2 `s5Competitors` — Competitor Displacement Analysis

```json
{
  "headline": "Competitor Displacement Analysis",
  "summary": "Engine testing across 12 queries on ChatGPT and Perplexity found three vendors consistently cited in categories where Orbis Analytics could reasonably appear.",
  "competitors": [
    {
      "name": "Tableau",
      "platforms": ["ChatGPT", "Perplexity", "Google AI Overviews"],
      "advantage": "Extensive third-party coverage across analyst reports, G2, and Gartner Magic Quadrant. AI engines have high-confidence citations from multiple independent sources.",
      "yourGap": "Orbis Analytics lacks the volume of cross-platform citations that would let AI engines confidently select it alongside or instead of Tableau."
    }
  ],
  "displacementPattern": "In 9 of 12 tested queries, at least one of Tableau, Power BI, or Looker appeared in the AI response. The entity appeared in 0 of 12. Displacement is consistent across platforms and query types.",
  "queriesAnalyzed": 12
}
```

**Field spec:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `headline` | `string` | Yes | Displayed as section h2 |
| `summary` | `string` | Yes | 1–3 sentences; must reference actual query counts and platforms tested |
| `competitors` | `CompetitorEntry[]` | Yes | Minimum 1 entry; maximum ~5 for readability |
| `displacementPattern` | `string` | Yes | Narrative paragraph; must include numeric summary (e.g., "X of Y queries") |
| `queriesAnalyzed` | `integer` | Yes | Total queries run across all platforms; rendered as "{n} queries analysed" |

**`CompetitorEntry` spec:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | Yes | Competitor brand name; max 60 chars |
| `platforms` | `string[]` | Yes | **Hard vocabulary** — engine must use exactly: `"ChatGPT"`, `"Perplexity"`, `"Google AI Overviews"`, `"Microsoft Copilot"`, `"Claude"`, `"Gemini"`. No aliases. Enforce via constant/enum on the engine side. |
| `advantage` | `string` | Yes | Structural reason they appear; 1–3 sentences; no "you should" framing |
| `yourGap` | `string` | Yes | Entity-specific gap; must name the entity; 1–2 sentences |

---

### 3.3 `s6PositioningGap` — Positioning Gap Report

```json
{
  "headline": "Positioning Gap Report",
  "currentPerception": "AI engines currently have insufficient data to confidently describe Orbis Analytics. When prompted directly, ChatGPT produces a generic description ('a business analytics platform') that does not reflect the mid-market finance specialisation.",
  "targetPerception": "AI engines should cite Orbis Analytics as the specialist real-time analytics platform for mid-market finance and operations teams, distinguishing it from enterprise BI tools through its speed-to-insight and finance-specific workflows.",
  "gapScore": 74,
  "gaps": [
    {
      "gap": "Category ownership: no consistent claim to 'finance-specific analytics' across external sources",
      "severity": "high",
      "fixApproach": "Update G2, Capterra, Crunchbase, and LinkedIn Company page to consistently use 'finance analytics' and 'mid-market' in the category and description fields."
    }
  ],
  "urgencyNote": "Competitors with strong positioning in your category are actively building citations. Each quarter of inaction increases the effort required to displace them."
}
```

**Field spec:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `headline` | `string` | Yes | Section h2 |
| `currentPerception` | `string` | Yes | What AI engines currently say about the entity; cite specific platform and verbatim (paraphrased) AI response where possible |
| `targetPerception` | `string` | Yes | Desired future state; written as "AI engines should cite X as…" |
| `gapScore` | `integer` | Yes | 0–100; 0 = perfect alignment, 100 = complete misalignment. Renderer colours: ≤30 green, 31–60 amber, >60 red |
| `gaps` | `PositioningGapItem[]` | Yes | Minimum 2, maximum 5 items |
| `urgencyNote` | `string` | Yes | 1–2 sentences; rendered in amber callout box |

**`PositioningGapItem` spec:**

| Field | Type | Allowed values | Notes |
|---|---|---|---|
| `gap` | `string` | — | Short description of the gap; max ~120 chars for card layout |
| `severity` | `string` | `high` \| `medium` \| `low` | Rendered as colour pill: high=red, medium=amber, low=green |
| `fixApproach` | `string` | — | One-sentence actionable fix; starts with an imperative verb ("Update...", "Publish...", "Add...") |

---

### 3.4 `s7QueryGap` — Target Query Coverage

**v1 platform scope:** S7 reports ChatGPT only. `primaryPlatform` must be `"ChatGPT"`. The engine probes all four LLMs for scoring and S5 displacement narrative, but the query-by-query table in S7 covers ChatGPT exclusively — the dominant B2B buyer research platform. The `summary` field must frame this honestly (e.g., `"measured on ChatGPT, the platform your buyers use most"`). Multi-platform S7 rows are a v2 option only.

```json
{
  "headline": "Target Query Coverage",
  "summary": "Measured on ChatGPT, the platform your buyers use most: Orbis Analytics is not returning in any of the five target query categories. Competitors appear in four of the five.",
  "queries": [
    {
      "query": "best analytics platform for mid-market finance teams",
      "status": "competitor-cited",
      "competitorCited": "Tableau, Power BI",
      "priority": "high"
    },
    {
      "query": "real-time cash flow analytics for CFOs",
      "status": "not-appearing",
      "priority": "high"
    },
    {
      "query": "Orbis Analytics review",
      "status": "inaccurate",
      "inaccuracyDetail": "ChatGPT describes Orbis Analytics as 'a general-purpose BI tool for enterprise teams' — omitting the mid-market and finance-team specialisation.",
      "fixSuggestion": "Add Organisation schema to your home page with an explicit description of the mid-market finance focus; update G2 and Crunchbase 'About' fields to match.",
      "priority": "medium"
    }
  ],
  "primaryPlatform": "ChatGPT",
  "queriesAnalyzed": 5,
  "queriesWon": 0
}
```

**Field spec:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `headline` | `string` | Yes | Section h2 |
| `summary` | `string` | Yes | 1–2 sentences; must reference platform and total query results |
| `queries` | `QueryCoverageRow[]` | Yes | Minimum 3 rows; typically 5–10 |
| `primaryPlatform` | `string` | Yes | **Must be `"ChatGPT"` in v1.** The platform on which all S7 query tests were run; rendered as "Platform: {primaryPlatform}" |
| `queriesAnalyzed` | `integer` | Yes | Count of rows in `queries` array |
| `queriesWon` | `integer` | Yes | Count of rows where `status === 'present'`; rendered as "{queriesWon} of {queriesAnalyzed} queries won" |

**`QueryCoverageRow` spec:**

| Field | Type | Required | Allowed values / Notes |
|---|---|---|---|
| `query` | `string` | Yes | The exact query tested; max ~100 chars |
| `status` | `string` | Yes | `present` \| `competitor-cited` \| `not-appearing` \| `inaccurate` |
| `competitorCited` | `string` | Conditional | Required when `status === 'competitor-cited'`; comma-separated string if multiple (e.g., `"Tableau, Power BI"`). **Type is `string`, not `string[]`** |
| `inaccuracyDetail` | `string` | Conditional | Required when `status === 'inaccurate'`; quote or close paraphrase of what the AI actually said |
| `fixSuggestion` | `string` | Conditional | Required when `status === 'inaccurate'`; one-line imperative fix |
| `priority` | `string` | Yes | `high` \| `medium` \| `low` |

**Query status rendering:**

| Status value | Renderer label | Colour |
|---|---|---|
| `present` | Cited ✓ | Green |
| `competitor-cited` | Competitor cited | Amber-orange |
| `not-appearing` | Not appearing | Red |
| `inaccurate` | Cited — inaccurate | Amber |

---

### 3.5 `s8ActionQueue` — 60-Day Action Queue

```json
{
  "headline": "60-Day Action Queue",
  "quickWin": "Open your G2 profile today and update the 'About' field to include the exact phrase 'real-time analytics for mid-market finance teams.' Under 20 minutes and directly improves the external citation signal AI engines read.",
  "actions": [
    {
      "week": 1,
      "title": "Standardise your entity description across all platforms",
      "description": "Update G2, Capterra, Crunchbase, LinkedIn Company, and your About page to use the same core positioning statement. Consistency across sources is a primary AI citation signal.",
      "effort": "low",
      "impact": "high",
      "category": "authority"
    },
    {
      "week": 2,
      "title": "Publish two finance-specific case studies",
      "description": "Write case studies focused on measurable finance outcomes. Structure with Problem / Solution / Result format and include schema markup.",
      "effort": "high",
      "impact": "high",
      "category": "content"
    }
  ],
  "expectedOutcome": "Following this queue consistently should improve citation rate on primary platforms within 8–12 weeks. The G2, FAQ, and schema changes are the fastest-acting; the publication and review work compounds over time."
}
```

**Field spec:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `headline` | `string` | Yes | Section h2 |
| `quickWin` | `string` | Yes | Single action completable in < 30 min; rendered in gold callout box labelled "Do today — under 30 minutes" |
| `actions` | `ActionItem[]` | Yes | Minimum 5, maximum 8 items; must span multiple weeks |
| `expectedOutcome` | `string` | Yes | 2–3 sentences; rendered in footer callout box |

**`ActionItem` spec:**

| Field | Type | Allowed values | Notes |
|---|---|---|---|
| `week` | `integer` | `1` \| `2` \| `3` \| `4` \| `5` \| `6` \| `7` \| `8` | Actions grouped by week in renderer; must be in range 1–8 |
| `title` | `string` | — | Action title; max ~80 chars for card heading |
| `description` | `string` | — | 2–4 sentences of implementation detail |
| `effort` | `string` | `low` \| `medium` \| `high` | Rendered with colour: low=green, medium=amber, high=red |
| `impact` | `string` | `high` \| `medium` \| `low` | Rendered with colour: high=green, medium=amber, low=grey |
| `category` | `string` | `content` \| `authority` \| `technical` \| `competitive` | Rendered as coloured pill: content=blue, authority=purple, technical=teal, competitive=gold |

---

## 4. Engine Output Format

The engine produces a **partial JSON object** containing only the measured fields. The fulfillment script handles the merge (see Section 5).

```json
{
  "measuredAt": "2026-06-15T09:31:00.000Z",
  "score": {
    "score": 42,
    "band": "Developing",
    "scoringNote": "Measured from live cross-LLM citation testing across 47 queries on 2026-06-15."
    // benchmarkAvg and benchmarkLabel are NOT emitted — preserved from teaser by fulfillment script
  },
  "s5Competitors": {
    "headline": "Competitor Displacement Analysis",
    "summary": "...",
    "competitors": [ ... ],
    "displacementPattern": "...",
    "queriesAnalyzed": 12
  },
  "s6PositioningGap": {
    "headline": "Positioning Gap Report",
    "currentPerception": "...",
    "targetPerception": "...",
    "gapScore": 74,
    "gaps": [ ... ],
    "urgencyNote": "..."
  },
  "s7QueryGap": {
    "headline": "Target Query Coverage",
    "summary": "...",
    "queries": [ ... ],
    "primaryPlatform": "ChatGPT",
    "queriesAnalyzed": 5,
    "queriesWon": 0
  },
  "s8ActionQueue": {
    "headline": "60-Day Action Queue",
    "quickWin": "...",
    "actions": [ ... ],
    "expectedOutcome": "..."
  }
}
```

`measuredAt` is a top-level convenience field for the fulfillment script to write into `meta.generatedAt`. It is not part of `ReportData`.

---

## 5. Merge Rule

The fulfillment script receives the engine's measured JSON output and the existing `report_data` JSONB from Supabase, and produces the final paid `ReportData`.

**Preserve (do not overwrite):**
```
meta.token
meta.entityName
meta.industry
meta.occupation
meta.website
score.benchmarkAvg        (always — engine does not compute benchmark in v1)
score.benchmarkLabel      (always — engine does not compute benchmark in v1)
s1Visibility              (entire section)
s2Diagnosis               (entire section)
s3Platforms               (entire section)
s4Positioning             (entire section)
reportPrice
unlockUrl
calendlyUrl
```

**Overwrite with engine values:**
```
meta.generatedAt          ← engine's measuredAt
score.score               ← engine's measured score
score.band                ← engine's measured band
score.scoringNote         ← engine's measurement context note
s5Competitors             ← engine output (was null)
s6PositioningGap          ← engine output (was null)
s7QueryGap                ← engine output (was null)
s8ActionQueue             ← engine output (was null)
```

**Set by fulfillment script (not the engine):**
```
meta.paid                 ← true  (only after payment confirmed)
aeo_leads.paid            ← true  (the DB column, triggers paid render at /r/[token])
```

**Pseudocode:**
```python
existing = supabase.select("report_data").eq("report_token", token).single()
merged = deep_merge(existing["report_data"], {
    "meta": { "generatedAt": engine_output["measuredAt"] },
    "score": engine_output["score"],
    "s5Competitors":    engine_output["s5Competitors"],
    "s6PositioningGap": engine_output["s6PositioningGap"],
    "s7QueryGap":       engine_output["s7QueryGap"],
    "s8ActionQueue":    engine_output["s8ActionQueue"],
})
merged["meta"]["paid"] = True
supabase.update({
    "report_data": merged,
    "paid": True,
    "status": "report_delivered"
}).eq("report_token", token)
```

The `/r/[token]` renderer at `app/r/[token]/page.tsx` already handles the paid path: when `lead.paid === true`, it serves the stored `report_data` (which now has real S5–S8) and sets `meta.paid = true` at read time.

---

## 6. Resolved Decisions (v1 Frozen)

All five design questions from the initial contract draft have been resolved. The contract below is stable — engine build may proceed.

### DECISION-1: No s9 per-platform citation section

Per-platform citation is treated as **implicit** across S5 (competitor displacement, `competitors[].platforms[]`) and S7 (query coverage table). A dedicated `s9PlatformCitation` section will not be added. No type change, no renderer change.

**v1 scope limit:** The report does not show a standalone "here is how many times you were cited per platform" table. This is a known limitation. If a future client or analyst review surfaces a strong need for it, add `s9PlatformCitation` in v2.

### DECISION-2: S7 is single-platform — ChatGPT only

`s7QueryGap.primaryPlatform` must be `"ChatGPT"` in v1. The engine probes all four LLMs for the composite score and the S5 competitor displacement narrative, but the S7 query-by-query table covers **ChatGPT only** — the dominant B2B buyer research platform.

The `summary` field must frame this honestly. Acceptable form: `"Measured on ChatGPT, the platform your buyers use most: …"`. Do not imply multi-platform coverage in S7 copy.

Multi-platform query rows (adding a `platform` field to `QueryCoverageRow`) are a v2 option only. No type change needed for v1.

### DECISION-3: S1 stays assessment-tier in paid report — bridging note added

S1 is always `ASSESSMENT` (initial evaluation, not engine-measured). This is defensible: different evidence standards, different sections. The engine does not touch S1.

**Renderer change (implemented):** A one-line explanatory note is shown beneath the S1 assessment caveat in the paid report only:

> *Section 1 reflects our initial assessment; see Sections 5–7 for engine-measured results.*

This note appears only when `meta.paid === true`. No type change required.

### DECISION-4: Platform names are a hard vocabulary (enforced by engine)

`CompetitorEntry.platforms[]` and any other platform name field must use exactly these strings. No aliases, abbreviations, or model names.

| Canonical name |
|---|
| `ChatGPT` |
| `Perplexity` |
| `Google AI Overviews` |
| `Microsoft Copilot` |
| `Claude` |
| `Gemini` |

The engine enforces this via a constant/enum on its side. The renderer has no validation — incorrect strings will render silently as unrecognised pills. The engine is the enforcement point.

### DECISION-5: Engine does not compute benchmarks in v1

`score.benchmarkAvg` and `score.benchmarkLabel` are **not emitted by the engine**. The fulfillment script unconditionally preserves the teaser's static-table values. No silent overwrite.

Engine-computed benchmarks (derived from a real scored-company corpus) are a v2 feature. The data does not exist at v1 launch to support a defensible measured benchmark.

---

## 7. Minimum Required Fields for a Complete Paid Render

The following fields must be non-null and non-empty for the paid report to render all sections without fallback locked cards:

```
score.score               (integer)
score.band                (ScoreBand)
s5Competitors             (object, not null)
s5Competitors.competitors (array, min 1 item)
s5Competitors.queriesAnalyzed (integer)
s6PositioningGap          (object, not null)
s6PositioningGap.gapScore (integer)
s6PositioningGap.gaps     (array, min 1 item)
s7QueryGap                (object, not null)
s7QueryGap.queries        (array, min 1 item)
s7QueryGap.queriesAnalyzed (integer)
s7QueryGap.queriesWon     (integer)
s7QueryGap.primaryPlatform (string)
s8ActionQueue             (object, not null)
s8ActionQueue.quickWin    (string)
s8ActionQueue.actions     (array, min 1 item)
s8ActionQueue.expectedOutcome (string)
```

If any of these are missing or null, the renderer falls back to the locked placeholder card for that section rather than crashing.

---

*This document is the contract between the Visibility View renderer (Node/Next.js) and the AI Visibility Engine (Python). Update both repositories if any type or field shape changes.*
