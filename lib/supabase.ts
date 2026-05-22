import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { FormData } from '@/lib/types';
import type { Plan, PlanStep } from '@/lib/planTypes';

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
  competitive_standing: string | null;
  query_coverage: string | null;
  platform_consistency: string | null;
}

// ─── Insert a new lead + plan ─────────────────────────────────────────────────

export async function insertLead(
  formData: FormData,
  plan: Plan
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
      competitive_standing: formData.competitiveStanding || null,
      query_coverage: formData.queryCoverage || null,
      platform_consistency: formData.platformConsistency || null,
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

// ─── Fetch all leads ──────────────────────────────────────────────────────────

export async function getAllLeads(): Promise<AeoLeadRow[]> {
  const { data, error } = await getClient()
    .from('aeo_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AeoLeadRow[];
}