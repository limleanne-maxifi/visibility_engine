# PROJECT STATE — AI Visibility Report (Maxifi Digital)

> Handoff / resume doc. Read this first to continue the build without breaks.
> Last updated: 2026-05-28 (rev 9 — free snapshot S1–S4 honesty overhaul SHIPPED & LIVE (main=`b112bd8`); 4 pre-existing production bugs found & fixed; funnel lead-capture restored. Prior rev 8: score-breakdown panel + report contrast pass live (main=`9b020d1`). The two big items remain: real engine run + Option A. See §0 / §0b.).

## 0. ⚠️ READ FIRST — current state (funnel + 4-signal scoring BOTH live; reconciliation DONE)

### §0 — Status update (rev 9, 2026-05-28)

**Production main SHA:** `b112bd8` (was `9b020d1`). Deploys live to checkyourvisibility.maxifidigital.com from `main`.

**Free snapshot (S1–S4) honesty overhaul — SHIPPED & LIVE.** The free report was previously almost entirely fabricated (named competitors, fake per-platform %, "31 firms" cohort, phantom action plan). Now every free-tier claim traces to form input or the per-industry benchmark lookup. Verified live via real production form submission (row written, `/r/{token}` rendered honest snapshot).

Merged branch `feat/s1-s4-honesty` (5 commits): 7bb52a1, 998320a, d0bf046, 38bc71c, 85b3022.

Key product decisions baked in:
- 60-day action plan MOVED from SGD 250 Full Report → SGD 2,500 Strategic Baseline + Consult tier.
- S5–S8 retitled: "Who AI mentions when you're not named" / "How AI describes you" / "Query coverage" / "Sentiment, rank & citation health".
- AIO + Copilot kept in the 6-platform vocabulary but render "Not measured — Retainer" (no fake numbers). See CLAUDE.md RESOLVED-4 (reconciliation) + RESOLVED-6 (terminology).
- Terminology rule: free = "snapshot", paid SGD 250 = "report"/"Full Report".
- Claude action-plan API call gated off (`DISABLE_CLAUDE_ACTION_PLAN = true`); plumbing preserved for Option A.

**FOUR pre-existing production bugs found & fixed this session (NOT caused by the branch):**
1. 502 on every form submit — un-gated failing Claude call. Fixed by Option γ gate.
2. `reportToken: ""` → client fell to dead `/results/{id}` → 404. Fixed (85b3022).
3. `reportUrl` double-slash. Fixed (85b3022).
4. **Silent write failure — `aeo_leads` RLS enabled but INSERT policy bound to no roles (`{}`) and no SELECT policy. Funnel captured ZERO leads.** Fixed via SQL on prod Supabase (anon INSERT + SELECT policies added, both now `{anon}`). Verified end-to-end.

**Correction to prior §0 note:** the earlier "dead engine = artificially low score" framing was already corrected to "dead engine = WRONG score, direction unpredictable" (folded into FULFILLMENT_SOP Step 3 wording via V2_COPY_DELTA §6).

---

**Production is current.** Funnel + 4-signal scoring + email copy pass + signal-question reframe + score-breakdown panel + report contrast pass + S1–S4 honesty overhaul are ALL live. `main` = `b112bd8`. Rollback anchor tag: `prod-pre-4signal-8bac0a0` (still valid — predates all of this; forward-only revert via `git revert -m 1 <merge-sha>` otherwise).

| Branch (origin) | Tip | Contains | Deployed? |
|---|---|---|---|
| `main` | `b112bd8` | Full funnel + **4-signal scoring** + methodology page + 6-step form + S2 failure-mode fix + **S1–S4 honesty overhaul**. | **LIVE in production** (`checkyourvisibility.maxifidigital.com`) — verified ✅ |
| `claude/integrate-4signal` | `ea7156e` | The 4-signal integration source (now merged). Can be deleted. | merged |
| `main-backup-4signal` | `3d57260` | Original 9-commit 4-signal line. **Superseded** — the valuable parts (4-signal scoring, methodology page) were ported into the live product. Feedback route / DiscrepancyButton were NOT ported (tied to deprecated /results page). Keep for reference; reconciliation is effectively complete. | safe, not deployed |
| `staging` | `69d38a4` | Old funnel staging line, now well behind main. | stale |
| tag `prod-pre-4signal-8bac0a0` | `8bac0a0` | Rollback marker — production state just before 4-signal went live. | — |

**What's live now (shipped 2026-05-26):**
- 4-signal scoring: `getVisibilityScore(awareness, competitiveStanding, queryCoverage, platformConsistency)`, weights 30/30/25/15.
- 6-step form (was 5): Identity → Context → Awareness (signals 1+2) → Coverage (signals 3+4 + platforms) → Goals → Consent. Step count parameterized via `TOTAL_STEPS`.
- 3 new Supabase columns on `aeo_leads`: `competitive_standing`, `query_coverage`, `platform_consistency` (nullable; migration RUN on prod ✅).
- `/methodology` page (static), linked from report footer.
- S2 failure-mode now derives from all 4 signals (fixes the earlier contradiction where a "Strong" report said "absent entirely"). New modes: `low-query-coverage`, `platform-inconsistent`, `well-positioned`.
- Pre-migration safeguard in `buildReportFromLead`: old rows (null 4-signal fields) use stored `report_data.score` rather than collapsing to ~27/100.

**Rollback if ever needed (forward-only, NO force-push):** `git revert -m 1 9b9996f && git push origin main`. (Do NOT use reset --hard + force-push on main.) Tag `prod-pre-4signal-8bac0a0` + branch `main-backup-4signal` preserve everything.

### Smoke tests — PASSED ✅
- Funnel (earlier): form → `/r/{token}`, gold email, Stripe CTA, SGD 250.
- 4-signal: weak answers → Critical band; strong answers → Strong band + Section 2 "well-positioned" (confirmed scoring computes all 4 signals, not collapsed). 3 Supabase columns confirmed on prod.
- S1–S4 honesty (rev 9): real production form submission → row written, `/r/{token}` rendered honest snapshot. Funnel lead-capture restored (RLS policies fixed).

### §0c. COPY/UX POLISH — status (email + reframe SHIPPED; methodology-in-report NEXT)

1. **✅ SHIPPED — `claude/email-copy-pass`** (merged, `fd9537e`): lead-nurture email (`lib/email.ts`) — removed "undiagnosed" (confident zero-score framing), reframed the bottom "Methodology & Limitations" 5-bullet block into one forward-pointing line, thinned hedging. Tested in inbox before promote. Live.

2. **✅ SHIPPED — `claude/reframe-signals`** (merged into `771b0dc`): reframed all 3 self-report signal questions (S2 competitiveStanding, S3 queryCoverage, S4 platformConsistency) into natural language + helper line "Best estimate is fine — your full report measures this precisely." COPY ONLY — scores unchanged (90/60/30/5/0 etc. identical). Updated in lockstep across 6 files: `lib/types.ts`, `lib/scoring.ts`, `lib/buildTeaserReport.ts` (getFailureMode), `Step3Awareness.tsx`, `Step4Coverage.tsx`, AND `app/methodology/page.tsx` (the methodology page renders the option strings in its signal tables — had to align or the form and methodology page would show different wording). New shared zero-option text: "Not sure — I haven't looked into this". [DECISION] "Not sure = 0 penalty" left AS-IS (a fairness fix to a neutral midpoint is deferred — it changes score behaviour, needs strong/weak re-test).

   **⚠️ BACKFILL was required and DONE.** Reframing scored answer strings broke existing leads: 4 of 87 rows had the new 4-signal columns populated with OLD strings. On the free `/r/[token]` recompute path, old strings no longer match the new `===` comparisons → fall through to `:0` → score collapses to ~27/100 (and Section 2 contradicts the band). A one-time backfill `UPDATE` (old→new string per the 13 mappings) was run on prod to convert those 4 rows. Verified the all-strong test lead (id 35190fe0…, token 0040cc7d…) holds new strings + stored 92/Strong.

   **🔑 SHARP EDGE — READ BEFORE CHANGING ANY SCORED ANSWER STRING:** the pre-migration safeguard in `buildReportFromLead` is a **NULL-check, not a validity-check** (`!!(field && field && field)` is true for any non-empty string, including stale ones). So changing any scored option string silently breaks every existing row that stored the old value, on free-report recompute. ANY future answer-string change MUST be paired with a backfill `UPDATE` of existing rows. Safe order is **deploy code FIRST, then backfill** (old strings only break once new code is live); this session the backfill was run slightly before the deploy, creating a brief new-data/old-code window for 4 rows — harmless in the event but do it deploy-first next time. Better long-term fix (deferred): make the safeguard a value-VALIDITY check (recognise the current valid option set) so stale strings fall back to stored score instead of recomputing to 0.

3. **✅ SHIPPED — Methodology-in-report (FULLER version)** (merged into `9b020d1`): a collapsible "How this score is calculated" panel in the report (`/r/[token]`, below score, above table of contents) showing each of the 4 signals, the user's own answer, and its weighted contribution (e.g. 90 × 30% = 27.0), summing to their score. Makes the score look *derived*, not *asserted* (counters "looks AI-generated"). Component = `ScoreBreakdownPanel` in `ReportPage.tsx`; data via new `getScoreBreakdown` in `lib/scoring.ts` + optional `breakdown` field on `ScoreData`. **scoring.ts was refactored to single-source point ladders** (`signal1-4Points` helpers + `SIGNAL_WEIGHTS`) shared by `getVisibilityScore` and `getScoreBreakdown` so they can't drift — `getVisibilityScore` output verified UNCHANGED (all-strong→92, all-weak→14, etc.). Panel renders only when `breakdown` present (absent on pre-migration/stored-score path → panel silently hidden, by design). Plus a contrast pass on the report's faint trust/footer lines (scoringNote, methodology+email links, disclaimer, benchmark, top eyebrow→12px). Pure additive presentation — no backfill, no DB change. NOTE: the panel quotes the user's verbatim answers, which makes the self-report basis MORE visible — honest, and reinforces why Option A (a real measured data point) is still the structural credibility fix.

### §0c — sharp edges (add, rev 9)

- **Supabase access uses the ANON key for BOTH reads and writes** (lib/supabase.ts). Funnel works via a public anon INSERT policy (`with check true`). Functional but not ideal posture — see deferred Fix 2.
- **Deploy previews cannot write to Supabase** (preview env context misconfigured). Smoke-test on production via the REAL form, not curl. Hand-crafted curl crashes the route before the DB and gives false signals.

## 0b. 🔴 THE REAL REMAINING PRIORITIES (post-launch)

1. **One REAL engine run** (still not done) — `PYTHONPATH=src python -m visibility_engine.run --slug X --url Y --email Z` against a test domain to your own inbox. Confirms LLM keys + live output + email delivery work. **Gates taking any paid order** AND is the dependency for #2. Pre-flight: confirm LLM keys (OpenAI/Anthropic/Gemini/Perplexity) + SMTP set (dry-run never needed them).
2. **🔑 CREDIBILITY FIX — add ONE real measurement to the FREE report.** The free 4-signal report is a *self-assessment* (scores the user's own dropdown answers, reflects them back as prose) — it is NOT a measurement, and skeptical buyers will see through it. To prove the tool is real, the free report needs one genuine observed data point the user did NOT supply. Recommended "Option A": on submit, fire ONE real query to one AI engine (e.g. "best [industry] companies?") and show the actual answer with their brand highlighted/absent + the competitors that actually got named. Verifiable, undeniable, makes the paid 200-query report an obvious upgrade. Depends on #1 (same LLM-key plumbing). Build on a fresh branch off main. THIS is the real answer to "is this a fake report generator."
3. Optional product idea: replace/augment with an "enterprise AI engines in use?" CONTEXT question (stored, not scored, honestly framed as not-yet-measured) — lower priority than #1/#2.

### Scoring model — how the number is derived (reference)
Score = round(S1×0.30 + S2×0.30 + S3×0.25 + S4×0.15). Each signal maps a dropdown answer to points. S1 platform presence (accurate=90…not-mentioned=0), S2 competitive displacement (prominent=90…competitors-win=5, not-checked=0), S3 query coverage (most=90…name-only=20, not-tested=0), S4 cross-platform consistency (all=100…one=25, none=0). Theoretical max = 92% (intentional headroom for what only direct measurement confirms). Benchmark = per-industry median from `INDUSTRY_BENCHMARKS` lookup (~30 sectors; B2G/procurement set lower). "X of 10 buyer conversations" = round(score/10) vs round(benchmark/10). All self-reported — not measured (that's what the paid engine + Option A address).

## 1. What this product is

A two-part product across two repos:

- **`visibility_view`** — Next.js app, deploys on **Netlify**. Hosts the free report and the unlock/sales page. This is the customer-facing web app.
- **`ai-visibility-engine`** — Python CLI. Runs live AI-citation tests across ChatGPT / Perplexity / Gemini / Claude and produces a **measured PDF report**, delivered by email.

These two are **not wired together**. The engine delivers by email/Slack; the app reads from Supabase. There is no engine→app data pipeline (this is a known, deferred gap).

## 2. Pricing & offer model (DECIDED — "Option 1, ship this week")

| Tier | Contents | Delivery | Price |
|------|----------|----------|-------|
| Free | Web report, sections 1–4 | View-only at `/r/{token}` (no PDF) | Free |
| Full Report | All 8 sections, **measured** | **PDF by email** (engine run) | **SGD 250** → **SGD 450 on 1 July 2026** |
| Strategic Baseline + Consult | measured baseline + interactive report + strategy call | book a call | SGD 2,500 (one-time) |
| Visibility Engine Retainer | monthly re-measurement / tracking | book a call | SGD 4,500 / month |

- SGD 250 is the **Airspace World 2026 launch rate**, valid **through 30 June 2026**, rising to **SGD 450 on 1 July 2026**.
- Fulfillment of the SGD 250 report is **MANUAL for now**: customer pays via Stripe → you run the engine on their domain → they get the emailed PDF.
- **Stripe Payment Link (SGD 250):** `https://buy.stripe.com/8x2eVeciQf6W5wv6gh8og00`
- **Booking link ($2,500 / $4,500):** `https://lunacal.ai/maxifidigital/`

### Honesty rules (do not violate)
- The unlock page sells "all 8 sections, measured, delivered as a PDF by email within 1 business day." It does **NOT** promise the emailed PDF is pixel-identical to the web V2 design.
- The blurred sample on the unlock page is a **labelled example** ("yours will show your data") using generic Competitor A/B/C — never pass off fixture data as a real customer's.
- In-app, sections 5–8 stay **locked** on `/r/{token}` for real leads. Measured data arrives ONLY via the emailed PDF. Never fabricate measured s5–8 in the app (see `DATA_CONTRACT.md`).

## 3. Repo / branch state (`visibility_view`)

- **`main`** = the V2 funnel, **LIVE in production** (`checkyourvisibility.maxifidigital.com`). Has unlock page, pricing, V2 email, `/r/[token]`, logo, guards, Step5 typography fix.
- **`staging`** = `69d38a4`, now BEHIND main (see §0 note). Was the funnel staging line.
- **`main-backup-4signal`** = `3d57260`, the unreconciled 4-signal line (§10).
- **`claude/stage-3-live-teaser`** = original source of the V2 report renderer + live wiring (now in main).
- **`claude/style-alignment-mockup`** = holds `mockup/full-report-v2.html` (the static V2 design comp — the design source of truth; hand-built, not generated).

### Key files (on staging / stage-3)
- **Report renderer:** `components/report/ReportPage.tsx` — V2 design (gold `#C87A2F`, navy `#152438` / `#091521`, Inter font). Sections `S1Visibility`…`S8ActionQueue`, `LockedSection`, `ScoreCircle`.
- **Report route:** `app/r/[token]/page.tsx` — `getReport()` calls `getLeadByToken` + `buildReportFromLead`. `preview-free` / `preview-paid` tokens render mock fixtures (`data/fixtures/report_mock.ts`).
- **Report builder:** `lib/buildTeaserReport.ts` — `buildTeaserReport`, `buildReportFromLead`, `buildScore`, `buildS1..S4`. s5–8 set to `null` (locked) for real leads.
- **Supabase:** `lib/supabase.ts` — `insertLead(formData, plan, extras)`, `getLeadByToken(token)`. Token = `report_token` column.
- **Report type:** `lib/reportTypes.ts` — `ReportData` (s1–s8).
- **Form:** `components/MultiStepForm.tsx`. Industry field in `components/steps/Step2Context.tsx`.

### Supabase migration — DONE
Columns added to `aeo_leads`: `report_token` (text, unique index), `report_data` (jsonb), `paid` (bool default false), `stripe_session_id` (text), `status` (text default 'teaser_sent'), `founding` (bool default false).

## 4. Done so far ✅
- Supabase migration applied (+ unique index on `report_token`).
- Netlify env vars set (price + base URL). **Set `REPORT_PRICE` explicitly** to avoid old `$249` vs `SGD $2,500` fallback mismatch.
- `claude/stage-3-live-teaser` merged to `staging`; smoke-tested on `staging--visibilityview.netlify.app` (free + preview-paid + preview-free all render V2 design correctly).
- Branch deploys enabled on Netlify (staging builds).
- Stripe Payment Link created.
- Security check: committed git history is CLEAN. Real keys had only ever appeared in a **local stash (now dropped)**, never committed. The committed `.env.local.example` holds only short placeholder strings. **No key rotation needed.**
- Unlock page design approved (artifact built; gold/navy V2 match, Inter, opportunity-led hook "Become the brand AI recommends", labelled blurred sample, SGD 250/450 with 1-July note, guarantee = within 1 business day + 7-day refund, Tested/Measured/Honest trust strip, FAQ, $2,500/$4,500 book-a-call tiers).

## 5. TODO (resume here) ⬜

### DONE on `staging` (all merged to origin/staging = 69d38a4) ✅
- Unlock page BUILT at `app/report/unlock/page.tsx` (token-aware, personalized hero from `report_data`, V2 design, SGD 250 via `pricing.ts`, CTA → Stripe, tiers → calendly).
- `lib/pricing.ts` (`getReportPrice()` SGD 250→450 on 1 Jul + `STRIPE_LINK`/`CALENDLY_LINK`). Price fallbacks fixed.
- Empty-field guards (hero separator, footer website trim, URL validation).
- Free report = view-only. Report CTAs → `/report/unlock?token=…` → Stripe.
- `SiteHeader` suppressed on `/r/*` and `/report/*`. `.gitignore` python; stray `src/visibility_engine/*.py` removed.
- Unlock page logo = `public/maxifi-logo-white.png` in header+footer, matching `/r/[token]`.
- **Email V2 brand fix DONE** (`lib/email.ts`): purple→gold/navy, AA-contrast fixed (gold-hover `#A8651E` for text-on-light, navy `#091521` for text-on-gold), Inter added. See §9.
- Track B fulfillment PDF: format CONFIRMED sellable (Chrome print-to-PDF of engine HTML works, all sections render). ⚠️ but only tested with `--dry-run` (zeros/placeholders) — see §5-open #2.

### STILL OPEN ⬜
1. **One REAL engine run** (not dry-run) for a test domain — confirm real data populates (not zeros) + email delivery works, BEFORE taking any paid order. This is the top open item now that the funnel is live. Pre-flight: confirm LLM keys (OpenAI/Anthropic/Gemini/Perplexity) + SMTP are set (dry-run never needed them, so they may be unset locally). Run: `PYTHONPATH=src python -m visibility_engine.run --slug <slug> --url <url> --email <you>`.
2. **🔴 RECONCILE the 4-signal line into the live product** — the big deferred task. See §10. Requires a product decision on scoring architecture (4-signal vs report_data vs combine). The funnel is live WITHOUT the 4-signal scoring, methodology page, and `/api/feedback` — those are safe on `main-backup-4signal` and must be folded in deliberately (NOT ad-hoc merged).
3. Marketing site content pass (`maxifi-digital`) — the site already links to the prod app via CTAs (no code merge needed), but its copy still describes an old model ("5 engines"/"24 hours"/3-stage Snapshot→Report→Monitor) and omits SGD 250/450 pricing. Reconcile copy with the actual product when convenient (not blocking).

### DONE since rev 3 ✅
- Funnel promoted `staging` → `main` (clean merge, no conflicts, build green) → **LIVE in production**.
- Production smoke test PASSED (see §0).
- Step5 typography aligned to canonical form steps (h1 `text-2xl`, eyebrows 0.14em, `py-3`, submit `font-semibold`, helper/email-confirm `text-xs`) — merged to main, live.

### Production right now
`main` = the V2 funnel, **LIVE** at `checkyourvisibility.maxifidigital.com`, smoke-tested and working. Selling at SGD 250 is possible as soon as the one real engine run confirms fulfillment.

## 6. Engine (`ai-visibility-engine`) — how to run & known issues
- **No `pyproject.toml`/`setup.py`** — `pip install -e .` fails. Run with `PYTHONPATH=src` prefix.
- **Run a full measured report (uses API, costs money, emails PDF):**
  `PYTHONPATH=src python -m visibility_engine.run --slug <slug> --url https://<their-site> --email <their-email>`
- **Re-render report only from existing data (no API spend):**
  `PYTHONPATH=src python -m visibility_engine.report data/<slug>/<date> --dry-run`
- **WeasyPrint can't render PDF on the Windows laptop** (missing GTK `libgobject-2.0-0.dll`). Fulfillment fallback: engine emits HTML → open in **Chrome → Ctrl+P → Save as PDF** → email manually. (This Windows pain disappears when the engine is later hosted on Linux.)
- **Engine PDF template** `src/visibility_engine/templates/report.html.j2` reskinned toward V2 on branch **`reskin-pdf-v2-design`** (committed there). Colors still drift from exact V2 (navy used `#0E1A26`/`#070E15` instead of `#152438`/`#091521`; gold numbers `#E8A030` instead of `#C87A2F`). **Decided to ship on current colors; revise template later.** Exact V2 tokens are in §3.
- Existing real run data lives at `data/maxifi/2026-05-23/` (useful for template previews).

## 7. Deferred / backlog

### Priority order (added rev 9, 2026-05-28)
1. **Service-role key for server-side writes (Fix 2).** Move /api/generate writes to SUPABASE_SERVICE_ROLE_KEY so the funnel doesn't rely on a public anon INSERT policy. Plan into Option A sprint.
2. **Tighten anon SELECT policy** (currently `using true` — reads any row).
3. **Fix preview Supabase env scoping** in Netlify so previews can exercise the funnel.
4. **benchmarkLabel "average median" doubled noun** — visible on live render. Contract-level fix at buildScore + DATA_CONTRACT.md.
5. **Original 502 Anthropic cause** — Netlify function log req `01KSPWWW7Y0VVFJFT1JB03JN08` (key/quota?). Relevant if Option A re-enables a Claude call.
6. **email.ts L199** snapshot→Full Report paragraph restructure.
7. **Resend failure observability** (silent console.error only).
8. **Dead `/results/[id]` route** — legacy duplicate; form fallback points at it.
9. **S8 internal identifiers** (reportTypes.ts, DATA_CONTRACT.md still say "60-Day Action Queue" — internal, out of RESOLVED-6 scope).
10. **INDUSTRY_BENCHMARKS provenance** — document medians before "sector median" framing scales.

### Fast-follow (post-launch, from rev 8)
- Reskin engine PDF template to exact V2 colors (branch `reskin-pdf-v2-design`).
- Build engine→app measured-data wire (engine writes `report_data` s5–8 to Supabase) so the web report and/or a generated PDF show real measured data.
- Build a V2→PDF generator (turn the web `ReportPage` into a PDF) — this is what would let the emailed deliverable match the V2 web design exactly.
- Host the engine (Render/Railway/Fly, Linux) with a public URL + LLM keys + SMTP, so the app can auto-trigger runs on Stripe payment (webhook) instead of manual fulfillment.
- Add `pyproject.toml` to the engine so it installs properly.
- Subscription billing (Stripe subscriptions) for the $4,500/mo retainer.

## Roadmap (unchanged, unblocked)

Free-snapshot honesty = DONE/live. Next:
- **Phase 3** engine gaps for PAID S5–S8: (1) citation URL extraction, (2) descriptor extraction, (3) competitor seed. Schema crawl deferred.
- **Phase 4** rewrite paid S5–S8 builders against real engine output (SECTIONS_SPEC.md).
- **Option A sprint**: deploy FastAPI engine (server.py) to a host w/ keys + rate limit + cost cap; add `/probe-one`; wire free path to call on submit; replace static S1 with real verbatim-response proof; ride along the service-role write migration.

Engine baseline (maxifi-test 2026-05-27): 4 engines clean, named rates 12–14%, citation rates PPLX 72% / Claude 8% / OpenAI 2% / Google 0%. OpenAI 403 fixed. Engine SMTP still broken (placeholder host) — separate workstream.

## 8. Environment / housekeeping notes
- Keep real secrets ONLY in `.env.local` (gitignored) or Netlify env — never in `.env.local.example`.
- The `claude-mem` Claude Code plugin throws harmless `zod/v3` stop-hook errors after each turn — ignore (or disable the plugin).
- When building in Claude Code: always run on a branch, gate on `tsc --noEmit` + `npm run build`, review diff, then push. Never push to `main` directly; promote via staging.
- Watch the 3 co-touched files for merge conflicts: `app/api/generate/route.ts`, `lib/supabase.ts`, `app/r/[token]/page.tsx`.

## 9. Email alignment (browser → email → payment must be seamless)

There are THREE emails in the system, in two repos — keep this straight:
- **`lib/email.ts` → `sendUserPlanEmail`** (app, Resend) — the FREE/teaser email sent on form submit; links to the web report `/r/{token}`. **This is the one to align.**
- **`app/api/share-snapshot/route.ts`** (app, Resend) — a separate "share" email; verify if it's in the live flow, then align its colors too.
- **Engine `deliver.py`** (Python repo) — emails the PAID SGD 250 measured PDF. Uses the engine's own (deferred) styling. Known gap, accepted for launch.

### Colors — MUST FIX before main (currently OFF-brand)
`lib/email.ts` uses a PURPLE accent system that is NOT V2 brand:
- `#6B5DD3` (×4: eyebrow text + CTA block bg) → replace with gold `#C87A2F`
- `#ede9fe`, `#ddd6fe`, `#c4b5fd` (purple tints) → replace with gold-pale `#FDF1E6` / gold family
- CTA block: white text on gold #C87A2F — verify contrast; if weak, navy `#091521` text on gold.
- Font: change system-only stack → `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (note: email clients may fall back to system fonts regardless — declaration just needs to match V2).
- Grays already match V2 (`#111827 #374151 #6b7280 #9ca3af #e5e7eb #f3f4f6 #f9fafb`). Logo: `maxifi-logo-black.png` on light email bg is CORRECT (keep).

### Logic — ALIGNED by shared data, NOT by shared render (by design)
- Email and web report **both read the same source**: stored `report_data` (score/band/benchmark/diagnosis) + `lib/scoring.ts` helpers. So the NUMBERS a customer sees in the email match the web report. ✅ (Email comment line ~44 states this intent explicitly.)
- BUT: the email does **NOT** call `buildReportFromLead`. It composes its OWN concise summary prose (`benchmarkLine`, `buyerConvLine`, subject) from those shared numbers. This is correct — an email should be a summary, not the full 8-section report. Do NOT try to make the email render the full report.
- **Drift risk:** because the email's prose is authored separately, if you change scoring/section logic in `buildTeaserReport.ts` or `scoring.ts`, the email won't auto-follow its wording. **Rule: when you change report scoring or section logic, check `lib/email.ts` too.**
- **Fallback seam:** if `report_data` is null (old leads), email live-computes via `scoring.ts` (`?? getVisibilityScore(...)`). New leads always have stored `report_data`, so this rarely triggers; both paths use `scoring.ts` so they should agree.

### Handover summary
- FREE path: web report → teaser email → unlock page → Stripe. Gold/navy/V2-consistent and same data. ✅ (email fix DONE on staging)
- PAID path: Stripe → manual engine run → engine emails measured PDF (engine styling, deferred). The ONE accepted brand exception at launch (engine PDF reskin is the post-launch fast-follow, branch `reskin-pdf-v2-design`).
- NOTE: the email alignment above is on the `staging` line. It must survive the §10 reconciliation.

## 10. 🔴 RECONCILIATION — fold the 4-signal line into the LIVE product (deliberately)

The funnel is already live in production (§0). What remains is folding `main-backup-4signal`'s work INTO the live product without breaking it. Do NOT pull/merge ad-hoc (that caused the earlier incident). Plan it.

### The core product decision (MAKE THIS FIRST — everything follows)
Two scoring architectures, built in parallel:
- **4-signal (on `main-backup-4signal`):** score computed from 4 INDEPENDENT user-answered form questions (`competitive_standing`, `query_coverage`, `platform_consistency`, + awareness). `getVisibilityScore()` takes 4 args. Truth = what the user told us. **Needs Supabase cols** `competitive_standing`, `query_coverage`, `platform_consistency` on `aeo_leads`.
- **report_data (on `staging`):** score Claude-generates into a stored `ReportData` blob; email/report read `reportData.score.score`. Truth = model-derived, engine-validated for paid.
- **Recommended combine (reconciliation #1):** 4-signal form on the way IN → seeds the `ReportData` that staging persists. Keep both. This is REAL integration work, not a merge.
- Also diverged: competitor parsing in `lib/scoring.ts` — main treats "Salesforce & HubSpot" as ONE entity (`split /[,;\n]+/`); staging splits on `&`/`and` into TWO. Pick one intent.

### Unique-to-each (must not be lost)
- Only on `main-backup-4signal`: 4-signal scoring (`2b02165`), citation-status integration (`763e248`), `app/methodology/page.tsx`, `app/api/feedback/route.ts` (needs `MAXIFI_NOTIFY_EMAIL` + Resend env), assorted audit fixes (`5febe71`), cosmetic/copy commits (`24b0519` image aspect fix, `8a33d74`, `b68d47a`, `abb01b7`, `de3b7de`).
- Only on `staging`: unlock page, `pricing.ts`, V2 brand email, `/r/[token]` + `ReportPage` + `reportTypes` + `report_mock`, logo, guards, `report_token`/`report_data`/`paid` Supabase cols + migration (already run on the Supabase project).

### Suggested approach
1. Decide scoring architecture (above).
2. New branch off **`main`** (it now has the live funnel — the newest, in-production work). NOT staging (staging is behind main now).
3. Cherry-pick the SAFE/cosmetic commits from `main-backup-4signal` first (`24b0519`, `8a33d74`, `b68d47a`, `abb01b7`, `de3b7de`) — low conflict.
4. Then integrate the load-bearing pieces deliberately, file by file, resolving the scoring clash per the decision: `lib/scoring.ts`, `app/api/generate/route.ts`, `components/MultiStepForm.tsx`, `lib/email.ts`, `lib/supabase.ts`, the Step3/Step4 form components.
5. Bring over `methodology/page.tsx` and `api/feedback/route.ts` (set its env var).
6. **Supabase:** the funnel's columns are already on prod (`report_token`/`report_data`/`paid`/`status`/`founding`). Before deploying the 4-signal work, ADD its columns too (`competitive_standing`/`query_coverage`/`platform_consistency`) — the 4-signal form inserts the latter; missing cols = failed inserts (this was part of the incident).
7. tsc + build gate → test on a branch deploy or staging (sync staging to main first) → smoke-test the FULL combined flow → only then promote to `main` (which is now live, so gate carefully).

### Recovery facts (in case needed)
- All work preserved: `main-backup-4signal`=`3d57260` (9 commits, unreconciled), `staging`=`69d38a4` (funnel staging line, now behind main), `main`=the live funnel + Step5 fix. No force-pushes were ever used.
- Rollback of the live funnel, if ever needed: `git revert -m 1 <funnel-merge-sha>` on main (the funnel merge into main). But it's smoke-tested and working — no reason to.
