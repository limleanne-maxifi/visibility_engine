import { NextRequest, NextResponse } from 'next/server';
import { GenerateSchema } from '@/lib/validation';
import { withRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import {
  upsertLead,
  insertSnapshot,
  insertFreeReport,
  insertReportToken,
} from '@/lib/supabase-v2';
import { generateFreeReport } from '@/lib/reportGenerator';
import { sendUserPlanEmail, sendInternalNotification } from '@/lib/email';
import type { AeoLeadRow } from '@/lib/supabase';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const t0 = Date.now();

  // ── 1. Content-Type guard ────────────────────────────────────────────────────
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json', code: 'UNSUPPORTED_MEDIA_TYPE' },
      { status: 415 },
    );
  }

  // ── 2. Origin guard ──────────────────────────────────────────────────────────
  // Reject only when Origin is present AND mismatches — allows curl / server-to-server.
  const origin = req.headers.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (origin && appUrl && origin !== appUrl) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 },
    );
  }

  // ── 3. Rate limit ────────────────────────────────────────────────────────────
  const limited = await withRateLimit(
    req,
    RATE_LIMITS.generate.limit,
    RATE_LIMITS.generate.windowSeconds,
    (r) =>
      r.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      r.headers.get('x-real-ip') ??
      'unknown',
  );
  if (limited) return limited;

  // ── 4. Parse + validate body ─────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  console.log('[generate/v2] step: validated —', {
    occupation: input.occupation,
    industry: input.industry,
    aiPresence: input.aiPresence,
    platformCount: input.platforms.length,
    primaryPlatform: input.platforms.find((p) => p.priority === 'primary')?.value ?? 'none',
    hasCompetitors: Boolean(input.competitors),
    hasPositioning: Boolean(input.positioning),
    hasTargetQueries: Boolean(input.targetQueries),
  });

  try {
    // ── 5. Upsert lead ─────────────────────────────────────────────────────────
    console.log('[generate/v2] step: upsert lead');
    const leadRow = await upsertLead(input.email, input.firstName);
    console.log('[generate/v2] step: lead id =', leadRow.id);

    // ── 6. Insert snapshot ─────────────────────────────────────────────────────
    console.log('[generate/v2] step: insert snapshot');
    const primaryPlatform   = input.platforms.find((p) => p.priority === 'primary')?.value  ?? '';
    const secondaryPlatform = input.platforms.find((p) => p.priority === 'secondary')?.value ?? null;

    const snapshotRow = await insertSnapshot(leadRow.id, {
      occupation:     input.occupation,
      industry:       input.industry,
      company_name:   input.company      ?? null,
      website_url:    input.websiteUrl   || null,
      awareness:      input.aiPresence,
      platform:       primaryPlatform,
      platform_other: secondaryPlatform,
      challenges:     input.challenges,
      aeo_outcome:    input.aeoOutcome,
      competitors:    input.competitors  ?? null,
      positioning:    input.positioning  ?? null,
      target_queries: input.targetQueries ?? null,
      session_id:     null,
    });
    console.log('[generate/v2] step: snapshot id =', snapshotRow.id);

    // ── 7. Generate free sections (deterministic, no Claude call) ──────────────
    console.log('[generate/v2] step: generate free report');
    const freeSections = await generateFreeReport(snapshotRow);

    // ── 8. Persist free report ─────────────────────────────────────────────────
    console.log('[generate/v2] step: insert free report');
    const reportRow = await insertFreeReport(snapshotRow.id, freeSections, {
      generation_ms: Date.now() - t0,
    });
    console.log('[generate/v2] step: report id =', reportRow.id);

    // ── 9. Issue report token ──────────────────────────────────────────────────
    console.log('[generate/v2] step: insert report token');
    const tokenRow = await insertReportToken(snapshotRow.id);

    // ── 10. Fire-and-forget emails ─────────────────────────────────────────────
    // Construct a v1-compatible AeoLeadRow shim so the existing email functions
    // can be kept unchanged. plan_steps and plan_quick_win are empty — the v2
    // email template will replace these in a later prompt.
    const legacyLead: AeoLeadRow = {
      id:             leadRow.id,
      created_at:     snapshotRow.created_at,
      first_name:     leadRow.first_name,
      email:          leadRow.email,
      website:        snapshotRow.website_url      ?? null,
      occupation:     snapshotRow.occupation,
      industry:       snapshotRow.industry,
      company_name:   snapshotRow.company_name     ?? null,
      awareness:      snapshotRow.awareness,
      platform:       snapshotRow.platform,
      platform_other: snapshotRow.platform_other   ?? null,
      challenge:      snapshotRow.challenges?.join('; ') ?? '',
      outcome:        snapshotRow.aeo_outcome       ?? '',
      utm_source:     leadRow.utm_source            ?? null,
      utm_medium:     leadRow.utm_medium            ?? null,
      utm_campaign:   leadRow.utm_campaign          ?? null,
      plan_steps:     [],
      plan_quick_win: '',
      session_id:     snapshotRow.session_id        ?? null,
      competitors:    snapshotRow.competitors       ?? null,
      positioning:    snapshotRow.positioning       ?? null,
      target_queries: snapshotRow.target_queries    ?? null,
    };

    Promise.allSettled([
      sendUserPlanEmail(legacyLead),
      sendInternalNotification(legacyLead),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(
            `[generate/v2] email ${i === 0 ? 'user' : 'internal'} failed:`,
            r.reason,
          );
        }
      });
    });

    // ── 11. Return ─────────────────────────────────────────────────────────────
    const latencyMs = Date.now() - t0;
    console.log('[generate/v2] step: done —', {
      snapshot_id: snapshotRow.id,
      report_id:   reportRow.id,
      latency_ms:  latencyMs,
    });

    return NextResponse.json(
      {
        snapshot_id: snapshotRow.id,
        token:       tokenRow.token,
        report:      freeSections,
      },
      { status: 200 },
    );
  } catch (err) {
    const latencyMs = Date.now() - t0;
    console.error('[generate/v2] unhandled error — latency_ms:', latencyMs, err);
    return NextResponse.json(
      { error: 'Internal error', code: 'SERVER_ERROR' },
      { status: 502 },
    );
  }
}
