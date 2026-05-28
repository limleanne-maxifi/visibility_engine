# PROJECT STATE — AI Visibility Report (Maxifi Digital)

> Handoff / resume doc. Read this first to continue the build without breaks.
> Last updated: 2026-05-28 (rev 9 — S1–S4 honesty overhaul SHIPPED & LIVE (main=`b112bd8`). FOUR pre-existing production bugs found & fixed this session, including a silent-write RLS misconfiguration that had the funnel capturing ZERO leads. Funnel restored. See §0.).

## 0. ⚠️ READ FIRST — current state (rev 9, 2026-05-28)

**Production main SHA:** `b112bd8` (was `9b020d1`). Deploys live to checkyourvisibility.maxifidigital.com from `main`.

**Free snapshot (S1–S4) honesty overhaul — SHIPPED & LIVE.** The free report was previously almost entirely fabricated (named competitors, fake per-platform %, "31 firms" cohort, phantom action plan). Now every free-tier claim traces to form input or the per-industry benchmark lookup. Verified live via real production form submission (row written, `/r/{token}` rendered honest snapshot).

Merged branch `feat/s1-s4-honesty` (5 commits): `7bb52a1`, `998320a`, `d0bf046`, `38bc71c`, `85b3022`.

Key product decisions baked in:
- 60-day action plan MOVED from SGD 250 Full Report → SGD 2,500 Strategic Baseline + Consult tier.
- S5–S8 retitled: "Who AI mentions when you're not named" / "How AI describes you" / "Query coverage" / "Sentiment, rank & citation health".
- AIO + Copilot kept in the 6-platform vocabulary but render "Not measured — Retainer" (no fake numbers). See CLAUDE.md RESOLVED-4 (reconciliation) + RESOLVED-6 (terminology).
- Terminology rule: free = "snapshot", paid SGD 250 = "report"/"Full Report". CLAUDE.md RESOLVED-6.
- Claude action-plan API call gated off (`DISABLE_CLAUDE_ACTION_PLAN = true` in `app/api/generate/route.ts`); plumbing preserved for Option A.

**FOUR pre-existing production bugs found & fixed this session (NOT caused by the branch):**
1. **502 on every form submit** — un-gated failing Claude call. Fixed by Option γ gate.
2. **`reportToken: ""`** → client fell to dead `/results/{id}` → 404. Fixed (`85b3022`).
3. **`reportUrl` double-slash**. Fixed (`85b3022`).
4. **Silent write failure** — `aeo_leads` RLS enabled but INSERT policy bound to no roles (`applied_to = {}`) and no SELECT policy. Funnel captured ZERO leads. Fixed via SQL on prod Supabase (anon INSERT + SELECT policies added, both now `{anon}`). Verified end-to-end.

**Correction to prior §0 note:** the earlier "dead engine = artificially low score" framing was already corrected to "dead engine = WRONG score, direction unpredictable" (folded into FULFILLMENT_SOP Step 3 wording via V2_COPY_DELTA §6).

### Smoke tests — PASSED ✅ (rev 9 production verification, 2026-05-28)
- Real incognito form submission → row written to `aeo_leads` → `/r/{token}` rendered honest snapshot.
- `/api/generate` returns 200 with real `reportToken`, `reportUrl` single-slash, gated empty `plan`.
- AIO + Copilot S3 rows render as "Not measured — Retainer (SGD 4,500/mo)".

**Rollback if ever needed (forward-only, NO force-push):** `git revert -m 1 b112bd8 && git push origin main`. (Do NOT use reset --hard + force-push on main.) The 5 commits are reachable on `feat/s1-s4-honesty` branch on origin for re-application.

## 0b. 🔴 THE REAL REMAINING PRIORITIES (post-launch)

1. **One REAL engine run** — `PYTHONPATH=src python -m visibility_engine.run --slug X --url Y --email Z` against a test domain to your own inbox. Confirms LLM keys + live output + email delivery work. **Gates taking any paid order** AND is the dependency for #2. Pre-flight: confirm LLM keys (OpenAI/Anthropic/Gemini/Perplexity) + SMTP set (dry-run never needed them). Status (rev 9): first clean 4-engine baseline run completed (maxifi-test, 2026-05-27): named rates 12–14% across engines; citation rates Perplexity 72% / Claude 8% / OpenAI 2% / Google 0%. OpenAI 403 fixed (model access enabled). SMTP/email delivery in the engine still broken (placeholder `smtp.yourprovider.com`) — separate workstream, use Resend or real SMTP.
2. **🔑 CREDIBILITY FIX — Option A (real measured data point in the FREE snapshot).** The free snapshot is a *self-assessment* — derived from the user's dropdown answers, reflected back as prose. It is NOT a measurement and skeptical buyers will see through it. To prove the tool is real, the free snapshot needs one genuine observed data point the user did NOT supply. Recommended "Option A": on submit, fire ONE real query to one AI engine ("best [industry] companies?") and show the actual answer with their brand highlighted/absent + the competitors that actually got named. Verifiable, undeniable, makes the paid Full Report (50-query × 4-engine measured run) an obvious upgrade. Depends on #1 (same LLM-key plumbing). Build on a fresh branch off main. The static S1 placeholder is reserved for Option A's render — sections must NOT be renumbered (see CLAUDE.md RESOLVED-10).
3. Optional product idea: replace/augment with an "enterprise AI engines in use?" CONTEXT question (stored, not scored, honestly framed as not-yet-measured) — lower priority than #1/#2.

## 0c. COPY/UX POLISH — status

1. **✅ SHIPPED — `claude/email-copy-pass`** (merged, `fd9537e`): lead-nurture email (`lib/email.ts`) — removed "undiagnosed" (confident zero-score framing), reframed the bottom "Methodology & Limitations" 5-bullet block into one forward-pointing line, thinned hedging. Tested in inbox before promote. Live.

2. **✅ SHIPPED — `claude/reframe-signals`** (merged into `771b0dc`): reframed all 3 self-report signal questions (S2 competitiveStanding, S3 queryCoverage, S4 platformConsistency) into natural language + helper line "Best estimate is fine — your full report measures this precisely." COPY ONLY — scores unchanged (90/60/30/5/0 etc. identical). Updated in lockstep across 6 files: `lib/types.ts`, `lib/scoring.ts`, `lib/buildTeaserReport.ts` (getFailureMode), `Step3Awareness.tsx`, `Step4Coverage.tsx`, AND `app/methodology/page.tsx` (the methodology page renders the option strings in its signal tables — had to align or the form and methodology page would show different wording). New shared zero-option text: "Not sure — I haven't looked into this". [DECISION] "Not sure = 0 penalty" left AS-IS (a fairness fix to a neutral midpoint is deferred — it changes score behaviour, needs strong/weak re-test).

   **⚠️ BACKFILL was required and DONE.** Reframing scored answer strings broke existing leads: 4 of 87 rows had the new 4-signal columns populated with OLD strings. On the free `/r/[token]` recompute path, old strings no longer match the new `===` comparisons → fall through to `:0` → score collapses to ~27/100 (and Section 2 contradicts the band). A one-time backfill `UPDATE` (old→new string per the 13 mappings) was run on prod to convert those 4 rows. Verified the all-strong test lead (id 35190fe0…, token 0040cc7d…) holds new strings + stored 92/Strong.

   **🔑 SHARP EDGE — READ BEFORE CHANGING ANY SCORED ANSWER STRING:** the pre-migration safeguard in `buildReportFromLead` is a **NULL-check, not a validity-check** (`!!(field && field && field)` is true for any non-empty string, including stale ones). So changing any scored option string silently breaks every existing row that stored the old value, on free-report recompute. ANY future answer-string change MUST be paired with a backfill `UPDATE` of existing rows. Safe order is **deploy code FIRST, then backfill** (old strings only break once new code is live); this session the backfill was run slightly before the deploy, creating a brief new-data/old-code window for 4 rows — harmless in the event but do it deploy-first next time. Better long-term fix (deferred): make the safeguard a value-VALIDITY check (recognise the current valid option set) so stale strings fall back to stored score instead of recomputing to 0.

3. **✅ SHIPPED — Methodology-in-report (FULLER version)** (merged into `9b020d1`): a collapsible "How this score is calculated" panel in the report (`/r/[token]`, below score, above table of contents) showing each of the 4 signals, the user's own answer, and its weighted contribution (e.g. 90 × 30% = 27.0), summing to their score. Makes the score look *derived*, not *asserted* (counters "looks AI-generated"). Component = `ScoreBreakdownPanel` in `ReportPage.tsx`; data via new `getScoreBreakdown` in `lib/scoring.ts` + optional `breakdown` field on `ScoreData`. **scoring.ts was refactored to single-source point ladders** (`signal1-4Points` helpers + `SIGNAL_WEIGHTS`) shared by `getVisibilityScore` and `getScoreBreakdown` so they can't drift — `getVisibilityScore` output verified UNCHANGED (all-strong→92, all-weak→14, etc.). Panel renders only when `breakdown` present (absent on pre-migration/stored-score path → panel silently hidden, by design). Plus a contrast pass on the report's faint trust/footer lines (scoringNote, methodology+email links, disclaimer, benchmark, top eyebrow→12px). Pure additive presentation — no backfill, no DB change. NOTE: the panel quotes the user's verbatim answers, which makes the self-report basis MORE visible — honest, and reinforces why Option A (a real measured data point) is still the structural credibility fix.

4. **✅ SHIPPED — S1–S4 honesty overhaul + Option γ Claude gate + 4 prod-bug fixes** (merged into `b112bd8`): see §0.

### Scoring model — how the number is derived (reference)
Score = round(S1×0.30 + S2×0.30 + S3×0.25 + S4×0.15). Each signal maps a dropdown answer to points. S1 platform presence (accurate=90…not-mentioned=0), S2 competitive displacement (prominent=90…competitors-win=5, not-checked=0), S3 query coverage (most=90…name-only=20, not-tested=0), S4 cross-platform consistency (all=100…one=25, none=0). Theoretical max = 92% (intentional headroom for what only direct measurement confirms). Benchmark = per-industry median from `INDUSTRY_BENCHMARKS` lookup (~30 sectors; B2G/procurement set lower). "X of 10 buyer conversations" = round(score/10) vs round(benchmark/10). All self-reported — not measured (that's what the paid engine + Option A address).

### Sharp edges (rev 9 additions)

- **Supabase access uses the ANON key for BOTH reads and writes** (`lib/supabase.ts` `getClient`). Funnel works via a public anon INSERT policy (`with check (true)`). Functional but not the ideal posture — see deferred backlog Fix 2 (§7).
- **Deploy previews cannot write to Supabase** (preview env context misconfigured — SUPABASE_URL / SUPABASE_ANON_KEY not scoped to Deploy Previews). Smoke-test on production via the REAL form, not curl. Hand-crafted curl payloads crash the route before the DB call (wrong field shape — e.g. requires `aiPresence` not `awareness`, `challenges` array not `goals`) and give false "success-but-no-row" signals. See CLAUDE.md RESOLVED-8 and RESOLVED-9.

## 1. What this product is

A two-part product across two repos:

- **`visibility_view`** — Next.js app, deploys on **Netlify**. Hosts the free snapshot and the unlock/sales page. This is the customer-facing web app.
- **`ai-visibility-engine`** — Python CLI + FastAPI (`server.py`). Runs live AI-citation tests across ChatGPT / Perplexity / Gemini / Claude and produces a **measured PDF report**, delivered by email. NOT deployed anywhere — laptop-only today.

These two are **not wired together**. The engine delivers by email/Slack; the app reads from Supabase. There is no engine→app data pipeline (this is a known, deferred gap; Option A is the planned first step toward closing it).

## 2. Pricing & offer model (DECIDED — "Option 1, ship this week")

| Tier | Contents | Delivery | Price |
|------|----------|----------|-------|
| Free | Web snapshot, sections 1–4 | View-only at `/r/{token}` (no PDF) | Free |
| Full Report | All 8 sections, **measured** | **PDF by email** (engine run) | **SGD 250** → **SGD 450 on 1 July 2026** |
| Strategic Baseline + Consult | measured baseline + interactive report + strategy call + 60-day action plan | book a call | SGD 2,500 (one-time) |
| Visibility Engine Retainer | monthly re-measurement / tracking (includes Copilot coverage) | book a call | SGD 4,500 / month |

- SGD 250 is the **Airspace World 2026 launch rate**, valid **through 30 June 2026**, rising to **SGD 450 on 1 July 2026**.
- Fulfillment of the SGD 250 Full Report is **MANUAL for now**: customer pays via Stripe → you run the engine on their domain → they get the emailed PDF.
- **Stripe Payment Link (SGD 250):** `https://buy.stripe.com/8x2eVeciQf6W5wv6gh8og00`
- **Booking link ($2,500 / $4,500):** `https://lunacal.ai/maxifidigital/`

### Honesty rules (do not violate)
- The unlock page sells "all 8 sections, measured, delivered as a PDF by email within 1 business day." It does **NOT** promise the emailed PDF is pixel-identical to the web V2 design.
- The blurred sample on the unlock page is a **labelled example** ("yours will show your data") using generic Competitor A/B/C — never pass off fixture data as a real customer's.
- In-app, sections 5–8 stay **locked** on `/r/{token}` for real leads. Measured data arrives ONLY via the emailed PDF. Never fabricate measured s5–8 in the app (see `DATA_CONTRACT.md`).
- Free deliverable = "snapshot". Paid SGD 250 = "report" / "Full Report". Never call the free deliverable a "report." (CLAUDE.md RESOLVED-6.)

## 3. Repo / branch state (`visibility_view`)

| Branch (origin) | Tip | Contains | Deployed? |
|---|---|---|---|
| `main` | `b112bd8` | Funnel + 4-signal scoring + methodology page + 6-step form + **S1–S4 honesty overhaul + Option γ Claude gate + 4 prod-bug fixes** (rev 9 work). | **LIVE in production** (`checkyourvisibility.maxifidigital.com`) — verified ✅ |
| `feat/s1-s4-honesty` | `85b3022` | Source of the rev-9 merge. Can be deleted (merged to main as `b112bd8`). | merged |
| `docs/sections-spec` | `f5384eb` | Spec docs: SECTIONS_SPEC.md, V2_COPY_DELTA.md, S1-S4_HONESTY_DELTA.md. Not yet merged to main. | not deployed (docs only) |
| `main-backup-4signal` | `3d57260` | Original 9-commit 4-signal line. **Superseded** — the valuable parts were already ported into the live product. Keep for reference. | safe, not deployed |
| `staging` | `69d38a4` | Old funnel staging line, now well behind main. | stale |
| tag `prod-pre-4signal-8bac0a0` | `8bac0a0` | Historical rollback marker — production state just before 4-signal went live. | — |

### Key files
- **Report renderer:** `components/report/ReportPage.tsx` — V2 design (gold `#C87A2F`, navy `#152438` / `#091521`, Inter font). Sections `S1Visibility`…`S8ActionQueue`, `LockedSection`, `ScoreCircle`. **S1Visibility now renders a static placeholder (Option A slot).**
- **Report route:** `app/r/[token]/page.tsx` — `getReport()` calls `getLeadByToken` + `buildReportFromLead`. `preview-free` / `preview-paid` tokens render mock fixtures (`data/fixtures/report_mock.ts`).
- **Report builder:** `lib/buildTeaserReport.ts` — `buildTeaserReport`, `buildReportFromLead`, `buildScore`, `buildS1..S4`. s5–8 set to `null` (locked) for real leads. `buildS1` data path intact for Option A forward-compat (renderer ignores it for now).
- **Supabase:** `lib/supabase.ts` — `insertLead(formData, plan, extras)`, `getLeadByToken(token)`. Token = `report_token` column. Uses ANON key for reads AND writes (see §0c sharp edges + CLAUDE.md RESOLVED-7).
- **Report type:** `lib/reportTypes.ts` — `ReportData` (s1–s8). New `PlatformMeasurementState` field on `PlatformPriorityRow` (rev 9).
- **Form:** `components/MultiStepForm.tsx`. Industry field in `components/steps/Step2Context.tsx`.
- **Generate API:** `app/api/generate/route.ts` — `DISABLE_CLAUDE_ACTION_PLAN = true` constant gates Claude call (rev 9).

### Supabase migration — DONE
Columns on `aeo_leads`: base + `competitive_standing`, `query_coverage`, `platform_consistency` (4-signal), `report_token` (text, unique index), `report_data` (jsonb), `paid` (bool default false), `stripe_session_id` (text), `status` (text default 'teaser_sent'), `founding` (bool default false).

**Supabase RLS policies on `aeo_leads` (set 2026-05-28, see CLAUDE.md RESOLVED-7):**
- `anon insert leads` — INSERT, to `anon`, WITH CHECK (true)
- `anon read leads by token` — SELECT, to `anon`, USING (true)

## 4. Done so far ✅
- Supabase migration applied (+ unique index on `report_token`).
- Netlify env vars set (price + base URL). **Set `REPORT_PRICE` explicitly** to avoid old `$249` vs `SGD $2,500` fallback mismatch.
- Stripe Payment Link created.
- Security check: committed git history is CLEAN. Real keys had only ever appeared in a **local stash (now dropped)**, never committed. The committed `.env.local.example` holds only short placeholder strings. **No key rotation needed.**
- Unlock page design approved + shipped + rev-9 retitled per V2_COPY_DELTA §2.
- 4-signal scoring + methodology page + 6-step form + score-breakdown panel — all live (rev 5–8).
- **S1–S4 honesty overhaul, terminology rule, Option γ Claude gate, 4 prod-bug fixes — all live as `b112bd8` (rev 9).**

## 5. TODO (resume here) ⬜

### STILL OPEN ⬜
1. **One REAL engine run** (not dry-run) for a test domain — confirm real data populates + email delivery works, BEFORE taking any paid order. See §0b.1. Pre-flight: confirm LLM keys + SMTP. Run: `PYTHONPATH=src python -m visibility_engine.run --slug <slug> --url <url> --email <you>`.
2. **Option A** — real single-query proof in S1 (see §0b.2). Depends on engine being hosted somewhere (currently laptop-only).
3. Marketing site content pass (`maxifi-digital`) — site links to prod app via CTAs (no code merge needed), but copy still describes old model ("5 engines"/"24 hours"/3-stage Snapshot→Report→Monitor) and omits SGD 250/450 pricing. Reconcile copy with the actual product when convenient (not blocking).

### Production right now
`main = b112bd8` = the V2 funnel + S1–S4 honest snapshot + Option γ gate + the four bug fixes, **LIVE** at `checkyourvisibility.maxifidigital.com`. Selling at SGD 250 is possible as soon as the one real engine run confirms fulfillment.

## 6. Engine (`ai-visibility-engine`) — how to run & known issues
- **No `pyproject.toml`/`setup.py`** — `pip install -e .` fails. Run with `PYTHONPATH=src` prefix.
- **Run a full measured report (uses API, costs money, emails PDF):**
  `PYTHONPATH=src python -m visibility_engine.run --slug <slug> --url https://<their-site> --email <their-email>`
- **Re-render report only from existing data (no API spend):**
  `PYTHONPATH=src python -m visibility_engine.report data/<slug>/<date> --dry-run`
- **WeasyPrint can't render PDF on the Windows laptop** (missing GTK `libgobject-2.0-0.dll`). Fulfillment fallback: engine emits HTML → open in **Chrome → Ctrl+P → Save as PDF** → email manually. (This Windows pain disappears when the engine is later hosted on Linux.)
- **Engine PDF template** `src/visibility_engine/templates/report.html.j2` reskinned toward V2 on branch **`reskin-pdf-v2-design`**. Colors still drift from exact V2 (navy used `#0E1A26`/`#070E15` instead of `#152438`/`#091521`; gold numbers `#E8A030` instead of `#C87A2F`). **Decided to ship on current colors; revise template later.**
- **First clean 4-engine baseline run completed** (maxifi-test, 2026-05-27): named rates 12–14% across all engines; citation rates Perplexity 72% / Anthropic 8% / OpenAI 2% / Google 0%. OpenAI 403 fixed (model access enabled). SMTP/email delivery still broken (placeholder host) — separate workstream.
- Existing real run data lives at `data/maxifi/2026-05-23/` and `data/maxifi-test/2026-05-27/`.

## 7. Deferred / backlog (rev 9, priority order)

1. **Service-role key for server-side writes (Fix 2).** Move `/api/generate` writes to `SUPABASE_SERVICE_ROLE_KEY` (server-only) so the funnel doesn't depend on a public anon INSERT policy. Plan into Option A sprint.
2. **Tighten anon SELECT policy** (currently `using (true)` — reads any row). Token is unguessable (128-bit UUID) so practically OK at launch, but harden later — either token-aware policy or move reads server-side with service-role.
3. **Fix preview Supabase env scoping** in Netlify so previews can exercise the funnel (scope `SUPABASE_URL` / `SUPABASE_ANON_KEY` to Deploy Previews context).
4. **benchmarkLabel "average median" doubled noun** — visible on live render ("Legal & Legal Services average median"). Contract-level fix at `buildScore` (drop "average" from the label) + update `DATA_CONTRACT.md` consumers.
5. **Original 502 Anthropic cause** — pull Netlify function log for request `01KSPWWW7Y0VVFJFT1JB03JN08` to learn why the Claude call was failing (key? quota?). Relevant if Option A re-enables a Claude call.
6. **email.ts L199** — paragraph reads snapshot → Full Report across two sentences; accurate but wants a structural restructure.
7. **Resend failure observability** — `/api/generate` email sends fail silently (`console.error` only). Pipe to a dashboard or surface in the API response.
8. **Dead `/results/[id]` route** — legacy duplicate of `/r/[token]`; the form's fallback redirect points at it. Remove or repoint.
9. **S8 internal identifiers** — `lib/reportTypes.ts:219` + `DATA_CONTRACT.md` still call S8 "60-Day Action Queue" (internal-only contract identifiers, not user-facing — out of RESOLVED-6 scope). Tidy when engine emits the new S8 shape.
10. **INDUSTRY_BENCHMARKS provenance** — confirm medians are documented before "sector median" framing scales beyond launch.

## 7a. Carry-over engine fast-follow (post-launch, eng-side)
- Reskin engine PDF template to exact V2 colors (branch `reskin-pdf-v2-design`).
- Build engine→app measured-data wire (engine writes `report_data` s5–8 to Supabase) so the web report and/or a generated PDF show real measured data.
- Build a V2→PDF generator (turn the web `ReportPage` into a PDF) — this is what would let the emailed deliverable match the V2 web design exactly.
- Host the engine (Render/Railway/Fly, Linux) with a public URL + LLM keys + SMTP, so the app can auto-trigger runs on Stripe payment (webhook) instead of manual fulfillment. **This is the Option A precondition.**
- Add `pyproject.toml` to the engine so it installs properly.
- Subscription billing (Stripe subscriptions) for the $4,500/mo retainer.

## 8. Environment / housekeeping notes
- Keep real secrets ONLY in `.env.local` (gitignored) or Netlify env — never in `.env.local.example`.
- The `claude-mem` Claude Code plugin throws harmless `zod/v3` stop-hook errors after each turn — ignore (or disable the plugin).
- When building in Claude Code: always run on a branch, gate on `tsc --noEmit` + `npm run build`, review diff, then push. Never push to `main` directly; promote via PR + merge. (Rev 9's `feat/s1-s4-honesty` followed this pattern.)
- Watch the 3 co-touched files for merge conflicts: `app/api/generate/route.ts`, `lib/supabase.ts`, `app/r/[token]/page.tsx`.

## 9. Email alignment (browser → email → payment must be seamless)

There are THREE emails in the system, in two repos — keep this straight:
- **`lib/email.ts` → `sendUserPlanEmail`** (app, Resend) — the FREE/snapshot-link email sent on form submit; links to the web snapshot `/r/{token}`. (Subject is already "Your AI Visibility Snapshot — …", correct per RESOLVED-6.)
- **`app/api/share-snapshot/route.ts`** (app, Resend) — a separate "share" email; verify if it's in the live flow, then align its colors too.
- **Engine `deliver.py`** (Python repo) — emails the PAID SGD 250 measured PDF. Uses the engine's own (deferred) styling. Known gap, accepted for launch.

### Logic — ALIGNED by shared data, NOT by shared render (by design)
- Email and web snapshot **both read the same source**: stored `report_data` (score/band/benchmark/diagnosis) + `lib/scoring.ts` helpers. So the NUMBERS a customer sees in the email match the web snapshot. ✅
- BUT: the email does **NOT** call `buildReportFromLead`. It composes its OWN concise summary prose (`benchmarkLine`, `buyerConvLine`, subject) from those shared numbers. This is correct — an email should be a summary, not the full 8-section report.
- **Drift risk:** because the email's prose is authored separately, if you change scoring/section logic in `buildTeaserReport.ts` or `scoring.ts`, the email won't auto-follow its wording. **Rule: when you change report scoring or section logic, check `lib/email.ts` too.**
- **Fallback seam:** if `report_data` is null (old leads), email live-computes via `scoring.ts`. New leads always have stored `report_data`.

### Handover summary
- FREE path: form → snapshot at `/r/{token}` → email link → unlock page → Stripe. Gold/navy/V2-consistent, terminology snapshot/report distinct (RESOLVED-6).
- PAID path: Stripe → manual engine run → engine emails measured PDF (engine styling, deferred). The ONE accepted brand exception at launch.

## 10. History — 4-signal reconciliation (rev 6–8, now closed)

Historical note: rev 6–8 work folded the 4-signal scoring + methodology page + S2 failure-mode fix from the parallel `main-backup-4signal` branch into the live funnel. That reconciliation is DONE and the funnel has been the unified version since `9b020d1`. Rev 9 (this rev) builds on top of that and the S1–S4 honesty work — same `main` lineage, no further reconciliation needed.

- `main-backup-4signal` = `3d57260` (preserved; superseded)
- `staging` = `69d38a4` (stale; behind main)
- Tag `prod-pre-4signal-8bac0a0` = `8bac0a0` (historical rollback marker)

## 11. Roadmap (rev 9, unchanged scope, now unblocked)

Free-snapshot honesty = DONE/live. Funnel = restored (writes + reads). Next:

- **Phase 3 — engine gaps** for the PAID S5–S8 (work happens in `ai-visibility-engine`):
  - **Gap 1: citation URL extraction** (highest-value; Perplexity already 72% citation rate — capture the URLs).
  - **Gap 2: descriptor extraction** (how AI describes the brand when named — verbatim sentences containing the brand mention).
  - **Gap 3: customer competitor seed** (form field + engine filter to scope `mentioned_competitors` to rivals the customer actually cares about, instead of "ChatGPT/Google/Wikipedia").
  - Schema/sitemap crawl DEFERRED.
- **Phase 4** — rewrite paid S5–S8 builders in `lib/buildTeaserReport.ts` against real engine output, per `docs/SECTIONS_SPEC.md` (on `docs/sections-spec` branch). Triggered once engine gaps close.
- **Option A sprint** — deploy the FastAPI engine (`server.py`) to a host (Render/Railway/Fly) with API keys as env vars + rate limiting + daily cost cap; add a `/probe-one` route wrapping a single-query call; wire the free path to call it on submit; replace the static S1 with a real verbatim-response proof. The service-role write migration (backlog #1) can ride along. **This is the structural credibility fix for the free funnel.**
