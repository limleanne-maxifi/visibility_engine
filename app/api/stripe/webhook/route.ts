import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  verifyReportToken,
  getSnapshotWithReport,
  insertUnlockEvent,
  updateReportWithFullSections,
} from '@/lib/supabase-v2';
import { generateFullReport } from '@/lib/reportGenerator';
import type { FreeReportSections } from '@/lib/types-v2';

// ─── Stripe singleton ─────────────────────────────────────────────────────────

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

// ─── Disable Next.js body parsing — we need the raw Buffer for sig verification

export const config = { api: { bodyParser: false } };

// ─── POST /api/stripe/webhook ─────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Read raw body (required for Stripe signature verification) ─────────────
  const rawBody = Buffer.from(await req.arrayBuffer());

  // ── 2. Verify Stripe signature ────────────────────────────────────────────────
  const sig = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── 3. Only handle checkout.session.completed ─────────────────────────────────
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const stripeSession = event.data.object as Stripe.Checkout.Session;

  // ── 4. Extract metadata ────────────────────────────────────────────────────────
  const snapshotId = stripeSession.metadata?.snapshot_id;
  const token      = stripeSession.metadata?.token;

  if (!snapshotId || !token) {
    console.error('[webhook] missing metadata — snapshot_id or token absent');
    // Return 200 so Stripe does not retry indefinitely for a data error
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log('[webhook] checkout.session.completed — snapshot_id:', snapshotId, '| stripe_session_id:', stripeSession.id);

  // ── 5. Insert unlock_event ─────────────────────────────────────────────────────
  // Derive report_id and lead_id before inserting.
  let reportId: string;
  let leadId:   string;
  let snapshot: Awaited<ReturnType<typeof getSnapshotWithReport>>['snapshot'];
  let report:   Awaited<ReturnType<typeof getSnapshotWithReport>>['report'];

  try {
    ({ snapshot, report } = await getSnapshotWithReport(snapshotId));
    if (!report) {
      console.error('[webhook] report row not found for snapshot_id:', snapshotId);
      return NextResponse.json({ received: true }, { status: 200 });
    }
    reportId = report.id;

    const tokenResult = await verifyReportToken(token);
    if (!tokenResult.valid || !tokenResult.leadId) {
      console.error('[webhook] token invalid or lead_id missing — snapshot_id:', snapshotId);
      return NextResponse.json({ received: true }, { status: 200 });
    }
    leadId = tokenResult.leadId;
  } catch (err) {
    console.error('[webhook] pre-insert lookup error:', err);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    await insertUnlockEvent({
      report_id:         reportId,
      snapshot_id:       snapshotId,
      lead_id:           leadId,
      method:            'stripe',
      stripe_session_id: stripeSession.id,
      stripe_payment_id: typeof stripeSession.payment_intent === 'string'
        ? stripeSession.payment_intent
        : null,
      amount_cents:  stripeSession.amount_total,
      currency:      stripeSession.currency ?? 'sgd',
      coupon_code:   null,
    });
    console.log('[webhook] unlock_event inserted — snapshot_id:', snapshotId, '| lead_id:', leadId);
  } catch (err) {
    console.error('[webhook] insertUnlockEvent error:', err);
    // Return 200 — Stripe retries would duplicate the unlock_event.
    // Idempotency is handled at the unlock_events query level in the report route.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── 6. Trigger full report generation (fire-and-forget) ────────────────────────
  // Respond to Stripe immediately; generation runs in the background.
  // /api/report/[id]/full returns 202 { status: 'generating' } until done.
  const freeSections: FreeReportSections = {
    citation_snapshot:      report.citation_snapshot!,
    failure_mode_diagnosis: report.failure_mode_diagnosis!,
    platform_visibility:    report.platform_visibility!,
    benchmark_comparison:   report.benchmark_comparison!,
  };

  generateFullReport(snapshot, freeSections)
    .then((fullSections) => updateReportWithFullSections(reportId, fullSections))
    .then(() => console.log('[webhook] full report generated — snapshot_id:', snapshotId))
    .catch((err) => console.error('[webhook] full report generation failed:', err));

  // ── 7. Acknowledge to Stripe ───────────────────────────────────────────────────
  return NextResponse.json({ received: true }, { status: 200 });
}
