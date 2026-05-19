import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { withRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { GateSchema, sanitiseText } from '@/lib/validation';
import {
  upsertLead,
  getActiveTokenForSnapshot,
  insertReportToken,
} from '@/lib/supabase-v2';

// ─── CSRF guards (shared with /api/generate) ──────────────────────────────────

function rejectBadContentType(req: NextRequest): NextResponse | null {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json', code: 'UNSUPPORTED_MEDIA_TYPE' },
      { status: 415 },
    );
  }
  return null;
}

function rejectBadOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (origin && appUrl && origin !== appUrl) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  return null;
}

function ipKey(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

// ─── Magic link email ─────────────────────────────────────────────────────────

export async function sendMagicLinkEmail(
  to: string,
  token: string,
  snapshotId: string,
): Promise<void> {
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const fromEmail = process.env.FROM_EMAIL ?? 'hello@maxifidigital.com';
  const verifyUrl = `${appUrl}/api/token/verify?token=${token}`;
  const privacyUrl = `${appUrl}/privacy`;
  const logoUrl   = `${appUrl}/maxifi-logo-black.png`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;padding:40px 40px 32px;">

  <!-- Logo -->
  <tr><td style="padding-bottom:28px;text-align:center;">
    <img src="${logoUrl}" alt="Maxifi Digital" style="height:28px;width:auto;" />
  </td></tr>

  <!-- Headline -->
  <tr><td style="padding-bottom:8px;">
    <p style="margin:0;font-size:11px;font-weight:600;color:#C87A2F;letter-spacing:0.08em;text-transform:uppercase;">
      AI Visibility Snapshot
    </p>
  </td></tr>
  <tr><td style="padding-bottom:20px;">
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;line-height:1.4;">
      Your AI Visibility Snapshot is ready — click to view your report.
    </h1>
  </td></tr>
  <tr><td style="padding-bottom:28px;">
    <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
      Click the button below to open your full AI Visibility Snapshot.
      This link expires in 90&nbsp;days. You can request a new one at any time.
    </p>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding-bottom:32px;">
    <a href="${verifyUrl}"
       style="display:inline-block;background:#C87A2F;color:#ffffff;font-size:15px;
              font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;">
      View My Report &rarr;
    </a>
  </td></tr>

  <!-- Fallback URL -->
  <tr><td style="padding-bottom:32px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;word-break:break-all;">
      If the button doesn&rsquo;t work, copy this link into your browser:<br/>
      <a href="${verifyUrl}" style="color:#C87A2F;">${verifyUrl}</a>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="border-top:1px solid #e5e7eb;padding-top:20px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
      Maxifi Digital &middot; Singapore &middot;
      <a href="${privacyUrl}" style="color:#9ca3af;text-decoration:underline;">Privacy policy</a>
      &middot;
      <a href="mailto:${fromEmail}?subject=Unsubscribe" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: 'Your AI Visibility Snapshot — click to view',
    html,
  });
  if (error) throw new Error(`Resend magic link error: ${JSON.stringify(error)}`);
}

// ─── POST /api/gate ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const guard = rejectBadContentType(req) ?? rejectBadOrigin(req);
  if (guard) return guard;

  const limited = await withRateLimit(
    req,
    RATE_LIMITS.gate.limit,
    RATE_LIMITS.gate.windowSeconds,
    ipKey,
  );
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const parsed = GateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { snapshot_id } = parsed.data;
  const email = sanitiseText(parsed.data.email);

  console.log('[gate] step: upsert lead — snapshot_id:', snapshot_id);
  let leadRow: Awaited<ReturnType<typeof upsertLead>>;
  try {
    // Empty firstName: gate doesn't know the name; upsertLead skips update when empty
    leadRow = await upsertLead(email, '');
  } catch (err) {
    console.error('[gate] upsertLead error:', err);
    return NextResponse.json({ error: 'Internal error', code: 'SERVER_ERROR' }, { status: 502 });
  }

  // Check for an existing active token
  let existingToken: Awaited<ReturnType<typeof getActiveTokenForSnapshot>>;
  try {
    existingToken = await getActiveTokenForSnapshot(snapshot_id);
  } catch (err) {
    console.error('[gate] getActiveTokenForSnapshot error:', err);
    return NextResponse.json({ error: 'Internal error', code: 'SERVER_ERROR' }, { status: 502 });
  }

  if (existingToken) {
    if (existingToken.email_verified_at) {
      // Already clicked the link — no need to re-send
      console.log('[gate] already verified — snapshot_id:', snapshot_id);
      return NextResponse.json({ status: 'already_verified' }, { status: 200 });
    }
    // Token exists but not yet verified — re-send the same token
    console.log('[gate] re-sending existing token — snapshot_id:', snapshot_id);
    try {
      await sendMagicLinkEmail(email, existingToken.token, snapshot_id);
    } catch (err) {
      console.error('[gate] sendMagicLinkEmail (resend existing) error:', err);
      // Non-fatal: return 202 so the UI still shows "check your email"
    }
    return NextResponse.json({ status: 'sent' }, { status: 202 });
  }

  // No active token — issue a new one
  let tokenRow: Awaited<ReturnType<typeof insertReportToken>>;
  try {
    console.log('[gate] step: insert report token — snapshot_id:', snapshot_id);
    tokenRow = await insertReportToken(snapshot_id);
  } catch (err) {
    console.error('[gate] insertReportToken error:', err);
    return NextResponse.json({ error: 'Internal error', code: 'SERVER_ERROR' }, { status: 502 });
  }

  try {
    console.log('[gate] step: send magic link email — lead_id:', leadRow.id);
    await sendMagicLinkEmail(email, tokenRow.token, snapshot_id);
  } catch (err) {
    console.error('[gate] sendMagicLinkEmail error:', err);
    // Token is persisted — return 202 so user can request a resend if email doesn't arrive
  }

  return NextResponse.json({ status: 'sent' }, { status: 202 });
}
