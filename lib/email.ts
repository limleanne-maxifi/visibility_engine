import { Resend } from 'resend';
import type { AeoLeadRow } from '@/lib/supabase';
import type { ReportData } from '@/lib/reportTypes';
import { VISIBILITY_GAP_LABELS } from '@/lib/types';
import {
  getAllCompetitors,
  getVisibilityScore,
  getIndustryBenchmark,
  buyerConversations,
  inferBusinessModel,
  getPipelineLabel,
  getBenchmarkContext,
} from '@/lib/scoring';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getUrls() {
  const calendly = process.env.CALENDLY_URL ?? 'https://lunacal.ai/maxifidigital/';
  return {
    CALENDLY: calendly,
    REPORT_URL: process.env.REPORT_CHECKOUT_URL ?? calendly,
    MONITOR_URL: process.env.MONITOR_CHECKOUT_URL ?? calendly,
  };
}

function formatVisibilityGapLabel(gap: string): string {
  return VISIBILITY_GAP_LABELS[gap as keyof typeof VISIBILITY_GAP_LABELS] || gap;
}

// ─── Email 1: User snapshot email ────────────────────────────────────────────

export async function sendUserPlanEmail(lead: AeoLeadRow, reportUrl?: string): Promise<void> {
  const { CALENDLY, REPORT_URL } = getUrls();
  const primaryReportUrl = reportUrl ?? REPORT_URL;
  const fromEmail  = process.env.FROM_EMAIL ?? 'hello@maxifidigital.com';

  const competitors    = getAllCompetitors(lead.competitors);
  const businessModel  = inferBusinessModel(lead.industry);
  const pipelineLabel  = getPipelineLabel(businessModel);
  const entity         = lead.company_name ?? lead.first_name;

  // Source score/band/benchmark from stored report_data to guarantee alignment
  // with the online /r/[token] report. Fall back to live computation for rows
  // that predate Stage 3.
  const reportData   = lead.report_data as ReportData | null;
  const score        = reportData?.score.score        ?? getVisibilityScore(
    lead.awareness,
    lead.competitive_standing ?? '',
    lead.query_coverage ?? '',
    lead.platform_consistency ?? '',
  );
  const band         = reportData?.score.band         ?? null;
  const benchAvg     = reportData?.score.benchmarkAvg ?? getIndustryBenchmark(lead.industry);
  const diagHeadline = reportData?.s2Diagnosis.headline   ?? null;
  const diagImpact   = reportData?.s2Diagnosis.likelyImpact ?? null;

  const { x: buyerX, y: buyerY } = buyerConversations(score, benchAvg);

  const scoreDisplay   = score > 0 ? `${score}%` : '—';
  const subject        = score > 0
    ? `Your AI Visibility Snapshot — ${entity} scores ${score}% (industry avg: ${benchAvg}%)`
    : `Your AI Visibility Snapshot — ${entity}: significant untapped visibility in ${lead.industry}`;

  const benchmarkContext = score > 0 ? getBenchmarkContext(score, benchAvg, lead.industry) : null;

  const benchmarkLine = score > 0
    ? `Your score of <strong>${score}%</strong> vs. the <strong>${benchAvg}%</strong> industry benchmark for ${lead.industry}.
       <br/><br/>
       <strong>Context:</strong> ${benchmarkContext?.contextExplanation}
       <br/><br/>
       <strong>What this means for you:</strong> ${benchmarkContext?.interpretation}`
    : `Your responses point to <strong>significant untapped AI visibility</strong> in ${lead.industry} — most of your category's buyer queries are likely being answered without ${entity} in the response. The good news: this is a structural, fixable gap, and the Full Report shows exactly where to start.`;

  // Buyer conversations — adapted to business model
  const buyerConvLine = score > 0 ? (() => {
    const missed = 10 - buyerX;
    const methodologyNote = ` Estimated from your visibility score; actual rates vary by query and platform.`;

    switch (businessModel) {
      case 'B2G':
        return `An estimated ${missed} out of 10 procurement-team AI searches in your category would not return ${entity}. Brands at the ${lead.industry} benchmark appear in ${buyerY} or more of such searches.${methodologyNote}`;
      case 'B2C':
        return `An estimated ${missed} out of 10 consumer AI recommendation requests would not include ${entity}. Brands at the ${lead.industry} benchmark appear in ${buyerY} or more.${methodologyNote}`;
      case 'mixed':
        return `An estimated ${missed} out of 10 buyer or procurement-team AI searches would not find ${entity}. Brands at the ${lead.industry} benchmark appear in ${buyerY} or more of those situations.${methodologyNote}`;
      default:
        return `An estimated ${buyerX} out of 10 AI-generated recommendations in your category would include ${entity}. Brands at the ${lead.industry} benchmark appear in ${buyerY} or more.${methodologyNote}`;
    }
  })() : '';

  // Only include a competitor call-out when the user explicitly said competitors were cited
  const displacedByCompetitor = lead.awareness === 'Yes — competitors were cited instead of me';

  const searcherTerm = businessModel === 'B2G'
    ? 'procurement teams research vendors in your category'
    : businessModel === 'B2C'
    ? 'buyers search for what you offer'
    : 'buyers search for what you do';

  const competitorSection = displacedByCompetitor ? `
    <tr><td style="padding-bottom:20px;">
      <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
        ${competitors.length > 0
          ? `Based on what you reported, <strong>${competitors.join(', ')}</strong> ${competitors.length === 1 ? 'is' : 'are'} being cited instead of you when ${searcherTerm}.`
          : `A competitor is being cited instead of you when ${searcherTerm}.`
        }
        The Full Report shows the structural reason they&rsquo;re appearing ahead of you — and what to change.
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

  // Strategy call CTA — adapted to business model
  const strategyCta = businessModel === 'B2G'
    ? `Want Maxifi to handle the vendor visibility work for you — so ${entity} appears when procurement teams research your category?`
    : `Want Maxifi to implement the fixes for you?`;

  void pipelineLabel; // imported for future use in email framing

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="text-align:center;padding:24px 0 16px;">
  <img src="https://visibilityview.netlify.app/maxifi-logo-black.png" alt="Maxifi Digital" style="display:block;margin:0 auto 24px;width:140px;height:auto;" />
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:0 16px 40px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Brand header -->
  <tr><td style="padding-bottom:24px;">
    <p style="margin:0;font-size:12px;font-weight:600;color:#A8651E;letter-spacing:0.08em;text-transform:uppercase;">
      Maxifi Digital · AI Visibility Snapshot
    </p>
  </td></tr>

  <!-- Headline -->
  <tr><td style="padding-bottom:6px;">
    <h1 style="margin:0;font-size:26px;font-weight:700;color:#111827;line-height:1.3;">
      Hi ${lead.first_name}, here&rsquo;s your AI Visibility Snapshot for ${entity}.
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
      <p style="margin:0 0 4px;font-size:56px;font-weight:700;color:#111827;line-height:1.1;">
        ${scoreDisplay}
      </p>
      ${band ? `<p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">${band}</p>` : '<p style="margin:0 0 16px;"></p>'}
      <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.6;">${benchmarkLine}</p>
      ${buyerConvLine ? `<p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.6;">${buyerConvLine}</p>` : ''}
      ${diagHeadline ? `<p style="margin:0;font-size:13px;font-style:italic;color:#6b7280;line-height:1.5;border-top:1px solid #e5e7eb;padding-top:12px;">${diagHeadline}</p>` : ''}
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
    <div style="background:#C87A2F;border-radius:12px;padding:28px;">
      <h2 style="margin:0 0 10px;font-size:20px;font-weight:700;color:#091521;line-height:1.4;">
        ${upsellHeadline}
      </h2>
      ${diagImpact ? `<p style="margin:0 0 12px;font-size:14px;color:#091521;line-height:1.7;">${diagImpact}</p>` : ''}
      <p style="margin:0 0 20px;font-size:14px;color:#091521;line-height:1.7;">
        Your free snapshot shows where you stand on the four self-reported AI visibility
        signals &mdash; and where the largest gap sits.
        One report. No subscription, no sales call.
      </p>
      <a href="${primaryReportUrl}"
         style="display:inline-block;background:#ffffff;color:#A8651E;font-size:14px;font-weight:700;
                text-decoration:none;padding:13px 24px;border-radius:8px;margin-bottom:16px;">
        View your free AI Visibility Snapshot &rarr;
      </a>
      <p style="margin:0;font-size:12px;color:#091521;line-height:1.6;">
        AI citation positions shift as AI platforms update their data sources — sometimes significantly within a single quarter.
        AI Visibility Engine tracks your position monthly so changes don&rsquo;t catch you off guard. Cancel anytime.
      </p>
    </div>
  </td></tr>

  <!-- Strategy call line -->
  <tr><td style="padding-bottom:36px;">
    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
      ${strategyCta}
      <a href="${CALENDLY}" style="color:#A8651E;font-weight:600;text-decoration:none;">
        Book a strategy call &rarr;
      </a>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="border-top:1px solid #e5e7eb;padding-top:20px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
      Maxifi Digital &middot; Singapore &middot;
      <a href="mailto:hello@maxifidigital.com" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
    </p>
  </td></tr>

  <!-- Methodology -->
  <tr><td style="padding-top:28px;border-top:1px solid #e5e7eb;">
    <div style="background:#f9fafb;border-radius:8px;padding:16px;">
      <p style="margin:0 0 8px;font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">
        Methodology
      </p>
      <p style="margin:0;font-size:11px;color:#6b7280;line-height:1.5;">
        This snapshot reflects your self-reported AI testing and our visibility scoring model. Your full report adds live, engine-measured citation tests across ChatGPT, Perplexity, Gemini and Claude — turning this assessment into a definitive, query-by-query picture of where ${entity} stands.
      </p>
    </div>
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
    `New AI Visibility Snapshot submission`,
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
    `visibility_gap:${formatVisibilityGapLabel(lead.outcome)}`,
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
