# SESSION HANDOFF — 2026-05-30

> For a fresh Claude session picking up this work. Read this first, then PROJECT_STATE rev 10 and CLAUDE.md (now RESOLVED-1..14).
> Repo: `C:\Users\LA Lim\visibility_view` (Next.js, deploys to production from `main` → checkyourvisibility.maxifidigital.com)
> Engine repo: `C:\Users\LA Lim\ai-visibility-engine` (Python CLI + FastAPI `server.py`, NOT deployed anywhere — laptop-only)

---

## What this session set out to do
Capture paid orders. The Stripe Payment Link existed but no webhook was wired — production took money without an audit trail or owner notification.

## What it actually became
The Stripe webhook + supporting infra, plus two product changes that landed alongside it: USD-primary pricing display, and a fix for an empty-positioning rendering bug surfaced in production.

---

## SHIPPED & VERIFIED LIVE ON PRODUCTION

`main = 547d9ef` (was `b112bd8` at end of rev 9). Three branches merged via GitHub PRs this session:

| Branch (merged) | Source SHA | Merge SHA | Subject |
|---|---|---|---|
| `fix/positioning-missing-label` | `3047656` | `feee907` | S4 positioning empty-state fix + softened observation |
| `pricing/usd-primary` | `83cc02b` | `2f843db` | USD-primary pricing with SGD secondary |
| `feat/stripe-webhook` | `ea05c9f` | `547d9ef` | Stripe webhook records paid orders + notifies owner |

### 1. Stripe webhook (payment-capture gap CLOSED)
- New route `app/api/stripe-webhook/route.ts` — POST, Node runtime, `force-dynamic`.
- Raw-body signature verification via `stripe.webhooks.constructEvent(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET)`. Missing/invalid signature → 400; verified → continue.
- Handles `checkout.session.completed` only; other event types ack 200.
- Extracts `session.customer_details.email`, `amount_total`, `currency`, `session.id`, `payment_intent`.
- Matches the customer email to the most recent `aeo_leads` row via `findLeadByEmail()` (service-role client). Writes `paid=true`, `status='paid'`, `stripe_session_id`, `paid_amount` (smallest currency unit), `paid_currency`, `paid_at` via `recordPayment()`.
- Owner notification via new `sendPaidOrderNotification()` in `lib/email.ts`. Fires on matched, no-lead, AND no-email paths. Notification failure is swallowed (logged only) so Stripe doesn't retry the whole flow.
- HTTP semantics: 400 on signature fail (no retry), 200 on success / non-target event / orphan, 500 on DB update failure (Stripe retries for up to 3 days).
- **Endpoint registered in Stripe** for `checkout.session.completed`. Stripe-test-event returns 200. **Real-payment end-to-end test still owed** — see backlog.

### 2. Service-role Supabase client introduced
- `getServiceRoleClient()` in `lib/supabase.ts` — uses `SUPABASE_SERVICE_ROLE_KEY` (Netlify server-scope only). Singleton, lazy.
- Bypasses RLS — required for UPDATE because anon RLS on `aeo_leads` has only INSERT + SELECT policies (RESOLVED-7). Granting UPDATE to anon would let any browser client mutate any lead row.
- **Currently used ONLY by the Stripe webhook.** `insertLead()` in `/api/generate` still uses the anon client. Migrating that to service-role is rev-10 §7 backlog #2.
- Two helpers built on the service-role client: `findLeadByEmail(email)` (most-recent match, returns null if none) and `recordPayment(leadId, payload)`.
- See CLAUDE.md RESOLVED-11.

### 3. USD-primary pricing display
- `lib/pricing.ts`: `PRICE_LAUNCH='USD $190'`, `PRICE_STANDARD='USD $340'` (was `'SGD $250'` / `'SGD $450'`). Added `PRICE_LAUNCH_SGD='SGD $250'` and `PRICE_STANDARD_SGD='SGD $450'` secondary constants.
- Date-switch logic at 1 July 2026 00:00 SGT is **untouched** — still flips PRICE_LAUNCH → PRICE_STANDARD at the cutover.
- Surfaces updated:
  - Unlock page `/report/unlock` — Strategic Baseline tier shows `USD 1,900 (SGD 2,500)`, Retainer `USD 3,400 (SGD 4,500)`.
  - ReportPage paywall block — Strategic Baseline link `USD $1,900 (SGD $2,500)`, Retainer link `USD $3,400/mo (SGD $4,500/mo)`.
  - S3 not-measured row label — `Visibility Engine Retainer (USD 3,400/mo, SGD 4,500/mo)`.
  - Full Report price element (renders `getReportPrice()` = `USD $190` or `USD $340`) — USD-only, no SGD subtext.
- **Stripe Payment Link price updated to USD 190** so the displayed price matches the charged price.
- No geo/locale detection this pass — same string shown to every visitor. Backlog: show SGD-primary to SG visitors (rev-10 §7 #5).
- See CLAUDE.md RESOLVED-13.

### 4. S4 positioning empty-state fix
- `assessAlignmentLevel` missing-branch label rewritten: *"No positioning provided. Add it to sharpen positioning analysis and competitor framing in the Full Report."* (was *"No positioning statement provided — cannot assess alignment"* — read as a failure instead of a finding).
- `S4Positioning` in `ReportPage.tsx`: "Your stated positioning" header + quoted value are now gated on `alignmentLevel !== 'missing'`. Fixes the orphan `"(no positioning phrase provided)"` placeholder bug that was rendering on live production for leads that submitted without a positioning statement.
- `buildS4` second observation softened: removed alarmist `${entity} is competing against all vendors in ${formData.industry}` → *"AI has no distinct claim to associate with you — so it groups you with every vendor in your sector."* (Drops both interpolated values; second-person voice matches surrounding observations.)
- Verified live on production after deploy.

### 5. Email infra (rev-10 changes)
- New `sendPaidOrderNotification()` in `lib/email.ts` — owner-only paid-order notification, separate from `sendInternalNotification`. Different subject (`New paid order — {email} — {amount}` or `[PAID-BUT-NO-LEAD] {email} — {amount}`) + body shape (payment block + lead context + fulfillment reminder).
- `sendInternalNotification` (form-submit owner alert) is **untouched** — existing live path stays bullet-proof.
- **Resend sending domain `send.maxifidigital.com` VERIFIED.** Subdomain — avoided clobbering apex MX records. `FROM_EMAIL=notifications@send.maxifidigital.com` in Netlify env. Fallback `hello@maxifidigital.com` still in code if env unset.
- See CLAUDE.md RESOLVED-14.

### 6. Supabase schema migration
Applied to production Supabase 2026-05-30:
```sql
ALTER TABLE aeo_leads
  ADD COLUMN paid_amount   bigint,
  ADD COLUMN paid_currency text,
  ADD COLUMN paid_at       timestamptz;
```
All three nullable; old rows = NULL. `AeoLeadRow` type extended.

### 7. Netlify env vars added (server-scope only — NOT `NEXT_PUBLIC_*`)
- `STRIPE_SECRET_KEY` — for `stripe.webhooks.constructEvent`
- `STRIPE_WEBHOOK_SECRET` — paste from Stripe Dashboard → Webhooks → endpoint signing secret
- `SUPABASE_SERVICE_ROLE_KEY` — for the service-role client (RLS bypass for the webhook UPDATE)
- `FROM_EMAIL=notifications@send.maxifidigital.com`
- `MAXIFI_NOTIFY_EMAIL` (was already set; the webhook reuses it)

---

## CRITICAL CONTEXT FOR NEXT SESSION

- **Two Supabase clients in `lib/supabase.ts` now.** `getClient()` = anon (form INSERT + all SELECT). `getServiceRoleClient()` = service-role, server-only (Stripe webhook UPDATE). NEVER import `getServiceRoleClient` from a client component or expose the key to the browser. Add new helpers under the appropriate client based on the security need.
- **The Stripe webhook ONLY records the payment + notifies the owner.** It does NOT generate any customer report. Fulfillment stays manual: owner runs the engine and emails the PDF within 1 business day.
- **Webhook is not yet idempotency-protected.** Stripe retries on non-2xx; the DB UPDATE is idempotent but the owner email fires on every retry. Add a `stripe_session_id` already-present check before updating + notifying — see backlog #6.
- **Pricing display is USD-primary for everyone right now**; geo/locale detection is backlog. The displayed price must match the Stripe Payment Link charge — both are USD 190 currently.
- **Real-payment end-to-end test has NOT been run.** The Stripe-test-event-from-Dashboard returned 200, but no actual money has flowed through the webhook yet. Do this before opening the funnel to a wider audience.
- **Resend domain is the subdomain `send.maxifidigital.com`**, not the apex. Apex MX is for inbound mail; changing it would have broken existing email delivery. Subdomain isolation is intentional.

---

## BACKLOG (carried over from rev 9 + new this session — see PROJECT_STATE rev 10 §7 for the canonical list)

1. **Real-payment end-to-end Stripe test** (new this session — gates broader rollout)
2. **Migrate `/api/generate` insertLead to service-role** (was rev-9 #1; promoted now that the infra exists)
3. **Tighten anon SELECT policy** (rev-9 #2)
4. **Drop anon INSERT/UPDATE policies on `aeo_leads`** once #2 lands (new this session)
5. **Geo/locale detection for SGD pricing** (new this session)
6. **Webhook idempotency / replay protection** (new this session)
7. Fix preview Supabase env scoping
8. benchmarkLabel "average median" doubled noun
9. Original 502 Anthropic cause
10. email.ts L199 paragraph restructure
11. Resend failure observability
12. Dead /results/[id] route
13. S8 internal identifiers
14. INDUSTRY_BENCHMARKS provenance

---

## THE ROADMAP (rev 10)

Free-snapshot honesty = DONE. Funnel writes + reads = restored. **Payment-capture gap = CLOSED.** Next structural milestones:

- **Real-payment smoke test** before scaling beyond Airspace World audience. Confirm row update + owner email + Netlify log cleanliness in ONE real-money flow.
- **Phase 3 — engine gaps** (for the PAID S5–S8): close 3 gaps in `ai-visibility-engine`:
  - Gap 1: citation URL extraction
  - Gap 2: descriptor extraction
  - Gap 3: customer competitor seed
  - Schema/sitemap crawl DEFERRED.
- **Phase 4** — rewrite paid S5–S8 builders in `buildTeaserReport.ts` against real engine output (per SECTIONS_SPEC.md), once gaps close.
- **Option A sprint** — deploy the FastAPI engine (`server.py`) to a host with API keys, rate limiting, daily cost cap; add a `/probe-one` route; wire the free path to call it on submit; replace the static S1 with a real verbatim-response proof. The `insertLead` → service-role migration (backlog #2) can ride along.

The webhook in this rev means the funnel can now take real money cleanly — but fulfillment is still manual until the engine is hosted. That hosting is the Option A precondition AND the path to auto-fulfillment.
