-- Migration: 001_v2_schema
-- Description: v2 leads/snapshots/reports/unlock_events/report_tokens schema
-- Run via: supabase db push  OR  psql $DATABASE_URL -f this file
-- Safe to run on a fresh database. Does NOT drop aeo_leads.

-- ─── leads ────────────────────────────────────────────────────────────────────
-- One row per unique email address. Created on first form submission or gate
-- submit. A single lead can have many snapshots (resubmissions over time).

CREATE TABLE leads (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  email          text        NOT NULL,
  first_name     text        NOT NULL,
  email_verified bool        NOT NULL DEFAULT false,
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  CONSTRAINT leads_email_unique UNIQUE (email)
);

-- ─── snapshots ────────────────────────────────────────────────────────────────
-- One row per form submission. Immutable after insert — raw inputs are preserved
-- exactly as submitted so reports can always be regenerated from source data.

CREATE TABLE snapshots (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id        uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  occupation     text        NOT NULL,
  industry       text        NOT NULL,
  company_name   text,
  website_url    text,
  awareness      text        NOT NULL,
  platform       text        NOT NULL,
  platform_other text,
  challenges     text[],
  aeo_outcome    text,
  competitors    text,
  positioning    text,
  target_queries text,
  session_id     text
);

-- ─── reports ──────────────────────────────────────────────────────────────────
-- Versioned generated output linked to a snapshot. tier='free' rows contain
-- sections 1–4 only (locked columns null). tier='full' rows contain all 8.
-- version increments on regeneration; the highest version is current.

CREATE TABLE reports (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id             uuid        NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  created_at              timestamptz NOT NULL DEFAULT now(),
  version                 int         NOT NULL DEFAULT 1,
  tier                    text        NOT NULL CHECK (tier IN ('free', 'full')),
  -- Free-tier sections (1–4) — always populated on first generation
  citation_snapshot       jsonb,
  failure_mode_diagnosis  jsonb,
  platform_visibility     jsonb,
  benchmark_comparison    jsonb,
  -- Locked sections (5–8) — null until unlock_event is confirmed
  competitor_displacement jsonb,
  positioning_gap         jsonb,
  query_gap               jsonb,
  action_queue            jsonb,
  -- Generation telemetry
  generation_ms           int,
  prompt_tokens           int,
  completion_tokens       int,
  CONSTRAINT reports_snapshot_tier_version UNIQUE (snapshot_id, tier, version)
);

-- ─── unlock_events ────────────────────────────────────────────────────────────
-- Audit trail of every unlock grant. Presence of a row for a snapshot_id
-- means the full report is authorised. method tracks the grant source.

CREATE TABLE unlock_events (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         uuid        NOT NULL REFERENCES reports(id),
  snapshot_id       uuid        NOT NULL REFERENCES snapshots(id),
  lead_id           uuid        NOT NULL REFERENCES leads(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  method            text        NOT NULL CHECK (method IN ('stripe', 'admin', 'coupon')),
  stripe_session_id text,
  stripe_payment_id text,
  amount_cents      int,
  currency          text        NOT NULL DEFAULT 'sgd',
  coupon_code       text
);

-- ─── report_tokens ────────────────────────────────────────────────────────────
-- 64-char hex tokens (32 random bytes) used in magic-link URLs and session
-- cookies. email_verified_at is null until the magic link is clicked, after
-- which /api/report/[id]/full is accessible (subject to payment check).

CREATE TABLE report_tokens (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id       uuid        NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  token             text        NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  last_used_at      timestamptz,
  revoked           bool        NOT NULL DEFAULT false,
  email_verified_at timestamptz,
  CONSTRAINT report_tokens_token_unique UNIQUE (token)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Snapshots by lead — used when loading all snapshots for a returning lead
CREATE INDEX ON snapshots(lead_id);

-- Reports by snapshot — used on every report read request
CREATE INDEX ON reports(snapshot_id);

-- Unlock events by snapshot — used on every full-report auth check
CREATE INDEX ON unlock_events(snapshot_id);

-- Unlock events by Stripe session — used in webhook handler to prevent duplicates
CREATE INDEX ON unlock_events(stripe_session_id);

-- Active tokens by value — the primary lookup path; partial index skips revoked rows
CREATE INDEX ON report_tokens(token) WHERE NOT revoked;

-- Tokens by snapshot — used when gate re-checks for an existing active token
CREATE INDEX ON report_tokens(snapshot_id) WHERE NOT revoked;

-- ─── Row-Level Security ───────────────────────────────────────────────────────
--
-- Access model:
--   All application reads and writes go through the Supabase service role key
--   (SUPABASE_SERVICE_KEY) in server-side API routes. The service role bypasses
--   RLS entirely — no policies are required for it.
--
--   The anon role (used by unauthenticated browser clients) has NO grants on any
--   table. RLS is enabled as a defence-in-depth measure: even if the anon key
--   were accidentally used, no data would be accessible.
--
--   The authenticated role with a custom 'admin' claim is reserved for the
--   internal leads dashboard. All other authenticated users have no access.

ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlock_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_tokens  ENABLE ROW LEVEL SECURITY;

-- Admin-only policy: full access for JWTs where role claim = 'admin'.
-- The service role bypasses this (and all other) policies automatically.
CREATE POLICY "admin_all" ON leads
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
