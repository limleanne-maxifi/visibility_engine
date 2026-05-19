import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { withRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { GateResendSchema } from '@/lib/validation';
import {
  getActiveTokensForEmail,
  revokeTokensForSnapshots,
  insertReportToken,
} from '@/lib/supabase-v2';
import { sendMagicLinkEmail } from '@/app/api/gate/route';

function emailHashKey(email: string): string {
  return `gate_resend:${createHash('sha256').update(email.toLowerCase()).digest('hex')}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const parsed = GateResendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { email } = parsed.data;

  // ── Rate limit: 2/hr per email hash ────────────────────────────────────────
  const limited = await withRateLimit(
    req,
    RATE_LIMITS.gateResend.limit,
    RATE_LIMITS.gateResend.windowSeconds,
    () => emailHashKey(email),
  );
  if (limited) return limited;

  // ── Find existing active tokens ─────────────────────────────────────────────
  let activeTokens: Awaited<ReturnType<typeof getActiveTokensForEmail>>;
  try {
    activeTokens = await getActiveTokensForEmail(email);
  } catch (err) {
    console.error('[gate/resend] getActiveTokensForEmail error:', err);
    return NextResponse.json({ error: 'Internal error', code: 'SERVER_ERROR' }, { status: 502 });
  }

  if (!activeTokens.length) {
    return NextResponse.json(
      { error: 'No active snapshot found for this email', code: 'NOT_FOUND' },
      { status: 404 },
    );
  }

  // Most recent token carries the snapshot_id to re-issue for
  const latestToken = activeTokens[0];
  const snapshotIds = [...new Set(activeTokens.map((t) => t.snapshot_id))];

  // ── Revoke all existing tokens for those snapshots ─────────────────────────
  try {
    console.log('[gate/resend] revoking', activeTokens.length, 'token(s) for', snapshotIds.length, 'snapshot(s)');
    await revokeTokensForSnapshots(snapshotIds);
  } catch (err) {
    console.error('[gate/resend] revokeTokensForSnapshots error:', err);
    return NextResponse.json({ error: 'Internal error', code: 'SERVER_ERROR' }, { status: 502 });
  }

  // ── Issue new token for the most recent snapshot ───────────────────────────
  let newToken: Awaited<ReturnType<typeof insertReportToken>>;
  try {
    console.log('[gate/resend] inserting new token for snapshot_id:', latestToken.snapshot_id);
    newToken = await insertReportToken(latestToken.snapshot_id);
  } catch (err) {
    console.error('[gate/resend] insertReportToken error:', err);
    return NextResponse.json({ error: 'Internal error', code: 'SERVER_ERROR' }, { status: 502 });
  }

  // ── Send email ─────────────────────────────────────────────────────────────
  try {
    await sendMagicLinkEmail(email, newToken.token, latestToken.snapshot_id);
    console.log('[gate/resend] magic link sent for snapshot_id:', latestToken.snapshot_id);
  } catch (err) {
    console.error('[gate/resend] sendMagicLinkEmail error:', err);
    // Token persisted — return 202 so user can try again via UI
  }

  return NextResponse.json({ status: 'sent' }, { status: 202 });
}
