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

### RESOLVED-7: Supabase RLS policies on `aeo_leads` (set 2026-05-28)

The `aeo_leads` table has RLS **enabled**. Required policies (both bound to the `anon` role, since the app uses the anon key for reads AND writes via `lib/supabase.ts` `getClient`):

- `anon insert leads` — INSERT, to `anon`, WITH CHECK `(true)`
- `anon read leads by token` — SELECT, to `anon`, USING `(true)`

**Do NOT disable RLS and do NOT leave a policy bound to no roles.** A policy with `applied_to = {}` (empty `polroles` array) applies to nobody and silently fails all operations against it — this exact misconfiguration took the production funnel down on 2026-05-28 (zero leads captured for an unknown window) until fixed. If inserts or `/r/{token}` reads ever fail silently again, **FIRST check `pg_policy.polroles` includes the `anon` role** (not `{}`).

Diagnostic SQL:

```sql
select
  polname  as policy_name,
  case polcmd when 'r' then 'SELECT'
              when 'a' then 'INSERT'
              when 'w' then 'UPDATE'
              when 'd' then 'DELETE'
              when '*' then 'ALL'  end as command,
  polroles as polroles_raw,
  array(select rolname from pg_roles where oid = any(polroles)) as applied_to_named,
  pg_get_expr(polqual,      polrelid) as using_expr,
  pg_get_expr(polwithcheck, polrelid) as with_check_expr
from pg_policy
where polrelid = 'public.aeo_leads'::regclass;
```

(`polroles_raw = '{0}'` means PUBLIC; `'{}'` means nobody; an array containing the anon role's OID means anon.)

**Future-better:** move server-side writes to the `SUPABASE_SERVICE_ROLE_KEY` (RLS bypass for trusted server routes only — never exposed to client). Then the anon INSERT policy can be removed and only the SELECT policy remains. Until that lands (PROJECT_STATE §7 backlog #1), keep both anon policies.

### RESOLVED-8: Test through the real React form path, not hand-crafted curl

Hand-crafted curl payloads to `/api/generate` crash the route **before the DB call** due to field-shape mismatches:

- The route reads `formData.platforms.find(...)` and `formData.challenges.join(...)` — these require **arrays**. A curl that sends `goals` instead of `challenges`, or omits `platforms`, throws `Cannot read properties of undefined` inside `insertLead` before any Supabase call. The try/catch in `/api/generate` then logs a generic "Supabase insert failed" but the actual cause is JS-side.
- The route reads `aiPresence` not `awareness`, `competitiveStanding` not `competitive`, `websiteUrl` not `website`, `company` not `companyName`. Field-name mismatches make the values silently undefined and propagate downstream.
- The 200 API response (with a UUID-shaped `id`, real `reportToken`, empty `plan`) is consistent with **both** a successful write AND a pre-DB crash. The response alone does not prove a row was written.

**To verify the funnel works:** submit the real React form in an incognito tab → check `aeo_leads` for the row → open the returned `/r/{token}`. The form components send correctly-shaped `FormData`.

If curl is necessary (e.g. for deploy-status polling), match the live `FormData` shape exactly — required fields: `firstName`, `email`, `occupation`, `company`, `websiteUrl`, `industry`, `aiPresence`, `competitiveStanding`, `queryCoverage`, `platformConsistency`, `platforms` (array of `{value, priority}`), `challenges` (array), `visibilityGap`, `consent`.

### RESOLVED-9: Deploy previews cannot write to Supabase

Netlify deploy-preview context lacks correctly-scoped Supabase env vars (`SUPABASE_URL` / `SUPABASE_ANON_KEY` are set to Production scope only), so inserts silently fail on preview deploys even when production works. **Smoke-test honesty/render changes on PRODUCTION** (or via a known-good existing token), not on previews. Backlog item (PROJECT_STATE §7 backlog #3): scope `SUPABASE_URL` and `SUPABASE_ANON_KEY` to **Deploy Previews** in Netlify so previews become a faithful test environment.

### RESOLVED-10: S1 is a static placeholder, awaiting Option A

`S1Visibility` in `components/report/ReportPage.tsx` currently renders an honest static callout:

> Where this snapshot stands — The sections below cover what you told us and what that pattern usually means. They are not measured. The Full Report runs 50 buyer-intent queries × 4 engines and shows you the actual responses.

**Do NOT renumber sections** to fill the S1 slot. S1 is reserved for **Option A** (fire one real engine query on submit, render the verbatim AI response — see PROJECT_STATE §0b.2). The `buildS1` builder in `lib/buildTeaserReport.ts` is left intact for forward-compatibility; the renderer currently ignores its output (the section type still flows through `ReportData['s1Visibility']`).

Option A requires deploying the engine (`server.py` in `ai-visibility-engine`) as a hosted service first — it is laptop-only today. The service-role write migration (RESOLVED-7 future-better + PROJECT_STATE §7 backlog #1) can ride along in the same sprint.

### RESOLVED-11: Service-role Supabase client (server-only — bypasses RLS)

`lib/supabase.ts` now exports **two** Supabase clients:

- **`getClient()`** — anon-key client. Used for the form-submit `insertLead` and all `getLeadByToken` / `getLeadById` / `getAllLeads` reads. Bound by RLS (RESOLVED-7).
- **`getServiceRoleClient()`** — service-role client. Uses `SUPABASE_SERVICE_ROLE_KEY`. **Server-only**, bypasses RLS. Singleton, lazy. Currently consumed ONLY by `app/api/stripe-webhook/route.ts` for the lead `UPDATE` path.

The webhook needs `UPDATE` to mark a lead paid + record Stripe session details. Anon RLS only has INSERT + SELECT policies (RESOLVED-7); granting UPDATE to anon would let any browser client mutate any lead row. Service-role bypasses RLS entirely and is safe in a server-only context.

**Security rules — non-negotiable:**
- `SUPABASE_SERVICE_ROLE_KEY` must be Netlify **server-context** only. **Never** prefix with `NEXT_PUBLIC_*`. **Never** scope to Deploy Previews unless explicitly intended.
- Do not import `getServiceRoleClient` from a client component or a `'use client'` file.
- Do not log the key. Do not include it in any API response.
- New server-side write helpers go through `getServiceRoleClient`. New client-callable read helpers stay on `getClient` (anon).

Updates the "future-better" note in RESOLVED-7 — that future is partially here:
- Webhook path: uses service-role ✅ (rev 10)
- Form-submit `insertLead`: still anon. Migration is PROJECT_STATE §7 backlog #2.

Helpers added in rev 10 that use the service-role client: `findLeadByEmail(email)` (most-recent match, returns null if none) and `recordPayment(leadId, payload)` (sets `paid=true`, `status='paid'`, all Stripe-related fields).

### RESOLVED-12: Stripe webhook scope and event handling

`app/api/stripe-webhook/route.ts` is the payment-capture path. **Scope: record paid orders + notify the owner. NO customer-facing report generation, NO customer email** — fulfillment stays manual.

What it does:
- Reads the raw body via `await req.text()` **before any parsing** — required for signature verification.
- Verifies via `stripe.webhooks.constructEvent(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET)`.
- Handles **only** `checkout.session.completed`. All other event types are 200-ack'd and ignored.
- Matches by `session.customer_details.email` to the most recent `aeo_leads` row.
- Records `paid=true`, `status='paid'`, `stripe_session_id`, `paid_amount` (smallest currency unit — Stripe semantics), `paid_currency`, `paid_at` via `recordPayment()`.
- Fires `sendPaidOrderNotification()` in `lib/email.ts` on all paths (matched, no-lead, no-email).

What it does NOT do:
- Generate any customer report or trigger the engine.
- Send any customer-facing email.
- Touch `buildTeaserReport`, `sendUserPlanEmail`, or any other rev-9 path.

HTTP semantics (matter for Stripe's retry behaviour):
- 400 on missing/invalid signature → Stripe stops retrying (signing secret is wrong).
- 200 on success / unhandled event / orphan → Stripe stops retrying (event handled).
- 500 on DB UPDATE failure → Stripe retries for up to 3 days (the payment HAS happened, we just couldn't record it).

Edge cases:
- **No email on session** → owner gets a `[PAID-BUT-NO-LEAD] (no email) — …` alert; no DB write; 200.
- **Email but no matching lead row** → owner gets a `[PAID-BUT-NO-LEAD] {email} — …` alert with reconcile instructions; no DB write; 200.
- **Owner notification (Resend) fails** → swallowed in a wrapper (`safeNotifyOwner`) so Stripe doesn't retry the whole event just because Resend was slow. Logged only.

Required env vars (server-scope, server-only):
- `STRIPE_SECRET_KEY` — to init the Stripe SDK
- `STRIPE_WEBHOOK_SECRET` — for signature verification
- `SUPABASE_SERVICE_ROLE_KEY` — for the lead UPDATE

Required Supabase schema (applied 2026-05-30):
```sql
ALTER TABLE aeo_leads
  ADD COLUMN paid_amount   bigint,
  ADD COLUMN paid_currency text,
  ADD COLUMN paid_at       timestamptz;
```

**Not yet idempotency-protected.** The DB effect is idempotent (UPDATE to the same state is a no-op) but the owner email fires on every Stripe retry. See PROJECT_STATE §7 backlog #6 for the planned `stripe_session_id` already-present check.

### RESOLVED-13: USD-primary pricing display rule

All displayed prices are **USD primary, SGD secondary** (static parenthetical subtext). No geo/locale detection — same string shown to every visitor.

Mapping (round numbers, not literal FX):

| Tier | Display | Source |
|---|---|---|
| Full Report launch | `USD $190` (with struck-through `USD $340` on the launch block) | `PRICE_LAUNCH` in `lib/pricing.ts` |
| Full Report standard (post-1 July 2026) | `USD $340` | `PRICE_STANDARD` |
| Strategic Baseline + Consult | `USD 1,900 (SGD 2,500)` | hardcoded |
| Visibility Engine Retainer | `USD 3,400/mo (SGD 4,500/mo)` | hardcoded |

`lib/pricing.ts` constants:
- `PRICE_LAUNCH = 'USD $190'`
- `PRICE_STANDARD = 'USD $340'`
- `PRICE_LAUNCH_SGD = 'SGD $250'` (secondary, available for future SG-locale rendering)
- `PRICE_STANDARD_SGD = 'SGD $450'` (secondary)
- Date-switch at 1 July 2026 00:00 SGT (`LAUNCH_RATE_CUTOFF_MS`) is **untouched** — still flips `PRICE_LAUNCH` → `PRICE_STANDARD`.

**Rules:**
- The **Full Report price** propagates automatically via `getReportPrice()` → `data.reportPrice` → `<PaywallBlock>` + `<LockedSection>` + unlock page. **Do not hardcode the Full Report price anywhere** — change `lib/pricing.ts` and surfaces follow.
- The Strategic Baseline + Retainer prices are still hardcoded (no central constant). When you touch one, touch all four sites (unlock page tier card, paywall block link, ReportPage S3 not-measured row label, unlock page sample S5).
- **Stripe Payment Link price must match the displayed Full Report price.** Currently both `USD 190`. If you change `PRICE_LAUNCH`/`PRICE_STANDARD`, update the Stripe Payment Link in Stripe Dashboard too.

Internal-doc SGD references in `CLAUDE.md` / `PROJECT_STATE.md` (tier identifiers like "the SGD 250 Full Report") are NOT user-facing and don't need to follow the display rule. Customer-visible strings do.

Backlog (PROJECT_STATE §7 #5): geo/locale detection — show SGD-primary to Singapore visitors, USD to the rest. Deferred — non-blocking.

### RESOLVED-14: Resend sending domain — verified subdomain `send.maxifidigital.com`

The Resend sending domain in production is the **subdomain** `send.maxifidigital.com`, not the apex `maxifidigital.com`. Apex MX records belong to inbound mail (the existing email hosting) and **must not be touched** — pointing apex MX to Resend would break inbound mail delivery for the team.

Subdomain isolation is intentional:
- Resend DNS records (SPF / DKIM / Return-Path) are scoped to the `send` subdomain only.
- Apex MX, A, TXT records are untouched.
- Inbound mail to `*@maxifidigital.com` continues to flow through existing hosting.
- Outbound transactional mail flows via Resend from `*@send.maxifidigital.com`.

Production env:
- `FROM_EMAIL=notifications@send.maxifidigital.com` (Netlify, server-scope)
- Fallback `hello@maxifidigital.com` still in code if env unset, but the env value is what production uses.

**Do not change `FROM_EMAIL` to an apex address** unless apex DNS has also been configured for Resend — Resend will reject sends from unverified domains.
