import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import type {
  LeadRow,
  SnapshotRow,
  ReportRow,
  UnlockEventRow,
  ReportTokenRow,
  FreeReportSections,
  FullReportSections,
} from '@/lib/types-v2';

// ─── Client singleton (lazy — avoids build-time crash when env vars are absent)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any> | null = null;

function getClient() {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );
  }
  return _client;
}

// ─── Form input shape (mirrors v1 FormData but typed inline for isolation) ────

export interface SnapshotInput {
  occupation: string;
  industry: string;
  company_name?: string | null;
  website_url?: string | null;
  awareness: string;
  platform: string;
  platform_other?: string | null;
  challenges?: string[] | null;
  aeo_outcome?: string | null;
  competitors?: string | null;
  positioning?: string | null;
  target_queries?: string | null;
  session_id?: string | null;
}

// ─── 1. upsertLead ────────────────────────────────────────────────────────────
// Creates the lead on first submission; on re-submission updates first_name only
// when the caller passes a non-empty string (preserves existing value otherwise).

export async function upsertLead(email: string, firstName: string): Promise<LeadRow> {
  const db = getClient();

  const { data: existing, error: fetchError } = await db
    .from('leads')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    if (firstName) {
      const { data, error } = await db
        .from('leads')
        .update({ first_name: firstName })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data as LeadRow;
    }
    return existing as LeadRow;
  }

  const { data, error } = await db
    .from('leads')
    .insert({ email, first_name: firstName })
    .select()
    .single();

  if (error) throw error;
  return data as LeadRow;
}

// ─── 2. insertSnapshot ────────────────────────────────────────────────────────

export async function insertSnapshot(
  leadId: string,
  input: SnapshotInput,
): Promise<SnapshotRow> {
  const { data, error } = await getClient()
    .from('snapshots')
    .insert({
      lead_id: leadId,
      occupation: input.occupation,
      industry: input.industry,
      company_name: input.company_name ?? null,
      website_url: input.website_url ?? null,
      awareness: input.awareness,
      platform: input.platform,
      platform_other: input.platform_other ?? null,
      challenges: input.challenges ?? null,
      aeo_outcome: input.aeo_outcome ?? null,
      competitors: input.competitors ?? null,
      positioning: input.positioning ?? null,
      target_queries: input.target_queries ?? null,
      session_id: input.session_id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SnapshotRow;
}

// ─── 3. insertFreeReport ──────────────────────────────────────────────────────

export async function insertFreeReport(
  snapshotId: string,
  sections: FreeReportSections,
  meta?: { generation_ms?: number; prompt_tokens?: number; completion_tokens?: number },
): Promise<ReportRow> {
  const { data, error } = await getClient()
    .from('reports')
    .insert({
      snapshot_id: snapshotId,
      version: 1,
      tier: 'free',
      citation_snapshot: sections.citation_snapshot,
      failure_mode_diagnosis: sections.failure_mode_diagnosis,
      platform_visibility: sections.platform_visibility,
      benchmark_comparison: sections.benchmark_comparison,
      generation_ms: meta?.generation_ms ?? null,
      prompt_tokens: meta?.prompt_tokens ?? null,
      completion_tokens: meta?.completion_tokens ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ReportRow;
}

// ─── 4. updateReportWithFullSections ─────────────────────────────────────────
// Increments version and sets tier to 'full'. Reads current version first.

export async function updateReportWithFullSections(
  reportId: string,
  sections: FullReportSections,
  meta?: { generation_ms?: number; prompt_tokens?: number; completion_tokens?: number },
): Promise<ReportRow> {
  const db = getClient();

  const { data: current, error: fetchError } = await db
    .from('reports')
    .select('version')
    .eq('id', reportId)
    .single();

  if (fetchError) throw fetchError;

  const { data, error } = await db
    .from('reports')
    .update({
      version: (current.version as number) + 1,
      tier: 'full',
      competitor_displacement: sections.competitor_displacement,
      positioning_gap: sections.positioning_gap,
      query_gap: sections.query_gap,
      action_queue: sections.action_queue,
      generation_ms: meta?.generation_ms ?? null,
      prompt_tokens: meta?.prompt_tokens ?? null,
      completion_tokens: meta?.completion_tokens ?? null,
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data as ReportRow;
}

// ─── 5. insertReportToken ─────────────────────────────────────────────────────
// 32 random bytes → 64-char hex token; 90-day expiry.

export async function insertReportToken(snapshotId: string): Promise<ReportTokenRow> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await getClient()
    .from('report_tokens')
    .insert({
      snapshot_id: snapshotId,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ReportTokenRow;
}

// ─── 6. verifyReportToken ─────────────────────────────────────────────────────
// Returns valid=false for missing, revoked, or expired tokens.
// Joins with snapshots to surface lead_id without a second query.

export async function verifyReportToken(
  token: string,
): Promise<{ valid: boolean; snapshotId?: string; leadId?: string }> {
  const { data, error } = await getClient()
    .from('report_tokens')
    .select('snapshot_id, expires_at, revoked, snapshots(lead_id)')
    .eq('token', token)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { valid: false };
  if (data.revoked) return { valid: false };
  if (new Date(data.expires_at) < new Date()) return { valid: false };

  // Supabase returns joined rows as an array even for FK relations
  const snapshots = data.snapshots as unknown as Array<{ lead_id: string }> | null;
  const leadId = Array.isArray(snapshots) ? snapshots[0]?.lead_id : undefined;
  return {
    valid: true,
    snapshotId: data.snapshot_id as string,
    leadId,
  };
}

// ─── 7. markTokenEmailVerified ────────────────────────────────────────────────
// Sets email_verified_at on the token row and email_verified=true on the lead
// (looked up via the snapshot). Two sequential writes — intentionally not atomic
// because partial failure is recoverable on retry.

export async function markTokenEmailVerified(token: string): Promise<void> {
  const db = getClient();
  const now = new Date().toISOString();

  const { data: tokenRow, error: tokenFetchError } = await db
    .from('report_tokens')
    .select('snapshot_id')
    .eq('token', token)
    .single();

  if (tokenFetchError) throw tokenFetchError;

  const { error: tokenUpdateError } = await db
    .from('report_tokens')
    .update({ email_verified_at: now })
    .eq('token', token);

  if (tokenUpdateError) throw tokenUpdateError;

  const { data: snapshot, error: snapshotError } = await db
    .from('snapshots')
    .select('lead_id')
    .eq('id', tokenRow.snapshot_id)
    .single();

  if (snapshotError) throw snapshotError;

  const { error: leadError } = await db
    .from('leads')
    .update({ email_verified: true })
    .eq('id', snapshot.lead_id);

  if (leadError) throw leadError;
}

// ─── 8. getSnapshotWithReport ─────────────────────────────────────────────────
// Returns the snapshot and its most recent report (by version DESC). The report
// may be null if generation is still in progress.

export async function getSnapshotWithReport(
  snapshotId: string,
): Promise<{ snapshot: SnapshotRow; report: ReportRow | null }> {
  const db = getClient();

  const { data: snapshot, error: snapshotError } = await db
    .from('snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single();

  if (snapshotError) throw snapshotError;

  const { data: report, error: reportError } = await db
    .from('reports')
    .select('*')
    .eq('snapshot_id', snapshotId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reportError) throw reportError;

  return { snapshot: snapshot as SnapshotRow, report: report as ReportRow | null };
}

// ─── 9. getUnlockEvent ────────────────────────────────────────────────────────
// Returns the first unlock event for a snapshot, or null if not yet unlocked.

export async function getUnlockEvent(snapshotId: string): Promise<UnlockEventRow | null> {
  const { data, error } = await getClient()
    .from('unlock_events')
    .select('*')
    .eq('snapshot_id', snapshotId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as UnlockEventRow | null;
}

// ─── 10. insertUnlockEvent ────────────────────────────────────────────────────

export async function insertUnlockEvent(
  fields: Omit<UnlockEventRow, 'id' | 'created_at'>,
): Promise<UnlockEventRow> {
  const { data, error } = await getClient()
    .from('unlock_events')
    .insert(fields)
    .select()
    .single();

  if (error) throw error;
  return data as UnlockEventRow;
}
