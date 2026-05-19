import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimit';
import { getSnapshotWithReport, getUnlockEvent } from '@/lib/supabase-v2';
import type { FreeReportSections } from '@/lib/types-v2';

function ipKey(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // ── Rate limit: 120/hr per IP ────────────────────────────────────────────────
  // (not in the system-design §5.2 named table — inline constants used)
  const limited = await withRateLimit(req, 120, 3600, ipKey);
  if (limited) return limited;

  const { id: snapshotId } = await params;

  // ── Fetch snapshot + report ──────────────────────────────────────────────────
  let snapshot: Awaited<ReturnType<typeof getSnapshotWithReport>>['snapshot'];
  let report:   Awaited<ReturnType<typeof getSnapshotWithReport>>['report'];

  try {
    ({ snapshot, report } = await getSnapshotWithReport(snapshotId));
  } catch (err: unknown) {
    // PGRST116 = row not found (Supabase PostgREST code)
    if ((err as { code?: string })?.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Snapshot not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    console.error('[report/free] getSnapshotWithReport error:', err);
    return NextResponse.json(
      { error: 'Internal error', code: 'SERVER_ERROR' },
      { status: 502 },
    );
  }

  // ── Report still generating ──────────────────────────────────────────────────
  if (!report || report.citation_snapshot === null) {
    return NextResponse.json({ status: 'generating' }, { status: 202 });
  }

  // ── Unlock check ─────────────────────────────────────────────────────────────
  let isUnlocked = false;
  try {
    const unlockEvent = await getUnlockEvent(snapshotId);
    isUnlocked = unlockEvent !== null;
  } catch (err) {
    // Non-fatal — free sections are still serveable without unlock state
    console.error('[report/free] getUnlockEvent error (non-fatal):', err);
  }

  // ── Build free sections from report row ──────────────────────────────────────
  const sections: FreeReportSections = {
    citation_snapshot:      report.citation_snapshot!,
    failure_mode_diagnosis: report.failure_mode_diagnosis!,
    platform_visibility:    report.platform_visibility!,
    benchmark_comparison:   report.benchmark_comparison!,
  };

  return NextResponse.json(
    { snapshot_id: snapshotId, sections, is_unlocked: isUnlocked },
    { status: 200 },
  );
}
