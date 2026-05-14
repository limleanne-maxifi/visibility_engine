import { Resend } from 'resend';
import type { AeoLeadRow } from '@/lib/supabase';

const resend      = new Resend(process.env.RESEND_API_KEY);
const CALENDLY    = process.env.CALENDLY_URL ?? 'https://maxifidigital.com';
const REPORT_URL  = process.env.REPORT_CHECKOUT_URL ?? CALENDLY;
const MONITOR_URL = process.env.MONITOR_CHECKOUT_URL ?? CALENDLY;

// ─── Score helpers ────────────────────────────────────────────────────────────

function getScore(awareness: string): number {
  const map: Record<string, number> = {
    "No, I haven't tried this yet":                    0,
    'Yes — and the results were accurate':             72,
    "Yes — but I wasn't mentioned at all":              8,
    'Yes — but details about me were wrong':           24,
    'Yes — competitors were cited instead of me':      17,
    'Yes — but old/outdated info appeared':            31,
  };
  return map[awareness] ?? 0;
}

function getFailureLabel(awareness: string): string {
  switch (awareness) {
    case "Yes — but I wasn't mentioned at all":         return 'INVISIBILITY';
    case 'Yes — but details about me were wrong':       return 'HALLUCINATION';
    case 'Yes — competitors were cited instead of me':  return 'DISPLACEMENT';
    case 'Yes — but old/outdated info appeared':        return 'STALENESS';
    default:                                             return 'UNDIAGNOSED';
  }
}

const BENCHMARKS: Record<string, number> = {
  'Financial Services & Banking': 47, 'Fintech / Financial Technology': 47,
  'Accounting & Finance': 47,         'Legal': 62,
  'Professional Services': 54,        'Consulting & Advisory': 54,
  'Healthcare & Life Sciences': 78,   'B2B SaaS / Enterprise Software': 84,
  'AI & Machine Learning': 84,        'Cybersecurity': 84,
  'Cloud Infrastructure': 84,         'Marketing Technology': 63,
  'Aviation & Aerospace': 41,         'Defense': 41,
  'Education & Training': 52,         'Media & Publishing': 58,
  'Real Estate & Property': 35,       'Retail & E-commerce': 48,
  'Hospitality & Travel': 42,         'Manufacturing & Industrial': 38,
};

function getPercentile(score: number, industry: string): number {
  const avg = BENCHMARKS[industry] ?? 38;
  if (score === 0) return 8;
  if (score >= avg) return Math.min(95, Math.round(50 + ((score - avg) / (100 - avg)) * 45));
  return Math.max(5, Math.round((score / avg) * 45));
}

// ─── Email 1: User snapshot email ────────────────────────────────────────────

export async function sendUserPlanEmail(lead: AeoLeadRow): Promise<void> {
  const fromEmail  = process.env.FROM_EMAIL ?? 'hello@maxifidigital.com';
  const score      = getScore(lead.awareness);
  const failLabel  = getFailureLabel(lead.awareness);
  const percentile = getPercentile(score, lead.industry);
  const entity     = lead.company_name ?? lead.first_name;
  const challenges = lead.challenge.split(';').map((c) => c.trim()).filter(Boolean);
  const displaced  = challenges.some((c) => c.includes('My competitors show up'));
  const topicGoal  = challenges.some((c) => c.includes('specific topics'));
  const queryCount = topicGoal ? 4 : 3;

  const scoreDisplay = score > 0 ? `${score}%` : '—';
  const subject      = `Your AEO Visibility Snapshot — ${entity} is at ${score > 0 ? `${score}%` : 'an undiagnosed'} visibility`;

  const benchmarkLine = score > 0
    ? `You are in the <strong>${percentile}th percentile</strong> for ${lead.industry || 'your industry'}.
       ${percentile < 33 ? 'Significantly below average for your vertical.' : percentile < 60 ? 'Below average for your vertical.' : 'At or above average for your vertical.'}`
    : `Your AI visibility baseline is undiagnosed. Search for ${entity} in ChatGPT or Perplexity to see where you stand.`;

  const competitorSection = displaced ? `
    <tr><td style="padding-bottom:20px;">
      <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
        A competitor is being cited instead of you on
        <strong>${queryCount} of your priority queries</strong>.
        Your full report names them, lists every query they win, and shows the structural reason they beat you.
      </p>
    </td></tr>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Brand header -->
  <tr><td style="padding-bottom:24px;">
    <p style="margin:0;font-size:12px;font-weight:600;color:#6B5DD3;letter-spacing:0.08em;text-transform:uppercase;">
      Maxifi Digital · AEO Visibility Snapshot
    </p>
  </td></tr>

  <!-- Headline -->
  <tr><td style="padding-bottom:6px;">
    <h1 style="margin:0;font-size:26px;font-weight:700;color:#111827;line-height:1.3;">
      Hi ${lead.first_name}, here&rsquo;s your AEO Visibility Snapshot for ${entity}.
    </h1>
  </td></tr>
  <tr><td style="padding-bottom:28px;">
    <p style="margin:0;font-size:14px;color:#6b7280;">${lead.occupation} &middot; ${lead.industry}</p>
  </td></tr>

  <!-- Score + failure mode -->
  <tr><td style="padding-bottom:20px;">
    <div style="background:#f3f4f6;border-radius:12px;padding:24px 28px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">
        Your AI Visibility Score
      </p>
      <p style="margin:0 0 12px;font-size:56px;font-weight:700;color:#111827;line-height:1.1;">
        ${scoreDisplay}
      </p>
      <div style="display:inline-block;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:2px 8px;margin-bottom:10px;">
        <span style="font-size:11px;font-weight:700;color:#dc2626;letter-spacing:0.05em;">${failLabel}</span>
      </div>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${benchmarkLine}</p>
    </div>
  </td></tr>

  <!-- Benchmark standalone line -->
  <tr><td style="padding-bottom:20px;">
    <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">${benchmarkLine}</p>
  </td></tr>

  <!-- Competitor line -->
  ${competitorSection}

  <!-- Upsell card -->
  <tr><td style="padding-bottom:28px;">
    <div style="background:#6B5DD3;border-radius:12px;padding:28px;">
      <h2 style="margin:0 0 10px;font-size:20px;font-weight:700;color:#ffffff;line-height:1.4;">
        Your competitors are winning ${queryCount} of your priority queries.
      </h2>
      <p style="margin:0 0 20px;font-size:14px;color:#ddd6fe;line-height:1.7;">
        Your free snapshot shows the gap. Your Visibility Engine Report shows exactly why &mdash;
        and gives you a prioritised fix queue to close it.
        One report. $250. No subscription, no sales call.
      </p>
      <a href="${REPORT_URL}"
         style="display:inline-block;background:#ffffff;color:#6B5DD3;font-size:14px;font-weight:700;
                text-decoration:none;padding:13px 24px;border-radius:8px;margin-bottom:16px;">
        Get My Visibility Engine Report &mdash; $250 &rarr;
      </a>
      <p style="margin:0;font-size:12px;color:#c4b5fd;line-height:1.6;">
        Once the gaps are closed, citations shift 40&ndash;60% monthly. Visibility Monitor keeps you
        ahead of changes your competitors don&rsquo;t see coming. $500/month, cancel anytime.
      </p>
    </div>
  </td></tr>

  <!-- Strategy call line -->
  <tr><td style="padding-bottom:36px;">
    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
      Want Maxifi to implement the fixes for you?
      <a href="${CALENDLY}" style="color:#6B5DD3;font-weight:600;text-decoration:none;">
        Book a strategy call &rarr;
      </a>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="border-top:1px solid #e5e7eb;padding-top:20px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
      Maxifi Digital &middot; London, United Kingdom &middot;
      <a href="mailto:hello@maxifidigital.com" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: lead.email,
    subject,
    html,
  });

  if (error) throw new Error(`Resend user email error: ${JSON.stringify(error)}`);
}

// ─── Email 2: Internal notification (plain text) ──────────────────────────────

export async function sendInternalNotification(lead: AeoLeadRow): Promise<void> {
  const fromEmail   = process.env.FROM_EMAIL ?? 'hello@maxifidigital.com';
  const notifyEmail = process.env.MAXIFI_NOTIFY_EMAIL;

  if (!notifyEmail) {
    console.warn('[email] MAXIFI_NOTIFY_EMAIL not set — skipping internal notification');
    return;
  }

  const body = [
    `New AEO Visibility Check submission`,
    ``,
    `── Lead details ──────────────────────────────`,
    `first_name:    ${lead.first_name}`,
    `email:         ${lead.email}`,
    `website:       ${lead.website ?? '—'}`,
    `occupation:    ${lead.occupation}`,
    `industry:      ${lead.industry}`,
    `company_name:  ${lead.company_name ?? '—'}`,
    ``,
    `── AEO awareness ─────────────────────────────`,
    `awareness:     ${lead.awareness}`,
    `platform:      ${lead.platform}`,
    `platform_other:${lead.platform_other ?? '—'}`,
    `challenge:     ${lead.challenge}`,
    `outcome:       ${lead.outcome}`,
    ``,
    `── Attribution ───────────────────────────────`,
    `utm_source:    ${lead.utm_source ?? '—'}`,
    `utm_medium:    ${lead.utm_medium ?? '—'}`,
    `utm_campaign:  ${lead.utm_campaign ?? '—'}`,
    ``,
    `── Metadata ──────────────────────────────────`,
    `id:            ${lead.id}`,
    `session_id:    ${lead.session_id ?? '—'}`,
    `created_at:    ${lead.created_at}`,
    ``,
    `── Plan summary ──────────────────────────────`,
    `steps:         ${lead.plan_steps.length}`,
    `quick_win:     ${lead.plan_quick_win}`,
  ].join('\n');

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: notifyEmail,
    subject: `New AEO lead: ${lead.first_name} — ${lead.occupation} in ${lead.industry}`,
    text: body,
  });

  if (error) throw new Error(`Resend internal email error: ${JSON.stringify(error)}`);
}
