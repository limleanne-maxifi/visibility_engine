# V2_COPY_DELTA.md — concrete copy changes to align S5–S8 with engine output

> Generated 2026-05-27. Companion to SECTIONS_SPEC.md.
> All deltas below are copy-only specs — no code in this document. Apply via Claude Code in a follow-up.
> Reference run: `data/maxifi-test/2026-05-27/` — 50 queries × 4 engines, 199 responses, named_rate 0.131, citation_rate 0.206.

---

## 1. v2-mockup.html — exact S5–S8 deltas

### 1.1 Engine count cleanup (applies BEFORE S5)

The mockup currently shows 6 platforms in the free S1 "Current citation snapshot" and the S3 "Platform visibility overview": ChatGPT, Perplexity, Google AI Overviews, Microsoft Copilot, Claude, Gemini.

The engine currently covers 4: **ChatGPT (openai), Claude (anthropic), Gemini (google), Perplexity**.

**Delete from S1 (`<section id="cite">`):** the two `.cite-row` blocks for `Google AI Overviews` and `Microsoft Copilot`.
**Delete from S3 (`<section id="platforms">`):** the two `.platform-card` blocks for `Google AI Overviews` and `Microsoft Copilot`.
**Keep:** ChatGPT, Claude, Gemini, Perplexity rows / cards.
**Order them consistently across S1 and S3** as: ChatGPT → Claude → Gemini → Perplexity. (Engine code order: openai, anthropic, google, perplexity.)

Add a methodology link at the bottom of S1 reading:
> Four engines measured this run: ChatGPT, Claude, Gemini, Perplexity. See methodology for why and what's deferred.

### 1.2 Hero & TOC rename (line 766–775)

**Current TOC entries to change:**

| Old | New |
|---|---|
| `5 · Competitor displacement` | `5 · Who AI mentions when you're not named` |
| `6 · Positioning gap` | `6 · How AI describes you` |
| `7 · Target query gap` | `7 · Query coverage` |
| `8 · 60-day action queue` | `8 · Sentiment, rank & citation health` |

### 1.3 Paywall hero (line 1010–1020) — replace entirely

**Delete (current copy):**
> The four sections below answer "what should I actually do about it?"
> Your free snapshot tells you where you stand. The full report tells you which competitor to displace first, what your positioning sentence needs to say, which queries to win in order, and exactly what to ship in the next 60 days — sequenced by impact and effort.
> Includes all 4 sections below · delivered to your inbox · no sales call required

**Replace with:**
> The four sections below show the rest of what we measured.
> Your free snapshot is the headline. The full report opens the per-query × per-engine matrix, the entities AI names instead of you, how AI describes your brand when it does name you, and the limitations of each measurement so you can read it honestly. A 60-day action plan is not part of this report — that is a separate Strategic Baseline + Consult engagement.
> All 4 sections below · delivered as a PDF · within 1 business day · no sales call required

### 1.4 S5 — replace entire section (line 1023–1060)

**Section title block:**
- `locked-num`: `Section 5 · Locked` → unchanged
- `locked-title`: `Competitor displacement analysis` → `Who AI mentions when you're not named`
- `locked-sub`: replace
> *Old:* "Named ranking of the competitors currently holding citation slots that belong to you, with the exact queries they're winning and why."
> *New:* "For each competitor you named in your form submission, how often AI mentioned them across the 50 buyer-intent queries where your own brand was not named — broken down by engine and by query category."

**Preview rows (the four `.preview-row` blocks):** delete the existing placeholder "Forge & Loom · Wins 7 of 12 queries · positioning: …" rows. They imply win/loss measurement and ranked positioning — neither is in the engine output.

Replace with four placeholder rows in the same `<strong>…</strong> <span>…</span>` format that show the *kind* of data S5 will contain:
- `<strong>[Competitor you seeded]</strong>` + `<span>Mentioned on X of N queries where your brand was not named</span>`
- `<strong>By engine</strong>` + `<span>Perplexity X · ChatGPT Y · Claude Z · Gemini W</span>`
- `<strong>By category</strong>` + `<span>Most often on competitive, service, and how-to queries</span>`
- `<strong>Co-mentioned with you</strong>` + `<span>Named alongside your brand on N queries (out of M where you were named)</span>`

**`locked-cta-row .pill` text:** "Unlock to see the full ranking, queries & counter-moves" → **"Unlock to see the full mention table for each competitor you seeded"**.

### 1.5 S6 — replace entire section (line 1063–1101)

**Section title block:**
- `locked-title`: `Positioning gap analysis` → `How AI describes you`
- `locked-sub`: replace
> *Old:* "The exact one-sentence positioning your buyers will accept (and AI engines can extract), benchmarked against what you submitted and what your competitors say."
> *New:* "Verbatim extracts of how each engine described your brand on the queries where it named you, compared to the positioning you submitted in your form. Reports text, not a recommended rewrite."

**Preview rows:** delete the four current rows ("Your stated positioning", "What AI engines surface", "Recommended sharper claim", "Evidence required"). Two of those (recommended claim, evidence required) are consulting deliverables.

Replace with four rows:
- `<strong>Your stated positioning</strong>` + `<span>[verbatim from your form]</span>`
- `<strong>How ChatGPT described you</strong>` + `<span>[verbatim sentence containing your brand mention]</span>`
- `<strong>How Claude described you</strong>` + `<span>[verbatim sentence containing your brand mention]</span>`
- `<strong>Shared vs missing terms</strong>` + `<span>Words shared with your stated positioning: [...]. Words AI used that you did not: [...].</span>`

**`locked-cta-row .pill` text:** "Unlock to see the full positioning workshop output" → **"Unlock to see how each engine described your brand, verbatim"**.

### 1.6 S7 — replace entire section (line 1104–1132)

**Section title block:**
- `locked-title`: `Target query gap analysis` → `Query coverage — where you appear and where you don't`
- `locked-sub`: replace
> *Old:* "The 12 buyer-intent queries we recommend you win, ranked by reachable impact. For each: current state, blocking factor, and content brief."
> *New:* "The full 50 buyer-intent queries × 4 engines matrix. For each query: which engines named you, which didn't, and whether a source was cited. No prioritisation — that is consulting work, not measurement."

**Preview rows:** delete the five current items ("best AEO agency for B2B SaaS · competitor-held · high reachability" etc). They imply curated targeting and editorial judgement.

Replace with five preview rows of the same `<li>` format that demonstrate the actual content:
- `1 · "What is Answer Engine Optimisation…"  ·  awareness  ·  named on 0 of 4 engines  ·  citations on 1 of 4`
- `2 · "Who provides the most actionable AI visibility audits…"  ·  competitive  ·  named on 0 of 4  ·  citations on 1 of 4`
- `3 · "How does the Maxifi AI Visibility Snapshot work?"  ·  brand  ·  named on 4 of 4  ·  citations on 1 of 4`
- `4 · "How can an aviation company improve its AI visibility?"  ·  segment  ·  named on 0 of 4  ·  citations on 1 of 4`
- `5 · "Why does my competitor keep getting recommended…"  ·  pain_point  ·  named on 0 of 4  ·  citations on 0 of 4`

**`locked-cta-row .pill` text:** "Unlock all 12 queries with full briefs" → **"Unlock the full 50 × 4 matrix with citation flags"**.

### 1.7 S8 — replace entire section (line 1135–1181)

**Section title block:**
- `locked-title`: `60-day prioritised action queue` → `Sentiment, rank & citation health`
- `locked-sub`: replace
> *Old:* "Ten actions sequenced by impact and effort. Each includes the exact deliverable, who should own it, and how to measure that it landed."
> *New:* "What the engine measured beyond named/not-named: sentiment distribution, rank when named, citation rate per engine and per category, the unfiltered entity-frequency table, and the limitations of each signal so you can read this report honestly."

**Preview rows:** delete the five `.action-row` blocks ("Wk 1–2 · Ship Organization + Author schema…" etc). Every row is consulting prose.

Replace with five rows in the same three-column grid format. Reuse the `.action-row` / `.action-window` / `.action-title` / `.action-impact` classes but with new column meanings: **`Signal | Reading | Caveat`**. (Optional CSS rename: `.action-row` → `.signal-row`; same layout works.)

- `Sentiment` · `26 of 26 mentions classified neutral, 0 positive, 0 negative` · `Classifier returned 'neutral' on 100% of rows — treat as not-yet-reliable`
- `Rank position` · `All 26 mentions at position 1` · `Field currently distinguishes mentioned vs not-mentioned only; not a leaderboard`
- `Citation rate by engine` · `Perplexity 72% · Claude 8% · ChatGPT 2% · Gemini 0%` · `Engine-API shape difference, not a brand-on-Gemini failure`
- `Brand-query named rate` · `96.3% on queries that contain your name` · `Sanity check, not your visibility number`
- `Non-brand named rate` · `0.0% on queries that do not contain your name` · `This is your real visibility number`

**`locked-cta-row .pill` text:** "Unlock all 10 actions with owners, briefs & measurement" → **"Unlock the full signal & limitations table"**.

### 1.8 Footer CTA (line 1185–1191)

**Current copy:**
> Ready to fix this in 60 days?
> The full report comes with a sequenced plan you can hand to your team — or have us run for you. Book a 20-minute walkthrough to decide which.

**Replace with:**
> Want the 60-day plan?
> The Full Report (SGD 250) gives you the measurement. The plan — sequenced, owned, measurable — is the SGD 2,500 Strategic Baseline + Consult. Book a 20-minute walkthrough to scope it.

### 1.9 Hero S1–S4 — small honesty edits (out of scope but flag)

The free hero / S1–S4 copy contains a few claims the engine doesn't currently support: "three competitors are cited where you should be" (no win/loss measurement), specific competitor names (Forge & Loom, Brightline AEO, North Lane Studios — fixture data), and "below industry median (62)" (industry benchmark is a lookup table, not a measurement). These are out of scope for this delta but should be reviewed in the same pass — flag for the next session.

---

## 2. app/report/unlock/page.tsx — changes to describe (apply via Claude Code later)

> File not read in this session — changes below are described, not located by line number. Implementer must read the file first.

1. **Pricing & SLA strip** — no copy change.
2. **What you get list** — find the section that enumerates the 8 unlocked sections. Update items 5–8 to match the new section titles from §1 above:
   - "Competitor displacement analysis" → "Who AI mentions when you're not named"
   - "Positioning gap analysis" → "How AI describes you"
   - "Target query gap analysis" → "Query coverage matrix (50 queries × 4 engines)"
   - "60-day prioritised action queue" → **REMOVE this line entirely.** Replace with: "Sentiment, rank & citation health (with limitations called out)"
3. **"What's NOT in this report" block (NEW)** — add a short panel immediately after the "What you get" list, with this exact copy:
   > **Not in this report:** a 60-day action plan, a recommended positioning sentence, content briefs per query, competitor counter-moves, or owner/ETA assignments. Those are consulting deliverables — included in our SGD 2,500 Strategic Baseline + Consult engagement. The Full Report is the measurement; the consult is what you do about it.
4. **Engine coverage line** — find any line that says "5 engines" or names Copilot / AI Overviews. Replace with: "Four engines measured: ChatGPT, Claude, Gemini, Perplexity. Microsoft Copilot is included in the SGD 4,500/mo Visibility Engine Retainer."
5. **FAQ "Is this measured?" (or equivalent)** — append: "Citation URLs are captured reliably for Perplexity in the current build; ChatGPT, Claude, and Gemini return a citation-found flag but URL extraction across all four engines is on the roadmap. Per-row citation cells flag this where relevant."
6. **Sample blurred report image** — if the locked preview tiles in the sample image still show the old S5/S6/S7/S8 titles, regenerate or swap them. Otherwise the unlock page promises one thing and the report delivers another.

---

## 3. lib/email.ts — changes to describe

> File not read in this session — changes below are described, not located.

Scan `lib/email.ts` for any of these strings; each is a claim the engine cannot back:
- `competitor displacement` / `displacement` → replace with `competitor mention rate` or remove the sentence.
- `positioning gap` → replace with `descriptor capture` or remove.
- `target query gap` → replace with `query coverage`.
- `60-day` / `action queue` / `prioritised action` / `action plan` → remove from the email entirely. The free email must not imply the Full Report contains an action plan. If a CTA references "the plan", reword to "the measurement" or "the report".
- `5 engines` / `five engines` / `Microsoft Copilot` / `Google AI Overviews` (in any context that implies they were measured) → reword to "Four engines: ChatGPT, Claude, Gemini, Perplexity."
- Any sentence asserting a specific competitor name or count of "queries lost" → remove. Engine does not produce this in the free path; the email must not invent it.
- Methodology footer in the email: replace any reference to the old structure with a one-line link: "Four engines, 50 queries, see /methodology for what we measure and what we don't."

The email's own scoring summary (score, band, benchmark line, "X of 10 buyer conversations") is sourced from `report_data` / `scoring.ts` and is unaffected by these deltas — leave it untouched.

---

## 4. Tier coverage table — corrected

Use this exact table in: the homepage pricing block, the unlock page tier list, the methodology page, and any sales collateral that lists tiers.

| Tier | Price | What's measured | What's included | What's NOT included |
|---|---|---|---|---|
| **Free Snapshot** | Free | 4 self-assessment signals + 1 real engine query (Option A, when shipped) | Web report sections S1–S4 at `/r/{token}`. View-only. | No PDF, no per-query matrix, no descriptor extracts. |
| **Full Report** | SGD 250 (launch — SGD 450 from 1 July 2026) | Full 50-query × 4-engine measured run via the AI Visibility Engine | All 8 sections (S1–S8 per SECTIONS_SPEC.md). Delivered as PDF within 1 business day. | No 60-day action plan. No positioning rewrite. No content briefs. No competitor counter-moves. No call. |
| **Strategic Baseline + Consult** | SGD 2,500 (one-time) | Full Report + interpreted | Everything in Full Report, **plus**: 60-day prioritised action queue, recommended positioning sentence, content briefs for the priority queries, competitor counter-positioning, 30-minute strategy call to walk through it. | Ongoing tracking — that is the retainer. |
| **Visibility Engine Retainer** | SGD 4,500 / month | Monthly re-measurement + tracking + Copilot coverage | Everything in Strategic Baseline, **plus**: monthly Engine re-runs, delta tracking against prior runs, Microsoft Copilot included in the engine call set, quarterly review call. | — |

Key honesty rules tied to the table:
- "Measured" appears only in the Full Report row and above. The Free row is "self-assessment + one real query" — never call the Free report "measured" without qualification.
- Copilot is named explicitly only in the Retainer row. Free/Full/Baseline rows must not list 5 engines or imply Copilot coverage.
- Google AI Overviews is not promised in any tier in the current scope. If a customer asks, route to Retainer-tier discussion.

---

## 5. Methodology footer copy

For the methodology page footer and any "How we measured this" footnote on the report itself, use this exact copy:

> **Engines.** Four AI engines are measured in this report: **ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), Perplexity**. These are the four engines our AI Visibility Engine queries via API on every run.
>
> **Why these four.** Each is a major answer-engine surface where B2B buyers ask vendor and category questions in 2026, and each exposes an API our engine can call reliably with stable cost-per-query.
>
> **Microsoft Copilot — deferred.** Copilot uses a different API surface and adds materially to per-run cost. It is included in the **SGD 4,500/mo Visibility Engine Retainer** rather than the one-shot Full Report.
>
> **Google AI Overviews — not in current scope.** AI Overviews surface in Google Search results rather than via a direct model API, which requires a different measurement approach. Customers who need it should ask about Retainer-tier coverage.
>
> **Queries.** Fifty buyer-intent queries across seven categories: awareness, service, competitive, how-to, brand, pain-point, segment. Per-customer query sets are seeded from the company entity (services, target clients, sector) — the engine does not run a fixed industry-agnostic batch.
>
> **What "named" means.** Your brand was mentioned by name in the response. We do not score whether the description was favourable, accurate, or recent — those are separate signals reported in S6 (descriptor extracts) and S8 (sentiment), each with its own limitations.
>
> **What "citation_found" means.** The engine returned a citation marker on that response. URL extraction is reliable on Perplexity in the current build; cross-engine URL capture is on the roadmap. Until then, S7 shows citation as a yes/no flag.

---

## 6. FULFILLMENT_SOP Step 3 — one-line correction

In `FULFILLMENT_SOP.md` Step 3 ("Engine-Health Check"), the third bullet currently reads:

> **The score is not artificially low from a dead engine.** A failed engine counts as zero coverage and drags the engine-average down ~25%. If one engine is dead, the headline score understates the customer's real position — unacceptable to deliver.

Replace with:

> **The score is not wrong from a dead engine.** A failed engine contributes zero coverage on every query, which produces a wrong score — direction unpredictable depending on the customer's actual visibility on the live engines. (For a customer who is strong on the dead engine and weak elsewhere, a dead engine inflates the score; for a customer in the opposite shape, it deflates it.) Either way, do not deliver a report with a dead engine — the number is unreliable, not "conservatively low".
