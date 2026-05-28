# CLAUDE.md — Visibility View

Project context and settled decisions for Claude Code sessions. Do not re-open items marked RESOLVED without a deliberate, explicit decision.

---

## Visibility Report — v1 Frozen Scope Decisions (DATA_CONTRACT)

Full contract: `DATA_CONTRACT.md`. These decisions are frozen. The engine is aligned against them once; do not change renderer types or contract fields without updating both repos together.

**Governing principle:** v1 scope is frozen to be honest and shippable, deliberately narrower than the full vision. Deferred items are v2 enhancements, not corners cut.

### RESOLVED-1: No dedicated per-platform citation table

Per-platform citation is implicit across S5 (`competitors[].platforms[]`) and S7 (query coverage). There is no `s9PlatformCitation` section and no such type in `ReportData`. Do not add one without a deliberate v2 decision.

### RESOLVED-2: S7 query coverage is single-platform (ChatGPT) in v1

`s7QueryGap.primaryPlatform` is always `"ChatGPT"`. The engine probes all four LLMs for the composite score and S5 displacement narrative, but the S7 query-by-query table covers ChatGPT only, framed honestly in the `summary` field. `QueryCoverageRow` has no `platform` field. Multi-platform S7 is v2.

### RESOLVED-3: S1 stays assessment-tier in paid reports

S1 is always ASSESSMENT (initial evaluation, not engine-measured). The engine does not touch S1. A one-line bridging note is rendered beneath the S1 caveat in the paid report only: *"Section 1 reflects our initial assessment; see Sections 5–7 for engine-measured results."* Do not upgrade S1 statuses to measured — the evidence standard differs from S5–S7 and the distinction is defensible.

### RESOLVED-4: Platform names are a fixed vocabulary (engine-enforced)

Any field referencing a platform must use exactly one of these strings. No aliases, abbreviations, or model names.

`"ChatGPT"` · `"Perplexity"` · `"Google AI Overviews"` · `"Microsoft Copilot"` · `"Claude"` · `"Gemini"`

The engine enforces this via a constant/enum. The renderer has no validation.

**2026-05-28 reconciliation — measured vs not-measured per tier:** the vocabulary stays at 6 platforms, but only the 4 API-callable engines (`ChatGPT`, `Claude`, `Gemini`, `Perplexity`) actually produce data on the Free and Full Report tiers. `Google AI Overviews` and `Microsoft Copilot` render in an explicit `not-measured-deferred` state with the label *"Not measured — included in the Visibility Engine Retainer (SGD 4,500/mo)"* (tier-neutral phrasing — the row is shown on both the free snapshot and paid report, see RESOLVED-6). They MUST NOT show fabricated citation counts, percentages, or status pills on Free/Full. The Retainer tier is where all 6 produce data. The mechanism: `PlatformMeasurementState = 'measured' | 'not-measured-deferred'` on `PlatformPriorityRow` (`lib/reportTypes.ts`); `buildS3` in `lib/buildTeaserReport.ts` sets it; `S3Platforms` in `components/report/ReportPage.tsx` branches on it. Future sessions: do not re-add numbers for AIO/Copilot in the Free/Full renderer.

**Catalog vs measured-data surfaces (binding rule for future sections).** Two surface types exist; they have different platform-display rules:

- **Catalog surfaces** enumerate the full platform vocabulary. All 6 names appear; AIO + Copilot are rendered in the `not-measured-deferred` visual state described above. Current catalog surfaces on Free/Full: **S3 (Platform Priority Overview)**. Future catalog surfaces (e.g. a coverage-tier comparison page) inherit this rule.
- **Measured-data surfaces** report per-platform results computed from real engine output. Only the 4 measured engines are tagged or otherwise referenced; AIO + Copilot are absent — adding them would reintroduce fabrication. Current measured-data surfaces: **S5 (Who AI mentions when you're not named)**, **S6 (How AI describes you)**, **S7 (Query coverage)**, **S8 (Sentiment, rank & citation health)**, and any preview / sample that mirrors their data shape (e.g. the unlock page's "A look inside" S5 sample).

When introducing a new section, classify it explicitly into one of these two categories before deciding how to list platforms.

### RESOLVED-5: Engine does not compute benchmarks in v1

`score.benchmarkAvg` and `score.benchmarkLabel` are not emitted by the engine. The fulfillment script unconditionally preserves the teaser's static-table values. No silent overwrite. Engine-computed benchmarks require a real scored-company corpus and are a v2 feature.

### RESOLVED-6: Terminology — "snapshot" (free) vs "report" / "Full Report" (paid)

Naming rule, binding across all user-facing surfaces:

- **Free tier** = **"snapshot"**. The self-assessment score + Sections 1–4 served at `/r/{token}`, derived from the user's form answers + per-industry reference benchmark. Email subject lines and body, form copy, `/r/{token}` page chrome, and the unlock page all refer to it as "snapshot" (or "free snapshot").
- **Paid SGD 250 tier** = **"report"** / **"Full Report"**. The 50-query × 4-engine measured PDF deliverable from the AI Visibility Engine. Email upsells, paywall block, unlock page pitch, and the locked-section badges call it "Full Report" (or "your full report" once the user has paid, but in pre-purchase upsell copy use "the Full Report" without the possessive).

**Never call the free deliverable a "report."** "Free report" is a contradiction — it promises the paid product's name for free. The two products must remain crisply distinguished in every user-facing string.

Where to apply the distinction:
- Free-tier surfaces (free `/r/{token}` render, snapshot-delivery email body, form steps, consent checkbox): use "snapshot".
- Paid-tier surfaces (paywall block, unlock page, locked-section badges, upsell paragraphs in the email, paid `/r/{token}` render): use "report" / "Full Report".
- `LockedSection` badges and the "Unlocked in full report" eyebrow correctly describe the paid product — leave as-is.
- The hero eyebrow, footer label, TOC heading, FooterCta sentence, and `S1Visibility` placeholder text are shown on both renders and must condition the noun on `data.meta.paid` (snapshot when false, report when true).
- The S3 not-measured row label is shown on both renders too; the label drops the tier noun entirely ("Not measured — included in the Visibility Engine Retainer…") rather than threading `paid` into `S3Platforms`.

Mechanism: this is a copy rule, not a type rule. The `ReportData` type stays named `ReportData` (it's the data shape, not the user-facing product). Internal identifiers (`buildTeaserReport`, `reportPrice`, `report_token`, etc.) can keep their names — terminology applies only to strings the user sees.
