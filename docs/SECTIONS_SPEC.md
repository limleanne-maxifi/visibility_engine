# SECTIONS_SPEC.md — Full Report S5–S8, traceable to engine output

> Generated 2026-05-27 against the maxifi-test 2026-05-27 run (50 queries × 4 engines, 199 responses, named_rate 0.1307, citation_rate 0.206).
> Every field below traces to one of: engine output (scores.json row or summary), form input, derived calculation over engine output. Consulting prose has been removed and is called out per section.

---

## Engine output reference

### scores.json — per-row fields (one row per query × engine)
- `query_id` (int) — joins to queries.json
- `llm` (string) — `openai` | `anthropic` | `google` | `perplexity`
- `category` (string) — `awareness` | `service` | `competitive` | `how_to` | `brand` | `pain_point` | `segment`
- `query` (string)
- `named` (bool) — customer brand mentioned by name in the response
- `rank_position` (int | null) — position in the response if named. **Current run: always `1` when named, always `null` otherwise — field is uninformative until the classifier actually distinguishes positions in a list.**
- `sentiment` (string) — `neutral` | `positive` | `negative`. **Current run: 100% "neutral" — classifier is inert. Report values AS-IS; flag the limitation.**
- `citation_found` (bool) — model returned a citation marker. **No URL captured. This is gap 1.**
- `mentioned_competitors` (string[]) — entities other than the customer brand mentioned in the response. **Unfiltered — includes "ChatGPT", "Google", "Wikipedia", "LinkedIn", AI-engine names, and unrelated entities. Unusable as a "competitor list" without gap 3 (customer-supplied seed).**

### scores.json — `summary` aggregates
- `overall_visibility_score` (float)
- `total_responses`, `named_count`, `named_rate`, `citation_rate`, `sentiment_rate`, `avg_rank_position`, `avg_rank_normalized`
- `by_llm[llm]` → same fields per engine
- `by_category[category]` → same fields per category

### Engine coverage (current run)
4 engines only: `openai` (ChatGPT) · `anthropic` (Claude) · `google` (Gemini) · `perplexity` (Perplexity). Copilot deferred to SGD 4,500/mo retainer tier. Google AI Overviews is not in the current engine call set.

### Open gaps (each section flags which it depends on)
- **Gap 1** — citation URL capture: extract source URLs from the raw response, store alongside `citation_found`. Until built, citation = yes/no only.
- **Gap 2** — descriptor extraction: when `named=true`, extract the sentence(s) describing the brand from the raw response and store verbatim. Currently no descriptor text is captured.
- **Gap 3** — customer competitor seed: add a form input `competitors[]` so we can filter `mentioned_competitors` to the named rivals the customer actually cares about, instead of reporting "Google" and "Wikipedia" as competitors.

---

## S5 — "Who AI mentions when it doesn't mention you"

Replaces the v2-mockup section titled "Competitor displacement analysis".

The old title implied measured win/loss between brands on specific queries. The engine does not measure that. What the engine *can* report — once gap 3 is closed — is: "across the queries where your brand was not named, here is how often each of the competitors you seeded was named instead."

**Depends on: gap 3 (competitor seed) for the meaningful version. Without it, this section degrades to a raw entity dump and should not ship.**

### Fields

| Field | Source | Calculation | Honest framing rule |
|---|---|---|---|
| Seeded competitors | form input `competitors[]` (NEW, gap 3) | — | "You named these N competitors when you signed up." Never invent competitors the user did not seed. |
| Mention count per seeded competitor | scores.json `scores[]` | For each seeded name `c`: count rows where `c ∈ mentioned_competitors` AND `named=false` for the customer brand. | "[Competitor] appeared on X of N queries where your brand was not named." Never use the word "wins". |
| Mention count by category | scores.json `scores[].category` | Group the above by `category`. | "Most often on `competitive` and `service` category queries." |
| Mention count by engine | scores.json `scores[].llm` | Group the above by `llm`. | "Mostly on Perplexity (X mentions) and ChatGPT (Y)." Use engine display names, not model IDs. |
| Co-mention with customer | scores.json `scores[]` | For each seeded `c`: count rows where `c ∈ mentioned_competitors` AND `named=true`. | "When your brand was named, [Competitor] was named alongside on X queries." |
| Unseeded high-frequency entities (optional, separate sub-section) | scores.json `scores[].mentioned_competitors` flattened | Frequency count, exclude (a) the customer brand, (b) the 4 AI-engine names ChatGPT/Claude/Gemini/Perplexity, (c) generic platforms Google/Bing/Wikipedia/LinkedIn. | "These entities appeared most often across all responses; you did not seed them as competitors, so we are not classifying them." Show top 10 with raw counts only. |

### What this section does NOT claim
- Does not claim any competitor is "winning queries" — we measure mention frequency, not win/loss.
- Does not rank competitors by market position, revenue, or category leadership.
- Does not provide counter-positioning moves, response copy, or recommended actions. Those are consulting deliverables — SGD 2,500 tier.
- Does not include unseeded names in the primary count (they appear only in the optional raw-frequency sub-section, clearly labelled as unfiltered).
- Does not measure share-of-voice across the open web. The denominator is the 50 queries × 4 engines tested.

---

## S6 — "How AI describes you when it names you"

Replaces the v2-mockup section titled "Positioning gap analysis".

The old title implied a benchmark between the customer's stated positioning, what AI surfaces, a recommended sharper claim, and evidence required. Of those four, only the first two are derivable from form + engine output. The last two are consulting work.

**Depends on: gap 2 (descriptor extraction).**

### Fields

| Field | Source | Calculation | Honest framing rule |
|---|---|---|---|
| Brand-query named rate | scores.json `scores[]` filtered to `category=brand` | `named=true count / total brand rows`. Current run: 26 / 27 = 96.3%. | "On queries that name your brand explicitly, AI named you back on X of N responses." Frame as a sanity check, not a visibility number. |
| Descriptor extracts | raw response files → NEW extractor (gap 2) | When `named=true`, parse the sentence(s) containing the brand mention. Store verbatim with `query_id` + `llm`. | "Verbatim from the response: '[quote]'." Show 3–5 representative samples across engines. Never paraphrase. |
| Per-engine descriptor variance | derived from extracts | Across engines, compare extracted descriptors for the same `query_id`. Rule-based diff: shared noun phrases vs divergent ones. | "ChatGPT describes you as X. Claude describes you as Y. The two share [shared phrases] and differ on [divergent phrases]." Never label one as "correct". |
| Customer-stated positioning | form input `stated_positioning` (existing or NEW form field) | — | "You told us: '[quoted form input]'." Frame as the customer's own claim, not a verified fact. |
| Alignment flag | derived | Token/keyword overlap between `stated_positioning` and extracted descriptors. Rule-based: count shared content words ≥ 4 chars after stopword removal. | "Your stated positioning shares [N] content words with the descriptors AI produced. Top overlapping terms: [...]. Top missing-from-AI terms: [...]." Never claim positioning is "weak" or "strong". |

### What this section does NOT claim
- Does not recommend a sharper one-sentence positioning. That is consulting workshop output — SGD 2,500 tier.
- Does not specify required evidence (case studies, POVs, named outcome statements).
- Does not score positioning strength on any scale.
- Does not distinguish "outdated" vs "current" description without an explicit customer correction. The engine sees what models say today; it cannot tell whether that description was true 14 months ago and isn't now.
- Does not synthesise a single "this is how AI sees you" sentence. Descriptors are reported per-query, per-engine, verbatim.
- Does not run if gap 2 is not closed. Until then, this section is omitted from the report.

---

## S7 — "Query coverage — where you appear and where you don't"

Replaces the v2-mockup section titled "Target query gap analysis".

The old title implied a curated list of 12 buyer-intent queries the customer should win, with blocking factors and content briefs. The engine produces the raw coverage matrix; the prioritisation and the briefs are consulting work.

**No new gap dependency. Runs on existing engine output. Gap 1 (citation URLs) enhances one row of the table but is not required.**

### Fields

| Field | Source | Calculation | Honest framing rule |
|---|---|---|---|
| Total queries tested | manifest.json `query_count` | constant for this run (50) | "Tested across 50 buyer-intent queries × 4 engines = 200 responses possible (199 returned this run)." |
| Total responses returned | scores.json `summary.total_responses` | — | State the denominator explicitly — never silently exclude missing responses. |
| Overall named rate | scores.json `summary.named_rate` | — | "Named on 26 of 199 responses (13.1%)." |
| Named rate by category | scores.json `summary.by_category[*]` | — | "Named on 96.3% of brand-name queries (the floor — these queries contain your name). Named on 0% of awareness / service / competitive / how-to / pain-point / segment queries. **This is the headline visibility number.**" |
| Named rate by engine | scores.json `summary.by_llm[*]` | — | "Anthropic 14.0%, OpenAI 14.0%, Google 12.2%, Perplexity 12.0%. Engine parity is high — the gap is not engine-specific." |
| Per-query × engine matrix | scores.json `scores[]` | For each `query_id`, show a row: query text, category, then a column per engine with `named` shown as ✓ / ✗. | "[Query]: ChatGPT ✓ · Claude ✗ · Gemini ✗ · Perplexity ✗" Render all 50 queries; do not truncate or "highlight 12" — that is consulting prioritisation. |
| Citation flag per row | scores.json `scores[].citation_found` | — | "AI cited a source: yes / no." |
| Citation URLs (gap 1) | raw response parse (NEW, gap 1) | When citation_found, extract the URL(s) from the raw response. | "Source(s) cited: [url]." Only populates reliably for Perplexity until gap 1 is generalised across engines; flag this in the cell, do not infer "no URL = no source." |
| Citation rate by category | scores.json `summary.by_category[*].citation_rate` | — | "AI cited sources on 35.7% of how-to queries, 30.0% of segment queries, 14.3% of pain-point queries. Use this to see which query categories are evidence-driven vs assertion-driven for your industry." |
| Citation rate by engine | scores.json `summary.by_llm[*].citation_rate` | — | "Perplexity 72.0%, Anthropic 8.0%, OpenAI 2.0%, Google 0.0%. This gap reflects how each engine surfaces citations via its API, not your performance — flag this so the reader doesn't read 0% Google as a Google failure of the brand." |

### What this section does NOT claim
- Does not pick the 12 "target queries to win". That is consulting prioritisation — SGD 2,500 tier.
- Does not provide content briefs per query (deliverable templates, headline copy, structure).
- Does not diagnose a "blocking factor" per query (e.g. "evidence gap", "needs category-defining piece").
- Does not rank queries by reachable impact, difficulty, or sequence.
- Does not predict whether a fix will move the named rate.
- The citation-URL column is empty until gap 1 is built; until then `citation_found` is reported as yes/no only.

---

## S8 — "Sentiment, rank, and citation health"

Replaces the v2-mockup section titled "60-day prioritised action queue".

The old section had zero engine basis — every row was consulting prose. It is removed from the Full Report (the 60-day action queue moves to the SGD 2,500 Strategic Baseline + Consult tier). The S8 slot is repurposed as a reporting page for the remaining engine fields the prior sections didn't use, plus the limitations the customer needs to see.

**No new gap dependency.**

### Fields

| Field | Source | Calculation | Honest framing rule |
|---|---|---|---|
| Sentiment distribution | scores.json `scores[].sentiment` | Count `positive` / `neutral` / `negative` across rows where `named=true`. Current run: 26 / 0 / 0 — all neutral. | "Of the 26 responses that named your brand, 0 were positive, 26 were neutral, 0 were negative. **The sentiment classifier returned 'neutral' on 100% of responses in this run; treat this as a classifier-not-yet-reliable signal, not as a finding that AI is uniformly neutral about you.**" |
| Rank position distribution | scores.json `scores[].rank_position` | Count by value where `named=true`. Current run: all 26 = 1. | "When named, AI placed your brand at position 1 of the entities it listed in every case. **The rank field currently distinguishes only 'mentioned' from 'not mentioned' — true ordinal ranking inside lists is not yet extracted.** Flag this so the customer doesn't read '#1 every time' as a leaderboard finding. |
| Citation rate by engine | scores.json `summary.by_llm[*].citation_rate` | — | Same as the per-engine citation row in S7 — repeat here as the dedicated citation table with engine-shape disclaimer. |
| Citation rate by category | scores.json `summary.by_category[*].citation_rate` | — | Same as the per-category citation row in S7. |
| Unfiltered entity frequency | scores.json `scores[].mentioned_competitors` flattened | Top-N by frequency, no filtering. | "These were the entities AI named most often across all 199 responses, regardless of relevance. Includes generic platforms (Google, Wikipedia) and AI-engine self-references (ChatGPT, Claude). **Shown unfiltered so you can see what AI is anchoring its answers around; not a competitor list.**" |
| Brand-query named rate | derived from scores.json, `category=brand` | named=true count / total brand rows | "Named on 96.3% of queries that contain your brand name. This is a baseline / sanity check — it confirms AI knows your brand exists when prompted directly. It is NOT a visibility number." |
| Non-brand named rate | derived from scores.json, `category != brand` | named=true count / total non-brand rows | "Named on 0% of queries that do NOT contain your brand name. **This is the visibility number** — it answers 'when buyers ask about my category without naming me, does AI surface me?'" |

### What this section does NOT claim
- Does not prescribe actions, owners, briefs, or measurement plans. The 60-day queue is consulting — SGD 2,500 tier.
- Does not estimate time-to-impact for any change.
- Does not score the importance of each citation source.
- Reports sentiment AS-IS even though the classifier returned 100% neutral in this run — flagged as a known limitation.
- Reports rank AS-IS even though the field always returned 1 when present — flagged as a known limitation.
- The per-engine citation rates reflect API-shape differences (Perplexity surfaces citations natively; ChatGPT/Claude/Gemini rarely do via the current call pattern). The customer must see this caveat or they will misread 72% Perplexity vs 0% Google as a brand failure on Google.
