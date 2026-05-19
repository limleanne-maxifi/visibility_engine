import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { withRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { CheckoutSchema } from '@/lib/validation';
import { verifyReportToken, getUnlockEvent } from '@/lib/supabase-v2';

// ─── Stripe singleton ─────────────────────────────────────────────────────────

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

// ─── Cookie helpers (mirrors /api/report/[id]/full) ───────────────────────────

const SESSION_COOKIE = '__Host-rv_session';

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

function ipKey(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

// ─── POST /api/stripe/checkout ────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Session auth (same steps as /api/report/[id]/full 2-5) ────────────────
  const rawCookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!rawCookie) {
    return NextResponse.json({ error: 'No session', code: 'NO_SESSION' }, { status: 401 });
  }

  const session = parseCookie(rawCookie);
  if (!session) {
    return NextResponse.json({ error: 'Invalid session', code: 'NO_SESSION' }, { status: 401 });
  }

  let tokenResult: Awaited<ReturnType<typeof verifyReportToken>>;
  try {
    tokenResult = await verifyReportToken(session.token);
  } catch (err) {
    console.error('[stripe/checkout] verifyReportToken error:', err);
    return NextResponse.json({ error: 'Internal error', code: 'SERVER_ERROR' }, { status: 502 });
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
      { status: 401 },
    );
  }

  // ── 2. Rate limit: 5/hr per IP ────────────────────────────────────────────────
  const limited = await withRateLimit(
    req,
    RATE_LIMITS.stripeCheckout.limit,
    RATE_LIMITS.stripeCheckout.windowSeconds,
    ipKey,
  );
  if (limited) return limited;

  // ── 3. Parse + validate body ─────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { snapshot_id } = parsed.data;

  // ── 4. Idempotency: reject if already unlocked ────────────────────────────────
  let alreadyUnlocked: Awaited<ReturnType<typeof getUnlockEvent>>;
  try {
    alreadyUnlocked = await getUnlockEvent(snapshot_id);
  } catch (err) {
    console.error('[stripe/checkout] getUnlockEvent error:', err);
    return NextResponse.json({ error: 'Internal error', code: 'SERVER_ERROR' }, { status: 502 });
  }

  if (alreadyUnlocked) {
    return NextResponse.json({ code: 'ALREADY_UNLOCKED' }, { status: 409 });
  }

  // ── 5. Create Stripe Checkout Session ────────────────────────────────────────
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const priceCents   = parseInt(process.env.REPORT_PRICE_CENTS ?? '29900', 10);
  const reportPath   = `/report/${snapshot_id}`;

  let stripeSession: Stripe.Checkout.Session;
  try {
    stripeSession = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sgd',
            unit_amount: priceCents,
            product_data: {
              name: 'AI Visibility Report',
              description:
                'Full AI Visibility Report — competitor displacement analysis, ' +
                'positioning gap, query gap, and 60-day action queue.',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}${reportPath}?unlocked=true`,
      cancel_url:  `${appUrl}${reportPath}`,
      metadata: {
        snapshot_id,
        token: session.token,
      },
      client_reference_id: snapshot_id,
    });
  } catch (err) {
    console.error('[stripe/checkout] Stripe session creation error:', err);
    return NextResponse.json({ error: 'Internal error', code: 'SERVER_ERROR' }, { status: 502 });
  }

  console.log('[stripe/checkout] session created — snapshot_id:', snapshot_id, '| stripe_session_id:', stripeSession.id);

  // ── 6. Return checkout URL ────────────────────────────────────────────────────
  return NextResponse.json({ checkout_url: stripeSession.url }, { status: 200 });
}
