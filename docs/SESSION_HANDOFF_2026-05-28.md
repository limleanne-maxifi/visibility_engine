# SESSION HANDOFF — 2026-05-28

> For a fresh Claude session picking up this work. Read this first, then PROJECT_STATE and CLAUDE.md.
> Repo: `C:\Users\LA Lim\visibility_view` (Next.js, deploys to production from `main` → checkyourvisibility.maxifidigital.com)
> Engine repo: `C:\Users\LA Lim\ai-visibility-engine` (Python CLI + FastAPI server.py, NOT deployed anywhere — laptop-only)

---

## What this session set out to do
Reconfigure the report's locked sections S5–S8 so they trace to real engine output instead of fabricated/consulting prose.

## What it actually became
A full free-report (S1–S4) honesty overhaul, plus the discovery and fix of FOUR pre-existing production bugs — culminating in restoring a production funnel that was silently capturing ZERO leads.

---

## SHIPPED & VERIFIED LIVE ON PRODUCTION

Branch `feat/s1-s4-honesty` (5 commits) merged to `main` as `b112bd8`, deployed, and verified by a real production form submission that wrote a row AND rendered an honest `/r/{token}` snapshot.

Commits on the branch:
- `7bb52a1` — S1–S4 honesty audit + AIO/Copilot reconciliation
- `998320a` — fix: snapshot vs report terminology
- `d0bf046` — copy: form steps + mockup promise the snapshot, not an action plan
- `38bc71c` — feat: gate the Claude action-plan call (Option γ)
- `85b3022` — fix: API response reportToken empty + reportUrl double-slash

Honesty changes now live:
- **S1** reduced to honest static placeholder ("…They are not measured. The Full Report runs 50 buyer-intent queries × 4 engines…"). Option A (real single-query proof) deferred to its own sprint. Sections NOT renumbered — S1 slot reserved for Option A.
- **S2** keeps failure-mode classification (getFailureMode), removed user-supplied competitor names, relabeled "root causes" → "patterns that typically drive this failure mode", removed Copilot bullet.
- **S3** all 6 platforms shown; ChatGPT/Claude/Gemini/Perplexity measured; **Google AI Overviews + Microsoft Copilot render in a "Not measured — Retainer (SGD 4,500/mo)" state** (NOT 0%/blank). Verified rendering correctly.
- **S4** removed "31 firms" cohort + leader marker; "sector reference median" framing.
- **Paywall/TOC** new titles: S5 "Who AI mentions when you're not named", S6 "How AI describes you", S7 "Query coverage", S8 "Sentiment, rank & citation health". 60-day action plan MOVED to SGD 2,500 tier.
- **Terminology rule** applied throughout: free = "snapshot", paid SGD 250 = "report"/"Full Report". Recorded as CLAUDE.md RESOLVED-6.
- **Option γ**: Claude action-plan API call gated off behind `DISABLE_CLAUDE_ACTION_PLAN = true` in `app/api/generate/route.ts`. Response shape unchanged (`plan: {steps:[], quickWin:''}`). Plumbing (buildPrompt.ts, parsePlan.ts, plan columns, ActionQueueSection type) left intact for the Option A sprint.

## PRODUCTION BUGS FOUND & FIXED THIS SESSION (all pre-existing, none caused by the branch)
1. **502 outage** — main had an un-gated Claude action-plan call that was failing on every submit → 502 on every signup. Fixed by merging Option γ (gate).
2. **Empty reportToken** — API returned `reportToken: ""` (a catch-block failure-signal), sending the client to the dead `/results/{id}` fallback → 404. Fixed in `85b3022`.
3. **Double-slash reportUrl** — base URL + `/r/` = `//r/`. Fixed in `85b3022`.
4. **Silent write failure (THE BIG ONE)** — `aeo_leads` had RLS enabled but the INSERT policy was bound to NO roles (`applied_to = {}`) and there was NO SELECT policy. Every insert AND read silently failed. The funnel captured zero leads. **Fixed via SQL on production Supabase:**
   ```sql
   drop policy if exists "Allow inserts" on public.aeo_leads;
   create policy "anon insert leads" on public.aeo_leads for insert to anon with check (true);
   create policy "anon read leads by token" on public.aeo_leads for select to anon using (true);
   ```
   Verified: both policies now show `{anon}`, a real form submit writes a row, and `/r/{token}` renders.

---

## CRITICAL CONTEXT FOR NEXT SESSION

- **The engine measures 4 engines:** ChatGPT (openai), Claude (anthropic), Gemini (google), Perplexity. Copilot deferred to SGD 4,500/mo retainer. AIO not in engine scope.
- **The app uses the Supabase ANON key for BOTH reads and writes** (`lib/supabase.ts` getClient). No service-role key anywhere. The funnel currently works via a public anon INSERT policy (`with check (true)`) — functional but not the ideal security posture (see backlog Fix 2).
- **Deploy previews can't write to Supabase** — preview env context is missing/misconfigured Supabase vars. This caused a long debugging detour. Smoke-test on PRODUCTION (or fix preview env scoping) — preview is not a faithful test environment.
- **VERIFY THROUGH THE REAL FORM PATH, not curl.** Hand-crafted curl payloads crash the route before the DB (wrong field shape) and produce misleading results. The React form sends correct FormData. Always test via a real incognito form submission → check `aeo_leads` row → open `/r/{token}`.
- **Three spec docs live on branch `docs/sections-spec`** (and should be in project knowledge): SECTIONS_SPEC.md, V2_COPY_DELTA.md, S1-S4_HONESTY_DELTA.md.

---

## BACKLOG (captured, not done — ordered by priority)

1. **Service-role key for server-side writes (Fix 2).** Move `/api/generate` writes to `SUPABASE_SERVICE_ROLE_KEY` (server-only) so the funnel doesn't depend on a public anon INSERT policy. Plan into Option A sprint.
2. **Tighten the anon SELECT policy.** `using (true)` lets anon read any row. Acceptable for token-gated launch; tighten later (or move reads server-side).
3. **Fix preview Supabase env scoping** in Netlify (scope SUPABASE_URL / SUPABASE_ANON_KEY to Deploy Previews) so previews can exercise the funnel.
4. **"average median" doubled-noun label** (benchmarkLabel bug) — visible on live render ("Legal & Legal Services average median"). Contract-level fix: drop "average" from the label at buildScore, update DATA_CONTRACT.md consumers.
5. **Original 502 root cause** — pull Netlify function log for request `01KSPWWW7Y0VVFJFT1JB03JN08` to learn why the Anthropic call was failing (key? quota?). Matters because Option A may re-enable a Claude call.
6. **email.ts L199** paragraph reads snapshot→Full Report across two sentences — accurate but wants a restructure.
7. **Resend failure observability** — sends fail silently (console.error only) in `/api/generate`.
8. **Dead `/results/[id]` route** — legacy duplicate of `/r/[token]`; the form's fallback redirect points at it. Remove or repoint.
9. **S8 internal identifiers** — reportTypes.ts + DATA_CONTRACT.md still call S8 "60-Day Action Queue". Internal-only (not user-facing, out of RESOLVED-6 scope); tidy when engine emits new S8 shape.
10. **INDUSTRY_BENCHMARKS provenance** — confirm medians are documented before "sector median" framing scales.

---

## THE ROADMAP (unchanged, now unblocked)

The free-snapshot honesty work is DONE and live. Remaining:

- **Phase 3 — engine gaps** (for the PAID S5–S8): close 3 gaps in `ai-visibility-engine`:
  - Gap 1: citation URL extraction (highest-value; Perplexity already 72% citation rate)
  - Gap 2: descriptor extraction (how AI describes the brand when named)
  - Gap 3: customer competitor seed (form field + filter open-world entities)
  - Schema/sitemap crawl DEFERRED.
- **Phase 4** — rewrite paid S5–S8 builders in `buildTeaserReport.ts` against real engine output (per SECTIONS_SPEC.md), once gaps close.
- **Option A sprint** — deploy the FastAPI engine (server.py) to a host (Render/Railway/Fly) with API keys as env vars + rate limiting + daily cost cap; add a `/probe-one` route wrapping a single-query call; wire the free path to call it on submit; replace the static S1 with a real verbatim-response proof. The service-role write migration (backlog #1) can ride along.

Engine state: first clean 4-engine baseline run completed (maxifi-test, 2026-05-27): named rates 12–14% across all engines, citation rates Perplexity 72% / Anthropic 8% / OpenAI 2% / Google 0%. OpenAI 403 was fixed (model access enabled on the project). SMTP/email delivery in the engine is still broken (placeholder `smtp.yourprovider.com`) — separate workstream, use Resend or real SMTP.
