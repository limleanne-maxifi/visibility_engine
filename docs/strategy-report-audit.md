# Strategy Report Audit
**Scope:** AI Visibility Snapshot — full pipeline from form submission to rendered results page  
**Date:** 19 May 2026  
**Files examined:** `lib/buildPrompt.ts`, `lib/parsePlan.ts`, `lib/planTypes.ts`, `lib/scoring.ts`, `lib/supabase.ts`, `lib/email.ts`, `lib/types.ts`, `app/api/generate/route.ts`, `app/results/[id]/page.tsx`, `components/steps/Step[1-5].tsx`

---

## 1. Module Map and Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  FORM  (5 steps, client-side)                                    │
│  Step1: firstName, email, websiteUrl                             │
│  Step2: occupation, industry, company                            │
│  Step3: aiPresence (enum), platforms[] (up to 2, ranked)        │
│  Step4: challenges[] (up to 2), aeoOutcome, competitors,        │
│         positioning, targetQueries                               │
│  Step5: consent + submit                                         │
└────────────────────┬─────────────────────────────────────────────┘
                     │ POST FormData JSON
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  /api/generate  (route.ts)                                       │
│  • Validates: firstName, email, occupation present               │
│  • Calls buildUserMessage(formData) → plaintext prompt           │
│  • Calls Anthropic claude-sonnet-4-6 (max_tokens: 1000)         │
│  • Calls parsePlan(rawText) → Plan { steps[], quickWin }        │
│  • Calls insertLead(formData, plan) → AeoLeadRow (Supabase)     │
│  • Fire-and-forget: sendUserPlanEmail + sendInternalNotification │
│  • Returns: { id, plan }                                         │
└──────┬─────────────────────────┬────────────────────────────────┘
       │                         │
       ▼                         ▼
┌─────────────┐      ┌───────────────────────────────────────────┐
│  Supabase   │      │  Client navigates to /results/[id]        │
│  aeo_leads  │      │  getLeadById(id) → AeoLeadRow             │
│  table      │      │                                           │
└─────────────┘      │  Deterministic scoring (lib/scoring.ts):  │
                     │  • getVisibilityScore(awareness, comps)   │
                     │  • getIndustryBenchmark(industry)         │
                     │  • buyerConversations(score, bench)       │
                     │  • inferBusinessModel(industry)           │
                     │  • getPipelineLabel(model)                │
                     │                                           │
                     │  Template helpers (page.tsx):             │
                     │  • deriveQueries(...)                     │
                     │  • getPlatformStatuses(...)               │
                     │  • getRootCauses(...)                     │
                     │  • getGap[1-3]Specific(...)               │
                     │  • getOpportunityContent(...)             │
                     │  • get*Headline(...)                      │
                     │                                           │
                     │  Renders 8 display sections               │
                     └───────────────────────────────────────────┘
```

### Key data paths by source

| Data | Captured at | Stored as | Used in |
|---|---|---|---|
| `aiPresence` (enum, 6 values) | Step 3 | `awareness` | Score, every section headline, root causes, gap copy |
| `platforms[]` (up to 2, ranked) | Step 3 | `platform` + `platform_other` | Citation section, verify callout, AI prompt |
| `competitors` (free text) | Step 4 | `competitors` | Score (displacement signal), competitor table, root causes |
| `positioning` (free text) | Step 4 | `positioning` | Query derivation, AI prompt |
| `targetQueries` (free text) | Step 4 | `target_queries` | Query derivation, citation section, verify callout |
| `industry` (select) | Step 2 | `industry` | Benchmark lookup, root cause copy, business model |
| `challenges[]` (up to 2) | Step 4 | `challenge` (`;`-joined string) | AI prompt only — not used on results page |
| `aeoOutcome` (select) | Step 4 | `outcome` | AI prompt only — not used on results page |
| `plan.steps[]` | Claude API | `plan_steps` (JSONB) | Emailed to user; **not rendered on results page** |
| `plan.quickWin` | Claude API | `plan_quick_win` | Emailed to user; **not rendered on results page** |

---

## 2. Section-by-Section Analysis

### Section 1 — Current Citation Snapshot

**Display name on page:** "Citation status by platform"

**Source data:**
- `awareness` (the `aiPresence` enum value the user self-reported)
- `platform` (primary) and `platform_other` (secondary) from Step 3
- `target_queries` or `positioning` to derive `buyerQuery`

**Computation logic (`page.tsx`):**
- `getPlatformStatuses(awareness, primary, secondary)` maps the single `awareness` answer to a `PlatformStatus` for each platform the user selected. The same status is applied to both primary and secondary platforms — there is no per-platform signal.
- `getCitationHeadline(awareness, checkedCount, entityName)` generates a qualitative headline.
- `buyerQuery` is derived from `target_queries` (first entry if comma/semicolon separated) → `positioning` → fallback `"best {industry} firms"`.

**Output schema (rendered):**
```
Headline string
Per-platform rows: { name, searchUrl, badge: PlatformStatus }
Optional explanatory note
```

**Gaps and bugs:**
- **Single-answer problem (major):** The user reports one `awareness` answer covering all tested platforms. If they tested ChatGPT (found) and Gemini (not found), they can only report one outcome. The system applies the same badge to both selected platforms, which may misrepresent reality.
- **Platform selection does not affect score.** The platforms chosen in Step 3 influence the citation display but have zero weight in `getVisibilityScore`. A user on a niche platform is scored identically to one on ChatGPT.
- **`buyerQuery` falls back to `"best {industry} firms"`** when no positioning or target queries are supplied — a generic query that inflates the "not found" result for many brands legitimately absent from such broad searches.
- **No live data.** The "Search now →" links are generative; no actual citation check is performed.

---

### Section 2 — Failure Mode Diagnosis

**Display name on page:** "Root cause" + "Where your biggest opportunity lies right now"

**Source data:**
- `awareness` exclusively
- `competitors[]` (parsed from `competitors` string) for copy personalisation
- `industry` for copy personalisation

**Computation logic:**
- `getRootCauses(awareness, entityName, industry, competitors)` — a switch on `awareness` returning 3 hardcoded strings, with competitor names interpolated where available.
- `getOpportunityContent(awareness, entityName, competitors)` — same pattern: switch on `awareness`, returns `{ headline, body, displaced }`.

**Output schema:**
```
Opportunity: { headline: string, body: string }
Root causes: string[3]  (ordered list, no priority weighting)
```

**Gaps and bugs:**
- **All logic is a switch on one field.** There are only 5 awareness states (plus the default). Every user reporting `"Yes — but I wasn't mentioned at all"` receives identical root cause text regardless of industry, competitors, website URL, occupation, or challenges. The `entityName` and `industry` are string-interpolated but don't change the diagnostic logic.
- **`challenges[]` is not used here.** A user who selected "My competitors show up, I don't" and "I want to appear for specific topics" as their two challenges gets the same root causes as one who selected entirely different challenges with the same `awareness` answer.
- **The third root cause always attributes the problem to competitors** (or "leading brands") even when no competitor was named and the user has never observed competitor displacement.
- **No website analysis.** `websiteUrl` is captured and stored but never used in any diagnostic logic on the results page.
- **Default case (`"No, I haven't tried this yet"`)** produces a generic "your starting position is better than it may feel" body — arguably accurate but delivers no diagnostic value since there is no test data to diagnose.

---

### Section 3 — Platform Visibility Overview

**Display name on page:** "Citation status by platform" (same card as Section 1)

**Source data:** Same as Section 1 — `awareness`, `platform`, `platform_other`, `buyerQuery`.

**Computation logic:**
- `getPlatformStatuses` assigns status from the 5-value enum to only the user's selected platforms (1–2). All other platforms remain `'unknown'` / "Not checked".
- `PLATFORM_STATUS_STYLES` maps each status to a badge label and colour.
- `checkedPlatforms` filters to only `!== 'unknown'` entries for display.

**Output schema:**
```
Per-platform: { name, searchUrl, badgeLabel, badgeColour }
```

**Gaps and bugs:**
- **"Unknown" platforms are hidden**, not shown as untested — a user sees only 1–2 rows, giving a false impression of completeness.
- **Status conflation (same bug as Section 1):** One self-report answer drives badges for all checked platforms simultaneously. `displaced` status when competitors exist names the first competitor regardless of which platform they appeared on.
- **Displaced badge when no competitor named** silently downgrades to "Competitor not named" (gray) — loses urgency without explanation to the user.
- **`displaced` badge label** is truncated to 22 characters from the competitor name — can produce `"CompanyWith…"` with no ellipsis styling indication.

---

### Section 4 — Industry Benchmark Comparison

**Display name on page:** "Competitive position" table + score footnote

**Source data:**
- `industry` string → `getIndustryBenchmark(industry)`
- `getVisibilityScore(awareness, competitors)` for the user's score
- `competitors[]` for the competitor rows

**Computation logic (`lib/scoring.ts`):**

`getVisibilityScore` maps `awareness` to sub-scores on 4 signals:

| Signal | Weight | Source |
|---|---|---|
| Platform presence | 30% | `awareness` enum → fixed lookup |
| Competitor displacement | 30% | `awareness` + `competitors.length` |
| Query coverage | 25% | `awareness` enum → fixed lookup |
| Awareness consistency | 15% | `awareness` enum → fixed lookup |

`getIndustryBenchmark` is a static lookup table with 30 industries and fixed percentages (32%–78%).

`buyerConversations(score, bench)` rounds both values to the nearest 10 and divides by 10 to produce "X in 10 conversations" integers.

**Output schema:**
```
Competitor rows (0–n): { position: "Competitor", brand: string, visibility: "Est. above median" }
Industry median row: { industry: string, benchmark: number }
Your position row: { brand: entityName, score: number | "Undiagnosed" }
Gap row: { gap: number }
```

**Gaps and bugs:**
- **Benchmark values are entirely fabricated.** The code comments say "based on Maxifi Digital's analysis of citation patterns" but there is no methodology, sample size, date, or external reference. Values differ by up to 46pp (Defense 32% vs AI & ML 78%) with no supporting data.
- **Competitor visibility is always "Est. above median"** regardless of the competitor or how many the user named — a placeholder that is always shown when competitors are present, never computed.
- **Score is not an actual measurement.** `getVisibilityScore` is a deterministic formula on a single self-reported categorical answer. A user can receive 6% by reporting "not found" regardless of actual citation frequency.
- **`"No, I haven't tried this yet"` produces score 0 / "Undiagnosed"** which the results page then hides the pipeline box for — correct behaviour, but the score table still shows 4 rows with empty/false results.
- **`industry` free-text mismatch risk:** `getIndustryBenchmark` falls back to 40% for any string not in `INDUSTRY_BENCHMARKS`. The Step 2 `<select>` options are iterated from `INDUSTRY_BENCHMARKS` keys, so a match is guaranteed for known options — but legacy rows and duplicates (`'Legal'` vs `'Legal & Legal Services'`) show the table was amended without full cleanup.
- **`buyerConversations` rounds aggressively.** A score of 64% and benchmark of 63% both round to 6, producing "6 in 10 for you, 6 or more for competitors" — presenting parity as a gap.

---

### Section 5 — Competitor Displacement Analysis

**Display name on page:** Competitor rows in the "Competitive position" table + `competitorSection` in the email

**Source data:**
- `competitors` free text → `getAllCompetitors(raw)` → `string[]`
- `awareness` for displacement flag

**Computation logic:**
- `getAllCompetitors` splits on `,;/\n&` and strips the word "and".
- Competitor rows render in the competitive position table with the static label "Est. above median" for all competitors.
- In the email, a competitor call-out paragraph only fires when `awareness === 'Yes — competitors were cited instead of me'`.

**Output schema:**
```
Table rows: { brand: string, visibility: "Est. above median" }  (for each named competitor)
```

**Gaps and bugs:**
- **No competitor analysis is performed.** The section heading implies a displacement analysis, but the only computation is string splitting. Competitor names are displayed with a static placeholder.
- **Competitor data is only used for copy personalisation** (interpolating names into diagnostic sentences) — never for any scoring differentiation between competitors.
- **"Est. above median" is always shown** even if the user said their competitors were NOT appearing (e.g., `awareness === 'Yes — and the results were accurate'`).
- **`getAllCompetitors` strips "and" globally** — a competitor named "Anderson Consulting" would become "Anderson Consulting" only if "and" appears as a standalone word. However, "Brandand" would become "Br Consulting" — a latent bug if unusual names are entered.
- **The full report CTA in this section** (`/api/generate` plan) does not include any competitive query or research — the AI prompt only mentions competitors for copy context, not to produce competitor-specific intelligence.

---

### Section 6 — Positioning Gap Analysis

**Display name on page:** "Gap 1 — How your content is structured" (first of three gap cards)

**Source data:**
- `awareness`
- `positioning` (free text, optional)
- `competitors[]`
- `platform` (primary)
- `industry`

**Computation logic:**
- `getGap1Specific(awareness, entityName, industry, competitors, platform)` — switch on `awareness`, producing a paragraph that interpolates entity name, industry, platform name, and competitor names.
- `positioning` is passed to `deriveQueries` but is **not used in the gap text itself** — the positioning the user provided does not influence what gap analysis they receive.

**Output schema:**
```
Gap heading: "How your content is structured"
Gap body: string (awareness-branched)
Business consequence: string (hardcoded per section)
Expandable detail: string (hardcoded, not personalised)
```

**Gaps and bugs:**
- **`positioning` input has no effect on the gap analysis.** A user who precisely described their differentiation ("We are the only ISO-certified provider of X in Y market") receives the same gap text as one who left it blank. The value is sent to Claude in the AI prompt but that output (plan steps) is not shown on this page.
- **The gap is purely content-structure framing** regardless of actual website URL, industry, or positioning. It does not analyse `websiteUrl` for actual content structure problems.
- **Business consequence is hardcoded** across all users in the same awareness state.

---

### Section 7 — Target Query Gap Analysis

**Display name on page:** "Verify this yourself" callout + "Gap 3 — Who else is talking about you online"

**Source data:**
- `target_queries` (free text) → first query extracted via `split(/[,;\n]/)[0]`
- `positioning` as fallback
- `industry` as final fallback (`"best {industry} firms"`)
- `awareness` for Gap 3 copy

**Computation logic:**
- `buyerQuery` is derived: `target_queries` first entry → `positioning` trimmed to 120 chars → `"best {industry} firms"`.
- `isGenericQuery` flag fires a disclaimer when neither field was provided.
- `getGap3Specific(entityName, industry, awareness)` — switch on `awareness` producing a paragraph about third-party references.
- The "Verify this yourself" block links to the platform search URL using `buyerQuery`.

**Output schema:**
```
buyerQuery: string
isGenericQuery: boolean (triggers disclaimer)
platformSearchUrl: string
Gap 3 body: string (awareness-branched)
```

**Gaps and bugs:**
- **Only the first target query is used.** If a user provided 3 queries separated by commas, only the first drives the "verify yourself" search and citation section. Queries 2 and 3 are silently discarded on the results page (they do go into the AI prompt).
- **Gap 3 is about third-party references, not query gap.** The section heading ("Who else is talking about you online") does not correspond to target query gap analysis — it covers a related but distinct topic. The actual query gap (which target queries return the brand) is not computed.
- **`positioning` is truncated to 120 chars** for `buyerQuery` — a user with a long positioning statement gets a truncated search query that may not be meaningful.
- **No query gap is measured.** The system cannot determine whether the brand appears for any specific query — the "verify" link directs the user to check manually.
- **`scoring.ts:queryEntry`** in `getScoringRows` reports "0 of N checked queries returned your brand" where N is `derivedQueries.length` — but `derivedQueries` includes `entityName` itself as the first entry, so a company that only tested its own brand name is reported as having tested 1–3 "queries".

---

### Section 8 — 60-Day Prioritised Action Queue

**Display name on page:** Not rendered on the results page at all.

**Source data:**
- `formData` → `buildUserMessage(formData)` → Claude prompt
- Claude response → `parsePlan(rawText)` → `Plan { steps[], quickWin }`
- Stored as `plan_steps` (JSONB) and `plan_quick_win` in Supabase

**Computation logic (`lib/buildPrompt.ts`):**
- `stepCount` is 3 (if `aiPresence === "No, I haven't tried this yet"`) or 5 (all other states).
- Prompt includes: name, occupation, industry, company, website, awareness, primary platform, secondary platform, challenges, outcome, competitors, positioning, target queries.
- System prompt instructs Claude: plain English, no jargon, specific to occupation/industry/challenge, no invented statistics.
- Claude returns structured `STEP_START...STEP_END` blocks + `QUICKWIN:` line.

**Output schema (from parsePlan):**
```typescript
Plan {
  steps: PlanStep[]  // [{ num, title, body }]
  quickWin: string
}
```

**Gaps and bugs:**
- **The plan is not shown on the results page.** `plan_steps` and `plan_quick_win` are stored in Supabase and emailed to the user, but there is no rendered section on `/results/[id]` that displays the action steps. The results page CTA instead points users to buy the "AI Visibility Report" — which implies the plan they already received is insufficient, creating a confusing message.
- **`max_tokens: 1000` is very tight** for 5 steps of 2–3 sentences each plus a quick win. At ~60 tokens per step body, 5 steps consume ~400 tokens for body alone; titles and formatting overhead push this close to the limit. Truncated responses will throw a `PARSE_ERROR` (missing `QUICKWIN`), failing the entire submission.
- **`parsePlan` throws hard on any malformed block.** A single malformed step (missing `BODY:` line) throws `Error: Malformed step block`, which propagates as a 500 to the user. There is no partial recovery.
- **The `BODY` regex** (`/^BODY:\s*([\s\S]+?)(?=\n(?:NUM|TITLE|BODY|$)|\s*$)/m`) uses a non-greedy match with a lookahead for `NUM|TITLE|BODY`. If Claude produces a body containing a line starting with one of those words (e.g., "BODY text should…"), the regex will truncate the body at that line.
- **`stepCount` branch on `"No, I haven't tried this yet"`** produces a 3-step plan for users with no test data — reasonable, but the step quality depends entirely on Claude since there is no awareness-specific instruction shaping.
- **The prompt still says "AEO action plan"** (`buildPrompt.ts` line 11) — inconsistent with the "AI Visibility" naming applied everywhere else in the product.
- **System prompt says "never invent statistics"** but the user message includes the computed score (it doesn't — the score is not passed to the prompt). Claude therefore cannot reference the score in its steps, even when that context would make advice more specific.

---

## 3. Accuracy Assessment

### Hardcoded values

| Value | Location | Concern |
|---|---|---|
| Industry benchmarks (32%–78%) | `lib/scoring.ts: INDUSTRY_BENCHMARKS` | No external source, methodology, or date. Differences of 46pp between industries imply precise measurement but are editorial estimates. |
| Signal weights (30/30/25/15%) | `lib/scoring.ts: getVisibilityScore` | Arbitrary. No weighting study or citation. |
| Platform presence sub-scores (0, 15, 30, 40, 90) | `lib/scoring.ts` | Arbitrary mapping from 5 enum values to 0–90 range. |
| "Est. above median" for all named competitors | `app/results/[id]/page.tsx` line ~570 | Static placeholder regardless of competitor identity or industry. |
| `buyerX` / `buyerY` "in 10 conversations" | `lib/scoring.ts: buyerConversations` | Rounds to nearest 10 — scores 55%–64% all display as "6 in 10". Presented as observed frequency, computed as a rounding artifact. |
| Default benchmark fallback of 40% | `lib/scoring.ts: getIndustryBenchmark` | Applied to any unknown industry. |
| `max_tokens: 1000` | `app/api/generate/route.ts` | Too low for 5 steps at Claude's typical verbosity; risk of truncation on longer responses. |
| Logo URL `https://visibilityview.netlify.app/maxifi-logo-black.png` | `lib/email.ts` | Hardcoded production URL — breaks in staging and if the domain changes. |
| Email brand colour `#6B5DD3` | `lib/email.ts` | Old purple colour inconsistent with the gold redesign applied to all other UI surfaces. |

### Assumptions

1. **A single self-reported answer accurately represents multi-platform citation status.** The model assumes what a user observed on one platform on one day is representative of their overall AI visibility.
2. **`awareness` and `competitors` together are sufficient to compute a meaningful score.** In practice, a brand with 200 high-authority backlinks and one with 0 would receive the same score if they reported the same awareness.
3. **Industry benchmarks are stable and consistent across company sizes.** A solo consultant and a 500-person firm in the same industry receive the same benchmark.
4. **The first target query is the most important one.** Only `split(...)[0]` is used on the results page.
5. **`entityName = company_name ?? first_name`** — if no company is provided, the person's first name is used as the "brand" throughout all analysis copy.
6. **`"best {industry} firms"` is a valid proxy buyer query.** Used as fallback when no positioning or target queries are provided, but this is a very generic head-term unlikely to represent how real buyers search.

### Unverified data sources

- All 30 industry benchmark percentages — no attribution, no date, no methodology
- Competitor visibility estimates — always "Est. above median", never computed
- "AI citation positions shift…within a single quarter" — cited as fact in multiple copy blocks, unattributed
- Pipeline framing ("9 out of 10 AI-assisted referrals going to other brands") — derived from the score/benchmark rounding, presented as observed market behaviour

---

## 4. Utility Assessment

### High utility — actionable output

| Section | Why useful |
|---|---|
| **Failure mode diagnosis** (root causes) | Provides 3 concrete causal explanations matched to the user's awareness state. Even though the copy is templated, the framing (content structure / authority signals / third-party references) is a valid and non-trivial diagnostic framework for the target audience. |
| **"Verify this yourself" callout** | Gives the user a direct search URL with their specific query pre-filled. This is immediately actionable and bypasses the need for the user to understand what to type. |
| **60-day action queue (email)** | Claude's output — when generated successfully — produces genuinely personalised, occupation/industry/challenge-specific steps. This is the highest-signal output in the system, but it is buried in an email and not surfaced on the results page. |
| **Quick win** | Single concrete 30-minute action. High utility if Claude follows the instruction (it generally does). |

### Moderate utility — useful framing, limited precision

| Section | Caveat |
|---|---|
| **Current citation snapshot** | Correctly surfaces which platforms the user tested and links directly to live search. Utility is limited by single-answer reporting. |
| **Industry benchmark comparison** | The gap-to-benchmark concept is meaningful; the specific numbers are not reliable. The table is a useful orientation device, not a measurement. |
| **Positioning gap analysis (Gap 1)** | The awareness-branched framing identifies the right category of problem (content structure). Utility drops because it cannot diagnose the specific cause without website analysis. |

### Low utility — filler or structurally incomplete

| Section | Why low utility |
|---|---|
| **Platform visibility overview** | Repeats the citation snapshot data. "Not checked" for untested platforms adds no information. The "Search now →" links are the only genuine value. |
| **Competitor displacement analysis** | Named competitors are displayed but not analysed. "Est. above median" is a placeholder that cannot be acted on. The section implies competitive intelligence it does not deliver. |
| **Target query gap analysis (Gap 3)** | Labelled "Who else is talking about you online" — does not measure query gap at all. The section covers third-party references, which is a valid topic but mislabelled relative to the section name in the product spec. |
| **Industry benchmark comparison (score)** | The score itself (6%, 47%, etc.) is a formula on a categorical input, not a measurement. Displaying it as a percentage with decimal precision implies accuracy it does not have. |

---

## 5. Priority Findings Summary

| # | Finding | Severity | Affected sections |
|---|---|---|---|
| 1 | Plan steps are not rendered on the results page — highest-signal AI output is email-only | High | Section 8 |
| 2 | `max_tokens: 1000` risks truncation and parse failure for 5-step plans | High | Section 8 |
| 3 | Score is a categorical formula, not a measurement — displayed as a precise percentage | High | Sections 1, 4 |
| 4 | Industry benchmarks are unverified editorial estimates presented as data | High | Section 4 |
| 5 | Competitor displacement shows "Est. above median" placeholder regardless of input | Medium | Section 5 |
| 6 | `positioning` input has no effect on positioning gap analysis | Medium | Section 6 |
| 7 | Only the first target query is used; others silently discarded on results page | Medium | Section 7 |
| 8 | `websiteUrl` is captured but never used in any diagnostic logic | Medium | Sections 2, 6 |
| 9 | Email still uses old purple (`#6B5DD3`) and hardcoded logo URL | Low | Email (all) |
| 10 | `buildPrompt.ts` still says "AEO action plan" — naming inconsistency | Low | Section 8 |
| 11 | `BODY` regex will truncate step bodies containing lines starting with NUM/TITLE/BODY | Low | Section 8 |
