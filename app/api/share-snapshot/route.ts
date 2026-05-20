import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  let body: { email: string; snapshotUrl: string; firstName: string; company: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { email, snapshotUrl, firstName, company } = body;

  if (!email || !snapshotUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const fromEmail = process.env.FROM_EMAIL ?? 'hello@maxifidigital.com';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px 48px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Logo -->
  <tr><td style="padding-bottom:28px;">
    <img src="https://visibilityview.netlify.app/maxifi-logo-black.png" alt="Maxifi Digital" style="display:block;width:120px;height:auto;" />
  </td></tr>

  <!-- Label -->
  <tr><td style="padding-bottom:8px;">
    <p style="margin:0;font-size:11px;font-weight:600;color:#6B5DD3;letter-spacing:0.08em;text-transform:uppercase;">
      AI Visibility Snapshot
    </p>
  </td></tr>

  <!-- Headline -->
  <tr><td style="padding-bottom:6px;">
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">
      ${firstName ? `${firstName}'s` : 'Your'} AI Visibility Snapshot is ready
    </h1>
  </td></tr>
  <tr><td style="padding-bottom:28px;">
    <p style="margin:0;font-size:14px;color:#6b7280;">${company || 'Your organisation'}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding-bottom:28px;">
    <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
      Your AI Visibility Snapshot has been shared with you. It includes your AI citation score,
      a breakdown of the gaps affecting your visibility, and three ways to close them.
    </p>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding-bottom:32px;">
    <a href="${snapshotUrl}"
       style="display:inline-block;background:#6B5DD3;color:#ffffff;font-size:15px;font-weight:700;
              text-decoration:none;padding:14px 28px;border-radius:10px;">
      View My Snapshot &rarr;
    </a>
  </td></tr>

  <!-- Note -->
  <tr><td style="padding-bottom:32px;">
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
      This link is persistent — you can bookmark it or return to it at any time.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="border-top:1px solid #e5e7eb;padding-top:20px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
      Maxifi Digital &middot; Singapore &middot;
      <a href="mailto:hello@maxifidigital.com" style="color:#9ca3af;text-decoration:underline;">hello@maxifidigital.com</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const { error } = await getResend().emails.send({
    from: fromEmail,
    to: email,
    subject: `Your AI Visibility Snapshot${company ? ` — ${company}` : ''}`,
    html,
  });

  if (error) {
    console.error('[share-snapshot] Resend error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
