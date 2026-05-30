# S1-S4_HONESTY_DELTA.md — concrete copy changes to align S1–S4 (FREE report) with available data

> Generated 2026-05-28. Companion to V2_COPY_DELTA.md (§1.9 was the original flag for this work).
> Copy-only specs — no code in this document. Apply via Claude Code in a follow-up.
> Reference state: S1–S4 are the FREE report sections rendered at `/r/{token}`. They are produced from form input only — **NO engine run**, **NO measured citation data**, **NO competitor seed** (gap 3 not closed). The 4-signal score and industry-benchmark median are derived; everything else in the current `v2-mockup.html` S1–S4 is fixture data and must be removed or relabelled.

---

## 0. Data sources available to S1–S4 today

| Source | What it actually contains | Used by |
|---|---|---|
| Form input | company name, industry, role, the four self-assessment dropdown answers | hero meta, score, band, failure-mode classification |
| `lib/scoring.ts` → `getVisibilityScore` | weighted 0–100 score over the 4 self-assessed signals (S1 awareness, S2 competitive standing, S3 query coverage, S4 platform consistency; weights 30/30/25/15) | score circle, score band |
| `lib/scoring.ts` → `getScoreBreakdown` | per-signal points × weight (e.g. `90 × 30% = 27.0`) | the live `ScoreBreakdownPanel` (shipped in `9b020d1`) |
| `lib/buildTeaserReport.ts` → `getFailureMode` | classifies one of: `competitor-displacement`, `low-query-coverage`, `platform-inconsistent`, `well-positioned` from the 4-signal pattern | S2 failure-mode title |
| `INDUSTRY_BENCHMARKS` lookup | one median number per industry (~30 sectors) | S4 benchmark median |

## 0a. Sources NOT available to S1–S4 today

- The AI Visibility Engine output (`scores.json`) — that powers the **PAID** report. Free path never calls the engine.
- Per-platform citation counts, named/displaced status per engine, per-query results, example AI responses, verbatim quotes — none exist on the free path.
- A "category leader" score or a benchmark cohort of N firms — the benchmark is a single median per industry, not a distribution.
- A list of competitors the user actually faces — gap 3 (competitor seed) not closed; even when closed, only runs on the PAID path.

## 0b. Audit classification (per V2_COPY_DELTA §1.9 categories)

- **(A) measured by engine on real run** — **NONE in S1–S4.**
- **(B) derived from form input** — score, band, failure-mode classification, hero meta, score-breakdown contributions.
- **(C) sourced from a lookup table / static benchmark** — industry median only.
- **(D) fixture data with no source** — everything else currently in S1–S4 of the mockup. The whole of S1, all per-platform numbers in S3, the named competitors in S2 and S4 callout, the "31 firms" cohort, the "leader" marker.

---

## 1. v2-mockup.html — exact S1–S4 deltas

### 1.1 Hero lede (line 742–746) — remove fabricated platform / category / competitor claims

**Current copy:**
> Across the AI platforms your buyers use most (ChatGPT, Perplexity), your brand surfaces in only 2 of 6 query categories. When buyers ask for AEO-focused agencies in your sector, three competitors are cited where you should be.

**Issues:**
- "AI platforms your buyers use most (ChatGPT, Perplexity)" — not measured, not asked on the form. (D)
- "surfaces in only 2 of 6 query categories" — no engine run, no per-category measurement. (D)
- "three competitors are cited where you should be" — flagged in V2_COPY_DELTA §1.9. No win/loss measurement on the free path; even on PAID requires gap 3. (D)

**Replace with:**
> You told us where you stand on the four signals AI engines weight when deciding who to surface. Based on your own answers, the score below reflects how AI is likely to find you today — and where the largest gap sits. The Full Report measures this against 200 real AI responses to confirm or correct it.

This keeps the reputational-risk framing in the H1 above ("the wrong story is being told about you") and uses the lede to set the honest contract: *self-assessment now, measurement later.*

### 1.2 Hero score-head line (line 757) — soften the "displacement is measured" implication

**Current copy:**
> Below industry median (62) — competitor displacement is the dominant failure pattern.

**Issues:**
- "(62)" — industry median is a static lookup, not a measurement against a real cohort (C). Acceptable as a reference number; mislabel as a result.
- "competitor displacement is the dominant failure pattern" — the mode classification IS derived from form input via `getFailureMode` (B). The classification stays; the present-tense "is" reads as observed fact about AI behaviour rather than as a read of the user's own answers.

**Replace with:**
> 15 points below the median for your sector (62). On your four self-reported signals, the largest gap is competitor displacement — the answers buyers get when they ask without naming you.

(The `15` is `62 − 47`, computed not asserted. "Sector" replaces "industry" so the reader knows it is a per-industry lookup. "Self-reported signals" makes the basis visible.)

### 1.3 S1 — `<section id="cite">` (line 778–846) — entire section cannot be honestly populated

This entire section is fabrication. Six platforms × per-row narrative quotes × specific citation counts — none of it has a source. Two of the six platforms (Google AI Overviews, Microsoft Copilot) aren't even in the engine. Even on the PAID path, descriptor extracts (gap 2) and citation URLs (gap 1) are not yet captured cross-engine.

**Decision required:** S1 must be either removed or rebuilt. Two viable options:

**Option A — Remove S1 entirely from the free report.** S1's intent ("which platforms surface me, with what story") is a PAID-tier capability. Replace the section with a single one-line callout immediately after the hero:

> The sections below report what you told us about your AI visibility and what that pattern usually means. They are not measured. The Full Report runs 50 buyer-intent queries × 4 engines and shows you the actual responses.

Then renumber S2 → S1, S3 → S2, S4 → S3.

**Option B — Repurpose S1 as the "Option A single-query proof"** (PROJECT_STATE §0b.2). On form submit, fire ONE real query (e.g. *"best [industry] firms for [their service]?"*) against one engine; render the verbatim response with their brand highlighted (or its absence flagged) plus the actual entities named. Title: **"One real AI response — your brand, in the verbatim answer."** Single row, single column, no fabricated grid. This is the proof-it-is-real fix described in PROJECT_STATE §0b.2.

**Recommended:** Option B if Option A engine plumbing is built first (PROJECT_STATE §0b.1 — one real engine run gates this). Option A (remove) otherwise. Do not ship the current six-platform fabricated section under either name.

### 1.4 S2 — failure-mode block (line 849–902) — keep classification, remove named rivals, relabel "root causes"

The mode classification (`competitor-displacement` / `low-query-coverage` / `platform-inconsistent` / `well-positioned`) is correctly derived from the 4-signal pattern via `getFailureMode`. **That stays.** What needs to go is everything that implies measured observation of AI behaviour.

**Failure callout `<h3>` (line 860):**
> *Old:* "Competitor displacement — three named rivals are being cited on the queries that should be yours."
> *New:* "Competitor displacement — your answer to 'are buyers being shown rival names instead of yours' was the strongest signal pulling your score down."

**Failure callout `<p>` (line 861–866) — delete the named competitors entirely:**
> *Old:* "You are not invisible. You are being out-cited. The brand entities surfacing on your highest-value buyer queries (Forge & Loom, Brightline AEO, North Lane Studios) are not necessarily larger or better — they have published clearer answer-shaped content that AI systems can extract."
> *New:* "You are not invisible. You are reporting that the wrong names show up when buyers ask without yours. The Full Report will tell you which competitors are actually being named on your queries — and on how many. For now this is your read of the situation, not a measurement."

**Root causes block `<h4>` (line 870):**
> *Old:* "Root causes our scoring model surfaced"
> *New:* "Patterns that typically drive this failure mode"

The four `<li>` items are static template prose attached to the mode label — they are not derived from any per-customer signal. Relabelling the header makes that honest. Two of the four also need internal edits:

**Delete the Copilot `<li>`** (line 886–892). It asserts a measured fact (an outdated description on Copilot) with no source. Copilot is not in the engine set on any tier except the Retainer. The bullet has no path to truth.

**Edit "Thin positioning signal" (line 872–878):**
> *Old:* "Your homepage and service pages describe what you do in agency-generic language. AI models cannot extract a sharp 'this is the firm for X' phrase to surface in answers."
> *New:* "Where this pattern shows up, the brand's homepage and service pages describe the work in agency-generic language. AI models cannot extract a sharp 'this is the firm for X' phrase to surface in answers."

**Edit "No answer-shaped long-form" (line 880–886):**
> *Old:* "Competitors winning your queries publish 1,200–2,000 word explainers structured as question → direct answer → evidence. Your blog is news-format."
> *New:* "Brands that escape this pattern publish 1,200–2,000 word explainers structured as question → direct answer → evidence. News-format blogs are not extractable for answer-shape."

**Edit "Missing schema and entity signals" (line 894–900):**
> *Old:* "No Organization schema, no clear author bios, no structured FAQ blocks. AI engines lack the metadata to confidently surface you."
> *New:* "Where this pattern persists, there is no Organization schema, no clear author bios, no structured FAQ blocks. AI engines lack the metadata to surface the brand confidently."

The diagnostic pull stays. Every claim becomes traceable to *"this is what the pattern looks like"* rather than *"this is what we found on your site."* The engine doesn't crawl their site on the free path; we cannot say *your* anything about page content.

### 1.5 S3 — `<section id="platforms">` (line 905–972) — six fabricated platform cards must go

Same defect as S1: six per-platform cards with fabricated percentages (22%, 71%, 0%, 14%, 0%, 0%) and per-platform narrative claims. The form's `platform_consistency` signal is ONE answer (consistently across all / most / some / one / none) — it does not break down by platform. Two of the six platforms (AIO, Copilot) aren't even in the engine.

**Decision required.** Two viable options:

**Option A — Remove S3 entirely** from the free report.

**Option B — Replace the six-card grid with one read-back card.** Title: *"Platform consistency — your read."* Body uses the user's own dropdown answer to signal 4:

> You told us your brand is cited consistently across **[one / some / none / etc — the answer they picked]** of the AI platforms you've checked.

Beneath it, a small "What the Full Report measures" panel that names the four engines (ChatGPT, Claude, Gemini, Perplexity) and includes the same Copilot / AIO note as V2_COPY_DELTA §1.1:

> The Full Report measures across ChatGPT, Claude, Gemini, and Perplexity — and reports per-engine named-rate. Microsoft Copilot is included in the SGD 4,500/mo Visibility Engine Retainer; Google AI Overviews requires a different measurement approach and is not in current scope.

**Recommended:** Option B. It carries the existing visual weight without inventing data, exposes the upgrade clearly, and is internally consistent with V2_COPY_DELTA's engine-count cleanup.

### 1.6 S4 — `<section id="benchmark">` (line 975–1004) — remove the fabricated cohort and leader

**Section sub (line 979–982):**
> *Old:* "How you compare against 31 Marketing & Advertising firms in our benchmark set. The scale runs 0 (invisible) to 100 (dominant)."
> *New:* "A reference median for your sector, drawn from our per-industry benchmark table (~30 sectors). The scale runs 0 (invisible to AI) to 100 (consistently surfaced). The Full Report replaces this static reference with your run's own 50-query × 4-engine measurement."

(There is no measured cohort of 31 firms. The benchmark is one number per industry, looked up by industry.)

**Benchmark bar (line 984–988): delete the `.benchmark-marker.leader` element.** There is no measured leader score. Show only "You" and "Median".

**Benchmark readout (line 997–1003):**
> *Old:* "You sit 15 points below the sector median and 41 below the category leader (Brightline AEO). Of the 31 firms benchmarked, 21 score higher than you — but the gap is closeable: leaders typically out-score you on positioning signal and answer-shaped content, both of which can improve within 60 days."
> *New:* "You sit 15 points below the sector median (62) for [industry]. The median is a reference number from our per-industry table, not a live cohort score. The gap is closeable on the two signals that account for most of it — positioning and answer-shaped content — both of which can move within 60 days. The Full Report shows you exactly which queries the gap appears on."

The "Of the 31 firms" cohort line goes — there is no cohort. "Category leader (Brightline AEO)" goes — fixture name, no measurement. The "60 days" framing stays because it is a *hypothesis about effort* (not a claim about a measured outcome) and because the 60-day action plan is explicitly the SGD 2,500 tier's job; the lead-in is still useful.

### 1.7 Paywall hero (line 1007–1020) — no additional S1–S4 change

The redraft in V2_COPY_DELTA §1.3 works as-is for the audited S1–S4. No additional edit needed here.

---

## 2. Dependency map — what each fix needs

| Fix | Available today (form + benchmark) | Needs engine gap (paid path) | Needs Option A (one real query on submit) |
|---|---|---|---|
| Hero meta (company / industry / role / date) | ✓ | — | — |
| Hero score + band + score-breakdown panel | ✓ | — | — |
| Hero "15 below median" line | ✓ (B + C arithmetic) | — | — |
| Hero "platforms / categories / competitors" narrative | ✗ remove | — | — |
| **S1 "citation snapshot"** | ✗ cannot be supported from form alone | Gap 1 + Gap 3 for the paid version | **Yes — Option A enables a single verbatim row** |
| S2 failure-mode title + mode classification | ✓ (B, via `getFailureMode`) | — | — |
| S2 named competitors in callout | ✗ remove | Gap 3 (paid path only) | — |
| S2 root-cause bullets relabelled as "patterns" | ✓ (static prose tied to mode label, no longer claimed as derived) | — | — |
| S2 Copilot bullet | ✗ delete (no source on any tier short of Retainer) | — | — |
| **S3 per-platform percentages** | ✗ cannot be supported from form alone | — | — |
| S3 single-card "platform consistency, your read" | ✓ (B, the user's own answer to signal 4) | — | — |
| S4 industry median | ✓ (C) | — | — |
| S4 "category leader" + cohort of 31 | ✗ remove (no source) | — | — |
| S4 "gap closeable in 60 days" hypothesis | ✓ (B — a framing about effort, not a measurement) | — | — |

**Bottom line:** **S1 and S3 are the only two sections that cannot be salvaged with the current data path.** Every other S1–S4 issue is a copy edit over data that already exists as form-derived (B) or benchmark-table (C). Closing engine gaps 1, 2, 3 does *not* help the FREE report directly — those gaps support S6 / S7 / S8 on the PAID path. The single piece of new infrastructure that meaningfully changes what S1 can claim is **Option A: fire one real engine query on submit** (PROJECT_STATE §0b.2). Until then, S1 should be removed.

---

## 3. Honesty rules to apply across S1–S4

- **No measurement vocabulary.** Never use "tested" / "test query batch" / "queries we ran" in S1–S4. The free report does not run queries; the Full Report does.
- **No named competitors.** Never list a specific competitor by name in S1–S4. Named competitors come only from the (not-yet-built) gap-3 seed on the paid path.
- **No verbatim AI quotes.** Never quote a verbatim AI response unless Option A has been built and the quote is the real Option A response captured at submit time. No "example" quotes from fixture data.
- **No per-platform percentages.** The form supplies one platform-consistency answer, not per-platform metrics — never break it down by platform.
- **"Sector median" yes, "cohort of N firms" no.** The benchmark is a per-industry lookup. "Reference number for your sector" is honest framing; "cohort of 31 firms" / "category leader" / "X firms score higher" is not.
- **The score, band, score-breakdown, and failure-mode classification are legitimate to present.** They ARE derived from form input via the live scoring code. The score-breakdown panel (shipped in `9b020d1`) makes the derivation visible — that is the trust signal that carries the section. Lean on it.

---

## 4. Out-of-scope but flag for next session

- **`INDUSTRY_BENCHMARKS` provenance.** No documentation exists for how the per-industry medians were derived. If they were research-backed, "sector median" is honest framing IF the methodology page documents the derivation. If they were estimated, the more honest label is "reference number" (used in §1.6 above). Verify before shipping.
- **Footer CTA copy.** Still implies an action-plan deliverable. V2_COPY_DELTA §1.8 has already redrafted it. Apply that copy in the same pass as these S1–S4 edits.
- **Scoring-string safety.** Per PROJECT_STATE §0c.3, the report-recompute safeguard is a NULL-check, not a validity-check. The copy edits in this document are *presentation-only*; they do not change any scored dropdown option text and therefore do not trigger the backfill requirement. If a future edit changes any scored option string, that DOES require a backfill `UPDATE` on existing rows.
- **Renumbering.** If Option A in §1.3 (remove S1) is taken, S2→S1, S3→S2, S4→S3 renumbering applies in the inline TOC, section headers, and section-num eyebrows. If Option B (Option-A engine query) is taken, numbering stays as-is.
