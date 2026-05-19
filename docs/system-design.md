# System Design — AI Visibility Snapshot (v2)
**Based on:** `docs/strategy-report-audit.md`  
**Date:** 19 May 2026

## Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | Already in use; SSR for report pages, API routes for backend |
| Database | Supabase (Postgres) | Already in use; adds RLS, realtime, and storage |
| Email | Resend | Already in use; transactional delivery + delivery webhooks |
| Payments / unlock | Stripe | Checkout Sessions for report unlock; webhooks for `unlock_events` |
| Hosting | Netlify | Already deployed; edge functions for rate limiting |
| AI | Anthropic claude-sonnet-4-6 | Already in use; increase `max_tokens` to 4096 |
| Auth | Supabase Auth (magic link) | Email-verified session tied to lead record; no passwords |

---

## 1. Report Generator Service

### Responsibility
Replaces `app/api/generate/route.ts`. Accepts validated snapshot input and produces a structured `ReportJSON` object with one typed section per report section. Each section is independently generated and stored; sections 1–4 are produced on first call, sections 5–8 are produced only after unlock.

### Section schema

```typescript
type SectionId =
  | 'citation_snapshot'        // free  (section 1)
  | 'failure_mode_diagnosis'   // free  (section 2)
  | 'platform_visibility'      // free  (section 3)
  | 'benchmark_comparison'     // free  (section 4)
  | 'competitor_displacement'  // locked (section 5)
  | 'positioning_gap'          // locked (section 6)
  | 'query_gap'                // locked (section 7)
  | 'action_queue'             // locked (section 8)

interface ReportSection {
  id: SectionId;
  version: number;                // increments on regeneration
  generated_at: string;           // ISO timestamp
  inputs_hash: string;            // SHA-256 of inputs used, for cache key
  data: CitationSnapshotData
       | FailureModeData
       | PlatformVisibilityData
       | BenchmarkData
       | CompetitorDisplacementData
       | PositioningGapData
       | QueryGapData
       | ActionQueueData;
  confidence: 'computed' | 'ai_generated' | 'placeholder';
  warnings: string[];             // flags non-ideal inputs (e.g. no website, no queries)
}
```

### Section data schemas

```typescript
// Section 1 — Citation Snapshot
interface CitationSnapshotData {
  platforms: Array<{
    name: string;
    status: 'cited' | 'displaced' | 'missing' | 'inaccurate' | 'stale' | 'unknown';
    search_url: string;
    badge_label: string;
  }>;
  query_used: string;
  query_is_generic: boolean;
  tested_date: string;
}

// Section 2 — Failure Mode Diagnosis
interface FailureModeData {
  opportunity_headline: string;
  opportunity_body: string;
  root_causes: Array<{ rank: number; cause: string; fix_category: string }>;
  primary_failure_mode: 'not_structured' | 'low_authority' | 'displaced' | 'inaccurate' | 'stale' | 'untested';
}

// Section 3 — Platform Visibility
interface PlatformVisibilityData {
  platforms: Array<{
    name: string;
    status: 'cited' | 'displaced' | 'missing' | 'inaccurate' | 'stale' | 'unknown';
    notes: string | null;
  }>;
  checked_count: number;
  unchecked_platforms: string[];
}

// Section 4 — Benchmark Comparison
interface BenchmarkData {
  score: number;                  // 0–100, computed
  benchmark: number;              // industry median
  industry: string;
  gap: number;                    // benchmark - score
  buyer_x: number;                // "X in 10" for brand
  buyer_y: number;                // "Y in 10" for benchmark
  score_confidence: 'self_reported' | 'undiagnosed';
  benchmark_note: string;         // explicit disclosure of methodology
}

// Section 5 — Competitor Displacement (LOCKED)
interface CompetitorDisplacementData {
  competitors: Array<{
    name: string;
    ai_generated_assessment: string;  // Claude's analysis of why they're ranked ahead
    displacement_likely: boolean;
  }>;
  displacement_summary: string;
  ai_narrative: string;           // full Claude paragraph
}

// Section 6 — Positioning Gap (LOCKED)
interface PositioningGapData {
  gap_summary: string;
  positioning_provided: string | null;
  website_url: string | null;
  content_structure_issues: string[];  // Claude-identified gaps
  recommended_angle: string;
  ai_narrative: string;
}

// Section 7 — Query Gap (LOCKED)
interface QueryGapData {
  queries_provided: string[];
  queries_derived: string[];
  coverage_assessment: string;         // Claude's analysis
  missing_query_types: string[];
  recommended_queries: string[];
  ai_narrative: string;
}

// Section 8 — 60-Day Action Queue (LOCKED)
interface ActionQueueData {
  steps: Array<{
    num: number;
    week: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;  // which week of 60 days
    title: string;
    body: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    section_reference: SectionId;       // which gap this addresses
  }>;
  quick_win: string;
  total_steps: number;
}
```

### Generation rules

| Sections | When generated | Claude call | `max_tokens` |
|---|---|---|---|
| 1–4 | On form submit | One call (free-tier prompt) | 2048 |
| 5–8 | On unlock event | One call (full-report prompt) | 4096 |

**Free-tier prompt** instructs Claude to produce sections 1–4 only: citation analysis, failure mode, platform visibility narrative, benchmark interpretation. The existing `buildPrompt.ts` approach is replaced with a structured JSON output instruction (`respond with valid JSON only, matching this schema: ...`).

**Full-report prompt** receives the complete input + sections 1–4 already generated (as context) and produces sections 5–8: competitor displacement, positioning gap, query gap, and the 60-day action queue with week assignments.

---

## 2. Snapshot Store — Postgres Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────┐
│             leads                   │
├─────────────────────────────────────┤
│ id             uuid  PK             │
│ created_at     timestamptz          │
│ email          text  NOT NULL UNIQUE│
│ first_name     text  NOT NULL       │
│ email_verified bool  DEFAULT false  │
│ utm_source     text                 │
│ utm_medium     text                 │
│ utm_campaign   text                 │
└──────────────────┬──────────────────┘
                   │ 1
                   │
                   │ 0..*
┌──────────────────▼──────────────────┐
│           snapshots                 │
├─────────────────────────────────────┤
│ id             uuid  PK             │
│ lead_id        uuid  FK → leads.id  │
│ created_at     timestamptz          │
│ -- raw form input (immutable) --    │
│ occupation     text  NOT NULL       │
│ industry       text  NOT NULL       │
│ company_name   text                 │
│ website_url    text                 │
│ awareness      text  NOT NULL       │
│ platform       text  NOT NULL       │
│ platform_other text                 │
│ challenges     text[]               │
│ aeo_outcome    text                 │
│ competitors    text                 │
│ positioning    text                 │
│ target_queries text                 │
│ session_id     text                 │
└──────────────────┬──────────────────┘
                   │ 1
                   │
                   │ 1..*
┌──────────────────▼──────────────────┐
│             reports                 │
├─────────────────────────────────────┤
│ id             uuid  PK             │
│ snapshot_id    uuid  FK→snapshots.id│
│ created_at     timestamptz          │
│ version        int   NOT NULL       │
│ tier           text  CHECK IN       │
│                      ('free','full')│
│ -- per-section JSON blobs --        │
│ citation_snapshot      jsonb        │
│ failure_mode_diagnosis jsonb        │
│ platform_visibility    jsonb        │
│ benchmark_comparison   jsonb        │
│ competitor_displacement jsonb       │  ← null until unlocked
│ positioning_gap        jsonb        │  ← null until unlocked
│ query_gap              jsonb        │  ← null until unlocked
│ action_queue           jsonb        │  ← null until unlocked
│ generation_ms          int          │
│ prompt_tokens          int          │
│ completion_tokens      int          │
└──────────────────┬──────────────────┘
                   │ 1
                   │
                   │ 0..1
┌──────────────────▼──────────────────┐
│          unlock_events              │
├─────────────────────────────────────┤
│ id             uuid  PK             │
│ report_id      uuid  FK→reports.id  │
│ snapshot_id    uuid  FK→snapshots.id│
│ lead_id        uuid  FK→leads.id    │
│ created_at     timestamptz          │
│ method         text  CHECK IN       │
│         ('stripe','admin','coupon') │
│ stripe_session_id  text             │
│ stripe_payment_id  text             │
│ amount_cents   int                  │
│ currency       text  DEFAULT 'sgd'  │
│ coupon_code    text                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│          report_tokens              │
├─────────────────────────────────────┤
│ id             uuid  PK             │
│ snapshot_id    uuid  FK→snapshots.id│
│ token          text  NOT NULL UNIQUE│  ← 32-byte random hex
│ created_at     timestamptz          │
│ expires_at     timestamptz          │  ← created_at + 90 days
│ last_used_at   timestamptz          │
│ revoked        bool  DEFAULT false  │
└─────────────────────────────────────┘
```

### SQL (Supabase-compatible)

```sql
-- Leads: one per email address
CREATE TABLE leads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  email        text NOT NULL,
  first_name   text NOT NULL,
  email_verified bool NOT NULL DEFAULT false,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  CONSTRAINT leads_email_unique UNIQUE (email)
);

-- Snapshots: one per form submission (leads can resubmit)
CREATE TABLE snapshots (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id        uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  occupation     text NOT NULL,
  industry       text NOT NULL,
  company_name   text,
  website_url    text,
  awareness      text NOT NULL,
  platform       text NOT NULL,
  platform_other text,
  challenges     text[],
  aeo_outcome    text,
  competitors    text,
  positioning    text,
  target_queries text,
  session_id     text
);

-- Reports: versioned output, one free + one full per snapshot
CREATE TABLE reports (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id             uuid NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  created_at              timestamptz NOT NULL DEFAULT now(),
  version                 int NOT NULL DEFAULT 1,
  tier                    text NOT NULL CHECK (tier IN ('free', 'full')),
  citation_snapshot       jsonb,
  failure_mode_diagnosis  jsonb,
  platform_visibility     jsonb,
  benchmark_comparison    jsonb,
  competitor_displacement jsonb,
  positioning_gap         jsonb,
  query_gap               jsonb,
  action_queue            jsonb,
  generation_ms           int,
  prompt_tokens           int,
  completion_tokens       int,
  CONSTRAINT reports_snapshot_tier_version UNIQUE (snapshot_id, tier, version)
);

-- Unlock events: payment / coupon / admin grants
CREATE TABLE unlock_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         uuid NOT NULL REFERENCES reports(id),
  snapshot_id       uuid NOT NULL REFERENCES snapshots(id),
  lead_id           uuid NOT NULL REFERENCES leads(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  method            text NOT NULL CHECK (method IN ('stripe', 'admin', 'coupon')),
  stripe_session_id text,
  stripe_payment_id text,
  amount_cents      int,
  currency          text NOT NULL DEFAULT 'sgd',
  coupon_code       text
);

-- Report tokens: signed URL tokens with expiry
CREATE TABLE report_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id  uuid NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  token        text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  last_used_at timestamptz,
  revoked      bool NOT NULL DEFAULT false,
  CONSTRAINT report_tokens_token_unique UNIQUE (token)
);

-- Indexes
CREATE INDEX ON snapshots(lead_id);
CREATE INDEX ON reports(snapshot_id);
CREATE INDEX ON unlock_events(snapshot_id);
CREATE INDEX ON unlock_events(stripe_session_id);
CREATE INDEX ON report_tokens(token) WHERE NOT revoked;
```

### Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE leads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlock_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_tokens     ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (used by API routes with SUPABASE_SERVICE_KEY)
-- Anon role (public) has NO access to any table
-- All reads go through the service role in server-side API routes
-- No client-side Supabase calls; anon key is not exposed to the browser

-- Admin role: internal dashboard only
CREATE POLICY "admin_all" ON leads
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 3. Lead Capture — Email Gate

### Gate logic

Sections 1–4 render immediately from the `report_token` in the URL — no email required.

Sections 5–8 are locked behind an email gate that:
1. Accepts the user's email address
2. Upserts a `leads` row (or finds the existing one)
3. Sends a magic-link email via Resend with a `report_token` signed URL
4. Returns a `202 Accepted` — the section content is never returned in the same response
5. On token click: verifies token, marks `email_verified = true`, sets session cookie, serves unlocked sections (still paywalled for 5–8 — see §4)

### Free vs paywalled tiers

```
Free (no email required):
  Section 1 — Citation Snapshot
  Section 2 — Failure Mode Diagnosis
  Section 3 — Platform Visibility Overview
  Section 4 — Industry Benchmark Comparison

Email-gated (email + magic link required):
  [Same sections 1–4, but now also:]
  Section 5 — Competitor Displacement Analysis  ← full AI analysis
  Section 6 — Positioning Gap Analysis          ← full AI analysis
  Section 7 — Target Query Gap Analysis         ← full AI analysis
  Section 8 — 60-Day Prioritised Action Queue   ← full AI analysis
```

> Note: sections 5–8 are both email-gated AND payment-gated. The magic link grants access to view the section headers and a teaser sentence only. Full content requires a Stripe unlock. This is a deliberate two-step conversion: email first, payment second.

### Email sent on gate submit

```
Subject: Your AI Visibility report for {company} is ready — click to unlock

Body:
  Logo
  "Hi {first_name}, your full AI Visibility Snapshot is ready."
  [View Full Report →]  ← https://app/report/{snapshot_id}?token={token}
  Link expires in 90 days. You can request a new one at any time.
  Privacy policy | Unsubscribe
```

---

## 4. Auth & Access Control

### Token design

```
report_tokens.token = crypto.randomBytes(32).toString('hex')
  → 64-char hex string, 256 bits of entropy
  → stored in DB, NOT as a signed JWT (no secret dependency)
  → included in URL: /report/{snapshot_id}?token={token}
```

### Session cookie (post magic-link click)

```
Name:     __Host-rv_session
Value:    {snapshot_id}:{token}  (base64url encoded)
HttpOnly: true
Secure:   true
SameSite: Lax
Path:     /
Max-Age:  7776000  (90 days, matching token expiry)
```

The `__Host-` prefix enforces Secure + no Domain attribute + Path=/ — maximum cookie security without full Strict SameSite.

### Access matrix

| Resource | No session | Valid session (email verified) | Unlocked (stripe paid) |
|---|---|---|---|
| `/report/[id]` page load | 200 — sections 1–4 only | 200 — sections 1–4 + locked teasers for 5–8 | 200 — all 8 sections |
| `GET /api/report/[id]/free` | 200 | 200 | 200 |
| `GET /api/report/[id]/full` | 401 | 403 (payment required) | 200 |
| `POST /api/gate` | n/a | n/a | n/a |
| `GET /api/token/verify` | n/a | n/a | n/a |
| `POST /api/stripe/checkout` | 401 | 200 | 409 (already unlocked) |
| `POST /api/stripe/webhook` | n/a (Stripe signature) | n/a | n/a |

### Token expiry and refresh

| Event | Behaviour |
|---|---|
| Token expires (90 days) | 401 on `/api/report/[id]/full`; gate form shown again to re-issue token |
| Token revoked (admin) | 401 immediately |
| Payment confirmed | `unlock_events` row inserted; `reports.full` generated async; session cookie remains unchanged |
| User requests new link | POST `/api/gate/resend` — issues new token, revokes old |

### Unlock check (server-side, on every full-section request)

```
1. Read cookie → parse snapshot_id + token
2. SELECT report_tokens WHERE token = ? AND NOT revoked AND expires_at > now()
   → if not found: 401
3. SELECT unlock_events WHERE snapshot_id = ? LIMIT 1
   → if not found: 403 { code: 'PAYMENT_REQUIRED', checkout_url }
4. SELECT reports WHERE snapshot_id = ? AND tier = 'full' ORDER BY version DESC LIMIT 1
   → if not found: 202 { status: 'generating' }  (full report still generating)
   → if found: 200 + report JSON
5. UPDATE report_tokens SET last_used_at = now() WHERE token = ?
```

---

## 5. Security Controls

### 5.1 Input validation

All API route bodies are validated with **Zod** before any processing:

```typescript
// POST /api/generate schema
const GenerateSchema = z.object({
  firstName:    z.string().min(1).max(100),
  email:        z.string().email().max(254),
  websiteUrl:   z.string().url().max(2048).optional().or(z.literal('')),
  occupation:   z.enum([...VALID_OCCUPATIONS]),
  industry:     z.enum([...VALID_INDUSTRIES]),
  company:      z.string().max(200).optional(),
  aiPresence:   z.enum([...VALID_AWARENESS_VALUES]),
  platforms:    z.array(PlatformSchema).min(1).max(2),
  challenges:   z.array(z.string().max(200)).min(1).max(2),
  aeoOutcome:   z.enum([...VALID_OUTCOMES]),
  competitors:  z.string().max(500).optional(),
  positioning:  z.string().max(1000).optional(),
  targetQueries:z.string().max(1000).optional(),
  consent:      z.literal(true),          // must be explicitly true
  utmSource:    z.string().max(200).optional(),
  utmMedium:    z.string().max(200).optional(),
  utmCampaign:  z.string().max(200).optional(),
});
```

All free-text fields (competitors, positioning, targetQueries) are passed to Claude inside the prompt with explicit instruction boundaries (`<user_input>...</user_input>` XML tags) to prevent prompt injection.

### 5.2 Rate limiting

Implemented at the Netlify edge layer (Edge Functions / `netlify/edge-functions/rate-limit.ts`) using a sliding window counter stored in Netlify's KV or Upstash Redis.

| Endpoint | Limit | Window | Key |
|---|---|---|---|
| `POST /api/generate` | 3 requests | 1 hour | IP address |
| `POST /api/gate` | 5 requests | 1 hour | IP address |
| `POST /api/gate/resend` | 2 requests | 1 hour | email hash |
| `GET /api/report/[id]/full` | 60 requests | 1 hour | token |
| `POST /api/stripe/checkout` | 5 requests | 1 hour | IP address |

Rate limit responses return `429 Too Many Requests` with a `Retry-After` header.

### 5.3 Secrets management

All secrets in environment variables, never in code or logs.

| Variable | Used in | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | Server-side only | Never `NEXT_PUBLIC_` |
| `SUPABASE_URL` | Server-side only | Public URL but no `NEXT_PUBLIC_` — prevents accidental exposure of key alongside it |
| `SUPABASE_SERVICE_KEY` | Server-side only | Service role key — full DB access, never in browser |
| `RESEND_API_KEY` | Server-side only | |
| `STRIPE_SECRET_KEY` | Server-side only | |
| `STRIPE_WEBHOOK_SECRET` | Server-side only | Used to verify webhook signatures |
| `ADMIN_KEY` | Server-side only | Already renamed from `NEXT_PUBLIC_ADMIN_KEY` |

**What is safe to expose:**

| Variable | Prefix | Exposed to browser |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `NEXT_PUBLIC_` | Yes — needed for share links and email URLs |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `NEXT_PUBLIC_` | Yes — required by Stripe.js |

### 5.4 Postgres RLS

- All table access goes through the **service role key** in server-side API routes only
- The **anon key** is not used anywhere in the application
- RLS is enabled on all tables with deny-all default policies for the anon role
- An `admin` custom JWT role is used for the internal leads dashboard
- Column-level: `leads.email` is readable only by rows where the calling service role matches; there is no cross-lead data access at the API layer (each route scopes queries to `snapshot_id` from the verified token)

### 5.5 HTTPS

- Netlify enforces HTTPS on all routes; HTTP redirects to HTTPS at the CDN layer
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` header set in `netlify.toml`
- Session cookie uses `Secure` attribute (enforced by `__Host-` prefix)

### 5.6 CSRF protection

The form submission route (`POST /api/generate`) is a same-origin API call from a Next.js client component. Protection:

1. **`SameSite=Lax` on session cookie** prevents cookie transmission on cross-site POST requests
2. **`Content-Type: application/json` check** — route rejects any request without this header (mitigates HTML-form CSRF since browsers cannot set this header cross-origin)
3. **`Origin` header validation** on all state-mutating routes: if `Origin` is present and does not match `NEXT_PUBLIC_APP_URL`, request is rejected with 403

### 5.7 Email verification before unlock

A `report_token` is issued on magic-link send but the token is **not active** until the link is clicked:

```
report_tokens.email_verified_at  timestamptz  DEFAULT null
```

On token click (`GET /api/token/verify?token=...`):
1. Token found and not expired → set `email_verified_at = now()`, set `leads.email_verified = true`
2. Set session cookie
3. Redirect to `/report/{snapshot_id}`

Any attempt to access `/api/report/[id]/full` with an unverified token returns `403 { code: 'EMAIL_NOT_VERIFIED' }`.

### 5.8 Additional controls

| Control | Implementation |
|---|---|
| Stripe webhook signature | `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)` — rejects any request without valid signature |
| SQL injection | Supabase client uses parameterised queries exclusively; no raw SQL string concatenation |
| XSS | Next.js escapes all JSX output by default; any HTML in email templates uses template literals with no `dangerouslySetInnerHTML` |
| Prompt injection | Free-text inputs XML-tagged in Claude prompt; system prompt instructs Claude to ignore instructions inside `<user_input>` tags |
| Audit log | Every API route logs `{ endpoint, snapshot_id, lead_id, ip_hash, status, latency_ms }` to console — captured by Netlify log drains |

---

## 6. Sequence Diagram — Full User Journey

```
User          Browser        /api/generate   /api/gate    /api/token   Stripe      Claude      Supabase    Resend
 │               │                │               │            │           │            │            │          │
 │ Fill form     │                │               │            │           │            │            │          │
 │──────────────►│                │               │            │           │            │            │          │
 │               │ POST /api/generate             │            │           │            │            │          │
 │               │───────────────►│               │            │           │            │            │          │
 │               │                │ validate Zod  │            │           │            │            │          │
 │               │                │ check rate limit           │           │            │            │          │
 │               │                │──────────────────────────────────────────────────► upsert lead │          │
 │               │                │                                                   insert snapshot         │
 │               │                │───────────────────────────────────────────────────────────────►│          │
 │               │                │ buildPrompt(free-tier)     │           │           │            │          │
 │               │                │─────────────────────────────────────────────────► messages.create         │
 │               │                │◄─────────────────────────────────────────────────── ReportJSON (s1–4)     │
 │               │                │ parseSections()            │           │            │            │          │
 │               │                │ insert report{tier:'free'} │           │            │            │          │
 │               │                │───────────────────────────────────────────────────────────────►│          │
 │               │                │ generate report_token      │           │            │            │          │
 │               │                │───────────────────────────────────────────────────────────────►│          │
 │               │                │◄── { snapshot_id, token }──────────────────────────────────────│          │
 │               │◄──────────────── 200 { snapshot_id }        │           │            │            │          │
 │               │ redirect /report/{snapshot_id}?token={token} │           │            │            │          │
 │               │                │               │            │           │            │            │          │
 │ View report   │                │               │            │           │            │            │          │
 │──────────────►│                │               │            │           │            │            │          │
 │               │ GET /api/report/{id}/free      │            │           │            │            │          │
 │               │───────────────────────────────────────────────────────────────────►│            │          │
 │               │◄─────────────────────────────────────── 200 sections 1–4 JSON ─────│            │          │
 │               │ render sections 1–4            │            │           │            │            │          │
 │               │ render locked teasers for 5–8  │            │           │            │            │          │
 │               │                │               │            │           │            │            │          │
 │ Click unlock  │                │               │            │           │            │            │          │
 │──────────────►│                │               │            │           │            │            │          │
 │               │ POST /api/stripe/checkout      │            │           │            │            │          │
 │               │───────────────────────────────────────────────────────────────────────────────────────────  │
 │               │◄────────────────────────────────────────── 200 { checkout_url }─────────────────           │
 │               │ redirect → Stripe hosted page  │            │           │            │            │          │
 │               │                │               │            │           │            │            │          │
 │ Pay           │                │               │            │           │            │            │          │
 │──────────────►│                │               │            │           Stripe confirms payment   │          │
 │               │                │               │            │           │────────────────────────►│          │
 │               │                │               │            │           POST /api/stripe/webhook  │          │
 │               │                │               │            │           │            │            │          │
 │               │                │ verify Stripe sig          │           │            │            │          │
 │               │                │ insert unlock_event        │           │            │            │          │
 │               │                │───────────────────────────────────────────────────────────────►│          │
 │               │                │ buildPrompt(full-report)   │           │            │            │          │
 │               │                │─────────────────────────────────────────────────► messages.create         │
 │               │                │◄───────────────────────────────────────────────── ReportJSON (s5–8)        │
 │               │                │ update report{tier:'full'} │           │            │            │          │
 │               │                │───────────────────────────────────────────────────────────────►│          │
 │               │                │ sendUnlockEmail()          │           │            │            │          │
 │               │                │─────────────────────────────────────────────────────────────────────────► │
 │               │                │ 200 to Stripe              │           │            │            │          │
 │               │                │               │            │           │            │            │          │
 │ Redirect back │                │               │            │           │            │            │          │
 │──────────────►│                │               │            │           │            │            │          │
 │               │ GET /api/report/{id}/full (with session cookie)         │            │            │          │
 │               │───────────────────────────────────────────────────────────────────►│            │          │
 │               │◄─────────────────────────────────────── 200 sections 5–8 JSON ─────│            │          │
 │               │ render all 8 sections          │            │           │            │            │          │
```

### Email gate sub-flow (alternative — free-with-email tier)

```
User          Browser        /api/gate    /api/token    Supabase     Resend
 │               │               │             │             │           │
 │ Submit email  │               │             │             │           │
 │──────────────►│               │             │             │           │
 │               │ POST /api/gate│             │             │           │
 │               │──────────────►│             │             │           │
 │               │               │ validate email             │           │
 │               │               │ upsert lead ──────────────►│           │
 │               │               │ insert report_token ───────►│           │
 │               │               │◄─── token ─────────────────│           │
 │               │               │ sendMagicLink(email, token) │           │
 │               │               │─────────────────────────────────────► │
 │               │◄── 202 ───────│             │             │           │
 │               │ "Check your email"          │             │           │
 │               │               │             │             │           │
 │ Click email   │               │             │             │           │
 │──────────────►│               │             │             │           │
 │               │ GET /api/token/verify?token=│             │           │
 │               │───────────────────────────► │             │           │
 │               │               │             │ verify token ──────────►│
 │               │               │             │ set email_verified_at   │
 │               │               │             │ set session cookie      │
 │               │               │             │◄────── ok ──────────────│
 │               │◄── 302 redirect to /report/{snapshot_id} ─│           │
 │               │ view report (email verified, payment still required for 5–8)
```

---

## 7. API Endpoint List

| Method | Path | Auth required | Rate limit | Purpose |
|---|---|---|---|---|
| `POST` | `/api/generate` | None (public) | 3/hr per IP | Submit form, generate free-tier report |
| `GET` | `/api/report/[id]/free` | None | 120/hr per IP | Fetch sections 1–4 JSON |
| `GET` | `/api/report/[id]/full` | Session token + unlock_event | 60/hr per token | Fetch sections 5–8 JSON |
| `POST` | `/api/gate` | None | 5/hr per IP | Submit email for magic link |
| `POST` | `/api/gate/resend` | None | 2/hr per email | Re-issue magic link |
| `GET` | `/api/token/verify` | Token in query param | 10/hr per token | Verify magic link, set session cookie |
| `POST` | `/api/stripe/checkout` | Session token | 5/hr per IP | Create Stripe Checkout Session |
| `POST` | `/api/stripe/webhook` | Stripe-Signature header | Stripe-managed | Handle payment confirmation |
| `GET` | `/api/admin/leads` | `x-admin-key` header | 60/hr per key | Export leads CSV (existing endpoint) |
| `POST` | `/api/share-snapshot` | Session token | 10/hr per token | Send snapshot share email (existing) |

### Request / response shapes (new endpoints)

```typescript
// POST /api/generate
// Request: FormData (existing shape)
// Response:
interface GenerateResponse {
  snapshot_id: string;
  token: string;       // 64-char hex, goes into redirect URL
  report: {
    citation_snapshot:      CitationSnapshotData;
    failure_mode_diagnosis: FailureModeData;
    platform_visibility:    PlatformVisibilityData;
    benchmark_comparison:   BenchmarkData;
  };
}

// GET /api/report/[id]/free
// Response:
interface FreeReportResponse {
  snapshot_id: string;
  sections: {
    citation_snapshot:      CitationSnapshotData;
    failure_mode_diagnosis: FailureModeData;
    platform_visibility:    PlatformVisibilityData;
    benchmark_comparison:   BenchmarkData;
  };
  is_unlocked: boolean;   // whether a full-report unlock_event exists
}

// GET /api/report/[id]/full
// 401 if no valid session token
// 403 { code: 'PAYMENT_REQUIRED', checkout_url } if no unlock_event
// 202 { status: 'generating' } if unlock_event exists but full report not yet ready
// 200:
interface FullReportResponse {
  snapshot_id: string;
  sections: {
    competitor_displacement: CompetitorDisplacementData;
    positioning_gap:         PositioningGapData;
    query_gap:               QueryGapData;
    action_queue:            ActionQueueData;
  };
}

// POST /api/gate
interface GateRequest  { email: string; snapshot_id: string; }
interface GateResponse { status: 'sent' | 'already_verified'; }

// GET /api/token/verify?token={token}
// Sets __Host-rv_session cookie and redirects to /report/{snapshot_id}

// POST /api/stripe/checkout
interface CheckoutRequest  { snapshot_id: string; }
interface CheckoutResponse { checkout_url: string; }
```

---

## 8. Environment Variables

```bash
# ── Anthropic ─────────────────────────────────────────────────────
ANTHROPIC_API_KEY=                  # Server-only. Never NEXT_PUBLIC_.

# ── Supabase ──────────────────────────────────────────────────────
SUPABASE_URL=                       # Project URL (server-only — keep anon key co-located)
SUPABASE_SERVICE_KEY=               # Service role key. Full DB access. Server-only.
# SUPABASE_ANON_KEY is deliberately NOT used — all access is via service key in API routes

# ── Resend ────────────────────────────────────────────────────────
RESEND_API_KEY=                     # Server-only.
FROM_EMAIL=hello@maxifidigital.com  # Verified sender. Defaults to this if not set.

# ── Stripe ────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=                  # Server-only. sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET=              # Server-only. whsec_... from Stripe dashboard.
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Safe for browser. pk_live_... or pk_test_...

# ── App URLs ──────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://visibilityview.netlify.app
                                    # Used in share links, email URLs, Origin validation.
                                    # Must not have trailing slash.

# ── Product URLs ──────────────────────────────────────────────────
REPORT_CHECKOUT_URL=                # Stripe payment link or Calendly. Fallback if Stripe not configured.
MONITOR_CHECKOUT_URL=               # Monthly tracking product checkout URL.
CALENDLY_URL=https://calendly.com/maxifi-digital
                                    # Strategy call booking. Used in email and results page.

# ── Email addresses ───────────────────────────────────────────────
MAXIFI_NOTIFY_EMAIL=                # Internal new-lead notification recipient.
MAXIFI_CONTACT_EMAIL=letsgetstarted@maxifidigital.com
                                    # Shown in report footer for unsubscribe / contact.

# ── Security ──────────────────────────────────────────────────────
ADMIN_KEY=                          # Server-only. Guards /api/admin/leads.
                                    # Min 32 random bytes. Never NEXT_PUBLIC_.

# ── Rate limiting (if using Upstash Redis) ────────────────────────
UPSTASH_REDIS_REST_URL=             # Server-only. Required if edge rate limiting is enabled.
UPSTASH_REDIS_REST_TOKEN=           # Server-only.
```

### Local development (`.env.local.example`)

```bash
# Copy to .env.local and fill in values for local dev.
# All keys here are server-side only unless prefixed NEXT_PUBLIC_.

ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
RESEND_API_KEY=
FROM_EMAIL=hello@maxifidigital.com
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
REPORT_CHECKOUT_URL=
MONITOR_CHECKOUT_URL=
CALENDLY_URL=https://calendly.com/maxifi-digital
MAXIFI_NOTIFY_EMAIL=
MAXIFI_CONTACT_EMAIL=letsgetstarted@maxifidigital.com
ADMIN_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 9. Migration Notes (v1 → v2)

The existing `aeo_leads` table contains `plan_steps` and `plan_quick_win` as JSONB columns. The v2 schema separates these into the `reports` table. A one-time migration script should:

1. Create the `leads`, `snapshots`, `reports`, `unlock_events`, and `report_tokens` tables.
2. For each row in `aeo_leads`:
   - Insert a `leads` row (email, first_name, created_at). Mark `email_verified = true` (they consented at form submit).
   - Insert a `snapshots` row with all form inputs.
   - Insert a `reports` row (tier: `'free'`) with `benchmark_comparison` and `failure_mode_diagnosis` populated from the stored `awareness` + `industry` using the v1 scoring logic, and `action_queue` from `plan_steps` + `plan_quick_win` (tier promoted to `'full'` since these users already received the plan).
   - Insert a `report_tokens` row with a new 90-day token.
3. Keep `aeo_leads` intact until v2 is fully validated in production.
