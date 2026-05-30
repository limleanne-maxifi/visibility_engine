// Stripe webhook — closes the payment-capture gap.
//
// Scope: record the paid order on aeo_leads and notify the owner. NO customer
// report generation, NO emails to the customer. Fulfillment stays manual.
//
// Event: checkout.session.completed (others are 200-ack'd and ignored).
//
// Auth: HMAC signature via Stripe-Signature header + STRIPE_WEBHOOK_SECRET.
//       Raw request body (req.text()) is REQUIRED — do not parse JSON first.
//
// Writes: uses the server-only service-role Supabase client (anon RLS has no
//         UPDATE policy on aeo_leads — see lib/supabase.ts and RESOLVED-7).

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { findLeadByEmail, recordPayment } from '@/lib/supabase';
import { sendPaidOrderNotification } from '@/lib/email';

// Node runtime — Stripe SDK uses Node crypto for signature verification.
export const runtime = 'nodejs';
// Belt-and-suspenders: webhooks are non-idempotent side-effect endpoints,
// never cache the response.
export const dynamic = 'force-dynamic';

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Read raw body BEFORE any parsing — required for signature verification.
  const rawBody = await req.text();
  const sig     = req.headers.get('stripe-signature');
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    console.error('[stripe-webhook] missing Stripe-Signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set in env');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // 2. Verify signature.
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  }

  // 3. Only handle checkout.session.completed. Ack everything else with 200.
  if (event.type !== 'checkout.session.completed') {
    console.log('[stripe-webhook] ignoring event type:', event.type, 'id:', event.id);
    return NextResponse.json({ received: true, handled: false }, { status: 200 });
  }

  const session         = event.data.object as Stripe.Checkout.Session;
  const customerEmail   = session.customer_details?.email ?? null;
  const stripeSessionId = session.id;
  const amount          = session.amount_total;
  const currency        = session.currency;
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  console.log('[stripe-webhook] checkout.session.completed:', {
    stripeSessionId,
    customerEmail,
    amount,
    currency,
  });

  // 4. No email on session → can't match a lead. Loud owner alert, 200.
  if (!customerEmail) {
    console.error('[stripe-webhook] paid-but-no-customer-email — sending owner alert', {
      stripeSessionId,
    });
    await safeNotifyOwner({
      customerEmail: '(no email on Stripe session)',
      amount,
      currency,
      stripeSessionId,
      paymentIntentId,
      matchedLead: null,
    });
    return NextResponse.json({ received: true, matched: false }, { status: 200 });
  }

  // 5. Look up the most recent lead by email. Service-role client (bypasses RLS).
  let matchedLead = null;
  try {
    matchedLead = await findLeadByEmail(customerEmail);
  } catch (err) {
    console.error('[stripe-webhook] lead lookup failed:', err);
    // Continue: still notify the owner. Treating lookup failure as "no match"
    // surfaces the issue without losing the payment record entirely.
  }

  // 6. If we matched, record the payment on the lead row. If the update fails,
  //    return 500 so Stripe retries — the payment HAS happened, we just couldn't
  //    record it locally yet. Owner notification fires either way.
  if (matchedLead) {
    try {
      await recordPayment(matchedLead.id, {
        stripeSessionId,
        amount,
        currency,
        paidAt: new Date().toISOString(),
      });
      console.log('[stripe-webhook] lead updated:', matchedLead.id);
    } catch (err) {
      console.error('[stripe-webhook] lead update failed (Stripe will retry):', err);
      await safeNotifyOwner({
        customerEmail,
        amount,
        currency,
        stripeSessionId,
        paymentIntentId,
        matchedLead,
      });
      return NextResponse.json({ error: 'Lead update failed' }, { status: 500 });
    }
  } else {
    console.error('[stripe-webhook] paid-but-no-lead — sending owner alert', {
      stripeSessionId,
      customerEmail,
    });
  }

  // 7. Owner notification (matched or orphan). Failure is logged, not surfaced —
  //    the payment is already recorded in the DB on the matched path; we don't
  //    want Stripe to retry the whole flow just because Resend was slow.
  await safeNotifyOwner({
    customerEmail,
    amount,
    currency,
    stripeSessionId,
    paymentIntentId,
    matchedLead,
  });

  return NextResponse.json({ received: true, matched: !!matchedLead }, { status: 200 });
}

// Wrapper: notification failure must not propagate. Stripe retries on non-2xx;
// a flaky Resend call should not cause the whole event to retry.
async function safeNotifyOwner(
  payload: Parameters<typeof sendPaidOrderNotification>[0],
): Promise<void> {
  try {
    await sendPaidOrderNotification(payload);
  } catch (err) {
    console.error('[stripe-webhook] owner notification failed (logged, not surfaced):', err);
  }
}
