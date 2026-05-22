import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

interface FeedbackBody {
  leadId: string;
  platform: string;
  expectedResult: string;
  actualResult: string;
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: FeedbackBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.leadId || !body.platform || !body.actualResult?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const notifyEmail = process.env.MAXIFI_NOTIFY_EMAIL;
  if (!notifyEmail) {
    console.warn('[feedback] MAXIFI_NOTIFY_EMAIL not set — skipping notification');
    return NextResponse.json({ ok: true });
  }

  const fromEmail = process.env.FROM_EMAIL ?? 'hello@maxifidigital.com';

  const text = [
    `Discrepancy report — AI Visibility Snapshot`,
    ``,
    `── Details ───────────────────────────────────`,
    `Lead ID:          ${body.leadId}`,
    `Platform:         ${body.platform}`,
    ``,
    `── Prediction ────────────────────────────────`,
    body.expectedResult,
    ``,
    `── What user actually saw ────────────────────`,
    body.actualResult.trim(),
  ].join('\n');

  try {
    const { error } = await getResend().emails.send({
      from: fromEmail,
      to: notifyEmail,
      subject: `Discrepancy report — ${body.platform} | Lead ${body.leadId}`,
      text,
    });
    if (error) {
      console.error('[feedback] Resend error:', error);
    }
  } catch (err) {
    console.error('[feedback] Email send failed:', err);
  }

  return NextResponse.json({ ok: true });
}
