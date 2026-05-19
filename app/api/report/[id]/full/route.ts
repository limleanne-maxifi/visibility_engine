import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { verifyReportToken, getUnlockEvent, getSnapshotWithReport } from '@/lib/supabase-v2';
import type { FullReportSections } from '@/lib/types-v2';

const SESSION_COOKIE = '__Host-rv_session';

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function parseCookie(raw: string): { snapshotId: string; token: string } | null {
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf-8');
    const sep = decoded.indexOf(':');
    if (sep === -1) return null;
    const snapshotId = decoded.slice(0, sep);
    const token      = decoded.slice(sep + 1);
    if (!snapshotId || !token) return null;
    return { snapshotId, token };
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // ── Read session cookie first — token drives the rate limit key ───────────────
  const rawCookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!rawCookie) {
    return NextResponse.json({ error: 'No session', code: 'NO_SESSION' }, { status: 401 });
  }

  const session = parseCookie(rawCookie);
  if (!session) {
    return NextResponse.json({ error: 'Invalid session', code: 'NO_SESSION' }, { status: 401 });
  }

  // ── Rate limit: 60/hr per token ───────────────────────────────────────────────
  const limited = await withRateLimit(
    req,
    RATE_LIMITS.reportFull.limit,
    RATE_LIMITS.reportFull.windowSeconds,
    () => `report_full:${session.token}`,
  );
  if (limited) return limited;

  const { id: snapshotId } = await params;

  // ── Snapshot ID must match cookie ─────────────────────────────────────────────
  if (session.snapshotId !== snapshotId) {
    return NextResponse.json(
      { error: 'Snapshot mismatch', code: 'SNAPSHOT_MISMATCH' },
      { status: 403 },
    );
  }

  // ── Token validity + email verification ───────────────────────────────────────
  let tokenResult: Awaited<ReturnType<typeof verifyReportToken>>;
  try {
    tokenResult = await verifyReportToken(session.token);
  } catch (err) {
    console.error('[report/full] verifyReportToken error:', err);
    return NextResponse.json(
      { error: 'Internal error', code: 'SERVER_ERROR' },
      { status: 502 },
    );
  }

  if (!tokenResult.valid) {
    return NextResponse.json(
      { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
      { status: 401 },
    );
  }

  if (!tokenResult.emailVerifiedAt) {
    return NextResponse.json(
      { error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' },
      { status: 403 },
    );
  }

  // ── Unlock check ──────────────────────────────────────────────────────────────
  let unlockEvent: Awaited<ReturnType<typeof getUnlockEvent>>;
  try {
    unlockEvent = await getUnlockEvent(snapshotId);
  } catch (err) {
    console.error('[report/full] getUnlockEvent error:', err);
    return NextResponse.json(
      { error: 'Internal error', code: 'SERVER_ERROR' },
      { status: 502 },
    );
  }

  if (!unlockEvent) {
    const checkoutUrl =
      process.env.REPORT_CHECKOUT_URL ??
      process.env.CALENDLY_URL ??
      '';
    return NextResponse.json(
      { code: 'PAYMENT_REQUIRED', checkout_url: checkoutUrl },
      { status: 403 },
    );
  }

  // ── Fetch report ──────────────────────────────────────────────────────────────
  let report: Awaited<ReturnType<typeof getSnapshotWithReport>>['report'];
  try {
    ({ report } = await getSnapshotWithReport(snapshotId));
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Snapshot not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    console.error('[report/full] getSnapshotWithReport error:', err);
    return NextResponse.json(
      { error: 'Internal error', code: 'SERVER_ERROR' },
      { status: 502 },
    );
  }

  // Full sections not yet generated
  if (!report || report.competitor_displacement === null) {
    return NextResponse.json({ status: 'generating' }, { status: 202 });
  }

  const sections: FullReportSections = {
    competitor_displacement: report.competitor_displacement!,
    positioning_gap:         report.positioning_gap!,
    query_gap:               report.query_gap!,
    action_queue:            report.action_queue!,
  };

  return NextResponse.json(
    { snapshot_id: snapshotId, sections },
    { status: 200 },
  );
}
