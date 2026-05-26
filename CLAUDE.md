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

### RESOLVED-5: Engine does not compute benchmarks in v1

`score.benchmarkAvg` and `score.benchmarkLabel` are not emitted by the engine. The fulfillment script unconditionally preserves the teaser's static-table values. No silent overwrite. Engine-computed benchmarks require a real scored-company corpus and are a v2 feature.
