import { Resend } from 'resend';
import type { AeoLeadRow } from '@/lib/supabase';
import {
  getAllCompetitors,
  getVisibilityScore,
  getIndustryBenchmark,
  buyerConversations,
} from '@/lib/scoring';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getUrls() {
  const calendly = process.env.CALENDLY_URL ?? 'https://maxifidigital.com';
  return {
    CALENDLY: calendly,
    REPORT_URL: process.env.REPORT_CHECKOUT_URL ?? calendly,
    MONITOR_URL: process.env.MONITOR_CHECKOUT_URL ?? calendly,
  };
}

// ─── Email 1: User snapshot email ────────────────────────────────────────────

export async function sendUserPlanEmail(lead: AeoLeadRow): Promise<void> {
  const { CALENDLY, REPORT_URL } = getUrls();
  const fromEmail  = process.env.FROM_EMAIL ?? 'hello@maxifidigital.com';

  const competitors  = getAllCompetitors(lead.competitors);
  const score        = getVisibilityScore(lead.awareness, competitors);
  const benchAvg     = getIndustryBenchmark(lead.industry);
  const { x: buyerX, y: buyerY } = buyerConversations(score, benchAvg);
  const entity       = lead.company_name ?? lead.first_name;

  const scoreDisplay   = score > 0 ? `${score}%` : '—';
  const subject        = `Your AEO Visibility Snapshot — ${entity} is at ${score > 0 ? `${score}%` : 'an undiagnosed'} visibility`;

  const benchmarkLine = score > 0
    ? `Your score of <strong>${score}%</strong> compares to an industry average of <strong>${benchAvg}%</strong> for ${lead.industry || 'your industry'}.
       ${score < benchAvg ? 'You are currently below the industry benchmark.' : 'You are at or above the industry benchmark.'}`
    : `Your AI visibility baseline is undiagnosed. Search for ${entity} in ChatGPT or Perplexity to see where you stand.`;

  // Only include a competitor call-out when the user explicitly said competitors were cited
  const displacedByCompetitor = lead.awareness === 'Yes — competitors were cited instead of me';
  const competitorSection = displacedByCompetitor ? `
    <tr><td style="padding-bottom:20px;">
      <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
        ${competitors.length > 0
          ? `Based on what you reported, <strong>${competitors.join(', ')}</strong> ${competitors.length === 1 ? 'is' : 'are'} being cited instead of you when buyers search for what you do.`
          : 'A competitor is being cited instead of you when buyers search for what you do.'
        }
        Your full report shows the structural reason they&rsquo;re appearing ahead of you — and what to change.
      </p>
    </td></tr>` : '';

  // Upsell headline matched to what the user actually reported
  const upsellHeadline =
    displacedByCompetitor
      ? `See exactly which queries your competitors are winning — and why.`
      : lead.awareness === "Yes — but I wasn't mentioned at all"
      ? `Find out which queries you&rsquo;re missing — and how to get into them.`
      : lead.awareness === 'Yes — but details about me were wrong'
      ? `See exactly what AI is saying about you — and how to correct it.`
      : lead.awareness === 'Yes — but old/outdated info appeared'
      ? `Find out which outdated content AI is citing — and how to update it.`
      : `Find out exactly where ${entity} stands across all AI platforms — and what to fix first.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="text-align:center;padding:24px 0 16px;">
  <img src="https://visibilityview.netlify.app/maxifi-logo-black.png" alt="Maxifi Digital" style="display:block;margin:0 auto 24px;width:140px;height:auto;" />
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:0 16px 40px;">
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

  <!-- Score card -->
  <tr><td style="padding-bottom:20px;">
    <div style="background:#f3f4f6;border-radius:12px;padding:24px 28px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">
        Your AI Visibility Score
      </p>
      <p style="margin:0 0 16px;font-size:56px;font-weight:700;color:#111827;line-height:1.1;">
        ${scoreDisplay}
      </p>
      <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.6;">${benchmarkLine}</p>
      ${score > 0 ? `<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">If 10 potential buyers in your category asked an AI tool for a recommendation today, your brand would appear in approximately <strong>${buyerX}</strong> of those conversations. Your closest competitors appear in <strong>${buyerY}</strong> or more.</p>` : ''}
    </div>
  </td></tr>

  <!-- Opportunity -->
  ${displacedByCompetitor ? `
  <tr><td style="padding-bottom:20px;">
    <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
      This is fixable &mdash; and faster to address than starting from zero.
      Your AI presence already exists, which is a good starting point.
      What needs to change is how your presence is structured, not whether you have one.
    </p>
  </td></tr>` : ''}

  <!-- Competitor line -->
  ${competitorSection}

  <!-- Upsell card -->
  <tr><td style="padding-bottom:28px;">
    <div style="background:#6B5DD3;border-radius:12px;padding:28px;">
      <h2 style="margin:0 0 10px;font-size:20px;font-weight:700;color:#ffffff;line-height:1.4;">
        ${upsellHeadline}
      </h2>
      <p style="margin:0 0 20px;font-size:14px;color:#ddd6fe;line-height:1.7;">
        Your free snapshot shows the gap. Your AEO Visibility Report shows exactly why &mdash;
        and gives you a prioritised fix queue to close it.
        One report. No subscription, no sales call.
      </p>
      <a href="${REPORT_URL}"
         style="display:inline-block;background:#ffffff;color:#6B5DD3;font-size:14px;font-weight:700;
                text-decoration:none;padding:13px 24px;border-radius:8px;margin-bottom:16px;">
        Get My Full AEO Visibility Report &rarr;
      </a>
      <p style="margin:0;font-size:12px;color:#c4b5fd;line-height:1.6;">
        AEO citation positions shift as AI platforms update their data sources — sometimes significantly within a single quarter.
        AEO Visibility Engine tracks your position monthly so changes don&rsquo;t catch you off guard. Cancel anytime.
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

  const { error } = await getResend().emails.send({
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
    `New AEO Visibility Snapshot submission`,
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

  const { error } = await getResend().emails.send({
    from: fromEmail,
    to: notifyEmail,
    subject: `New AEO lead: ${lead.first_name} — ${lead.occupation} in ${lead.industry}`,
    text: body,
  });

  if (error) throw new Error(`Resend internal email error: ${JSON.stringify(error)}`);
}
