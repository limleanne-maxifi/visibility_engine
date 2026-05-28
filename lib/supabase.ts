import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { FormData } from '@/lib/types';
import type { Plan, PlanStep } from '@/lib/planTypes';
import type { ReportData } from '@/lib/reportTypes';

// ─── Client singleton (lazy — avoids build-time crash when env vars are absent)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any> | null = null;

function getClient() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );
  }
  return _supabase;
}

// ─── Service-role client (server-only — bypasses RLS) ────────────────────────
// Used ONLY by routes that need to UPDATE aeo_leads (currently the Stripe
// webhook). The anon-key client (getClient above) is bound by RLS and only
// has INSERT + SELECT policies (RESOLVED-7 in CLAUDE.md). The webhook needs
// UPDATE to mark a lead paid; granting UPDATE to anon would let any browser
// client mutate any row, so we use the server-only service-role key instead.
//
// SECURITY:
// - SUPABASE_SERVICE_ROLE_KEY must be Netlify-side only (server context).
// - Never import this function from a client component.
// - Never log the key. Never embed it in any response.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabaseServiceRole: SupabaseClient<any> | null = null;

export function getServiceRoleClient() {
  if (!_supabaseServiceRole) {
    _supabaseServiceRole = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return _supabaseServiceRole;
}

// ─── Row type (mirrors aeo_leads schema) ─────────────────────────────────────

export interface AeoLeadRow {
  id: string;
  created_at: string;
  first_name: string;
  email: string;
  website: string | null;
  occupation: string;
  industry: string;
  company_name: string | null;
  awareness: string;
  // 4-signal model — signals 2/3/4 (nullable for rows that predate the schema migration)
  competitive_standing: string | null;
  query_coverage: string | null;
  platform_consistency: string | null;
  platform: string;
  platform_other: string | null;
  challenge: string;
  outcome: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  plan_steps: PlanStep[];
  plan_quick_win: string;
  session_id: string | null;
  competitors: string | null;
  positioning: string | null;
  target_queries: string | null;
  // Stage 3 columns
  report_token: string | null;
  report_data: ReportData | null;
  paid: boolean;
  stripe_session_id: string | null;
  status: string;
  founding: boolean;
  // Stripe webhook columns — populated when checkout.session.completed fires
  // for this lead. Schema migration adds these as nullable; old rows = null.
  paid_amount: number | null;     // smallest currency unit (e.g. cents)
  paid_currency: string | null;   // ISO 4217 (3-char, lowercased per Stripe)
  paid_at: string | null;         // ISO 8601
}

// ─── Insert a new lead + plan ─────────────────────────────────────────────────

export interface InsertLeadExtras {
  reportToken: string;
  reportData: ReportData;
}

export async function insertLead(
  formData: FormData,
  plan: Plan,
  extras: InsertLeadExtras,
): Promise<AeoLeadRow> {
  const primaryPlatform = formData.platforms.find((p) => p.priority === 'primary')?.value ?? '';
  const secondaryPlatform = formData.platforms.find((p) => p.priority === 'secondary')?.value ?? null;

  const { data, error } = await getClient()
    .from('aeo_leads')
    .insert({
      first_name: formData.firstName,
      email: formData.email,
      website: formData.websiteUrl || null,
      occupation: formData.occupation,
      industry: formData.industry,
      company_name: formData.company || null,
      awareness: formData.aiPresence,
      competitive_standing: formData.competitiveStanding || null,
      query_coverage: formData.queryCoverage || null,
      platform_consistency: formData.platformConsistency || null,
      platform: primaryPlatform,
      platform_other: secondaryPlatform,
      challenge: formData.challenges.join('; ') || '',
      outcome: formData.visibilityGap,
      utm_source: formData.utmSource || null,
      utm_medium: formData.utmMedium || null,
      utm_campaign: formData.utmCampaign || null,
      plan_steps: plan.steps,
      plan_quick_win: plan.quickWin,
      session_id: formData.sessionId || null,
      competitors: formData.competitors || null,
      positioning: formData.positioning || null,
      target_queries: formData.targetQueries || null,
      report_token: extras.reportToken,
      report_data: extras.reportData,
      paid: false,
      status: 'teaser_sent',
      founding: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AeoLeadRow;
}

// ─── Fetch a lead by id ───────────────────────────────────────────────────────

export async function getLeadById(id: string): Promise<AeoLeadRow | null> {
  const { data, error } = await getClient()
    .from('aeo_leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // PGRST116 = row not found — expected, not an error worth throwing
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as AeoLeadRow;
}

// ─── Fetch a lead by report_token ─────────────────────────────────────────────

export async function getLeadByToken(token: string): Promise<AeoLeadRow | null> {
  const { data, error } = await getClient()
    .from('aeo_leads')
    .select('*')
    .eq('report_token', token)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as AeoLeadRow;
}

// ─── Fetch all leads ──────────────────────────────────────────────────────────

export async function getAllLeads(): Promise<AeoLeadRow[]> {
  const { data, error } = await getClient()
    .from('aeo_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AeoLeadRow[];
}

// ─── Stripe webhook helpers (server-only — use service-role client) ───────────

/**
 * Look up the most recent lead by email address. Used by the Stripe webhook
 * to match a completed checkout session to the form submission it came from.
 * Returns null if no match. Uses the service-role client (bypasses RLS).
 */
export async function findLeadByEmail(email: string): Promise<AeoLeadRow | null> {
  const { data, error } = await getServiceRoleClient()
    .from('aeo_leads')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as AeoLeadRow | null) ?? null;
}

/**
 * Mark a lead as paid and record the Stripe session details. Uses the
 * service-role client (anon RLS has no UPDATE policy). Called by the
 * Stripe webhook after signature verification + lead match.
 */
export async function recordPayment(
  leadId: string,
  payload: {
    stripeSessionId: string;
    amount: number | null;
    currency: string | null;
    paidAt: string;
  },
): Promise<void> {
  const { error } = await getServiceRoleClient()
    .from('aeo_leads')
    .update({
      paid: true,
      status: 'paid',
      stripe_session_id: payload.stripeSessionId,
      paid_amount: payload.amount,
      paid_currency: payload.currency,
      paid_at: payload.paidAt,
    })
    .eq('id', leadId);

  if (error) throw error;
}
