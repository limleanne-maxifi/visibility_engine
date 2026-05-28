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

**2026-05-28 reconciliation — measured vs not-measured per tier:** the vocabulary stays at 6 platforms, but only the 4 API-callable engines (`ChatGPT`, `Claude`, `Gemini`, `Perplexity`) actually produce data on the Free and Full Report tiers. `Google AI Overviews` and `Microsoft Copilot` render in an explicit `not-measured-deferred` state with the label *"Not measured in this report — included in the Visibility Engine Retainer (SGD 4,500/mo)"*. They MUST NOT show fabricated citation counts, percentages, or status pills on Free/Full. The Retainer tier is where all 6 produce data. The mechanism: `PlatformMeasurementState = 'measured' | 'not-measured-deferred'` on `PlatformPriorityRow` (`lib/reportTypes.ts`); `buildS3` in `lib/buildTeaserReport.ts` sets it; `S3Platforms` in `components/report/ReportPage.tsx` branches on it. Future sessions: do not re-add numbers for AIO/Copilot in the Free/Full renderer.

**Catalog vs measured-data surfaces (binding rule for future sections).** Two surface types exist; they have different platform-display rules:

- **Catalog surfaces** enumerate the full platform vocabulary. All 6 names appear; AIO + Copilot are rendered in the `not-measured-deferred` visual state described above. Current catalog surfaces on Free/Full: **S3 (Platform Priority Overview)**. Future catalog surfaces (e.g. a coverage-tier comparison page) inherit this rule.
- **Measured-data surfaces** report per-platform results computed from real engine output. Only the 4 measured engines are tagged or otherwise referenced; AIO + Copilot are absent — adding them would reintroduce fabrication. Current measured-data surfaces: **S5 (Who AI mentions when you're not named)**, **S6 (How AI describes you)**, **S7 (Query coverage)**, **S8 (Sentiment, rank & citation health)**, and any preview / sample that mirrors their data shape (e.g. the unlock page's "A look inside" S5 sample).

When introducing a new section, classify it explicitly into one of these two categories before deciding how to list platforms.

### RESOLVED-5: Engine does not compute benchmarks in v1

`score.benchmarkAvg` and `score.benchmarkLabel` are not emitted by the engine. The fulfillment script unconditionally preserves the teaser's static-table values. No silent overwrite. Engine-computed benchmarks require a real scored-company corpus and are a v2 feature.
