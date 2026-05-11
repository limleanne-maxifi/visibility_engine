import { Resend } from 'resend';
import type { Plan } from '@/lib/planTypes';
import type { AeoLeadRow } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);


const CALENDLY_URL = process.env.CALENDLY_URL ?? 'https://maxifidigital.com';

// ─── Email 1: User plan email (HTML) ─────────────────────────────────────────

export async function sendUserPlanEmail(
  toEmail: string,
  firstName: string,
  plan: Plan
): Promise<void> {
  const stepsHtml = plan.steps
    .map(
      (step) => `
      <div style="margin-bottom:24px; padding:20px 24px; background:#ffffff; border:1px solid #e5e7eb; border-radius:10px;">
        <div style="display:inline-block; font-size:11px; font-weight:600; color:#534AB7; background:#EEEDFE; padding:2px 8px; border-radius:4px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em;">
          Step ${step.num}
        </div>
        <p style="margin:0 0 8px; font-size:16px; font-weight:600; color:#111827;">${step.title}</p>
        <p style="margin:0; font-size:14px; color:#4b5563; line-height:1.7;">${step.body}</p>
      </div>`
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#534AB7;letter-spacing:0.05em;text-transform:uppercase;">
            Maxifi Digital · AEO Visibility Check
          </p>
        </td></tr>

        <!-- Heading -->
        <tr><td style="padding-bottom:8px;">
          <h1 style="margin:0;font-size:28px;font-weight:700;color:#111827;line-height:1.3;">
            Your AEO action plan, ${firstName}
          </h1>
        </td></tr>

        <!-- Intro -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.6;">
            Hi ${firstName}, here is your personalised plan for getting visible in AI search results.
            Work through the steps below at your own pace — and don't miss your quick win at the bottom.
          </p>
        </td></tr>

        <!-- Steps -->
        <tr><td style="padding-bottom:24px;">
          ${stepsHtml}
        </td></tr>

        <!-- Quick Win -->
        <tr><td style="padding-bottom:32px;">
          <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:20px 24px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#065f46;text-transform:uppercase;letter-spacing:0.08em;">
              ⚡ Your biggest quick win today
            </p>
            <p style="margin:0;font-size:14px;font-weight:500;color:#064e3b;line-height:1.7;">
              ${plan.quickWin}
            </p>
          </div>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding-bottom:40px;text-align:center;">
          <a href="${CALENDLY_URL}"
             style="display:inline-block;background:#534AB7;color:#ffffff;font-size:15px;font-weight:600;
                    text-decoration:none;padding:14px 32px;border-radius:8px;">
            Book your free AEO audit →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #e5e7eb;padding-top:20px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
            Maxifi Digital ·
            <a href="mailto:hello@maxifidigital.com" style="color:#9ca3af;">Unsubscribe</a> ·
            London, United Kingdom
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Your AEO action plan, ${firstName}`,
    html,
  });

  if (error) throw new Error(`Resend user email error: ${JSON.stringify(error)}`);
}

// ─── Email 2: Internal Maxifi notification (plain text) ───────────────────────

export async function sendInternalNotification(lead: AeoLeadRow): Promise<void> {
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
    from: process.env.FROM_EMAIL,
    to: notifyEmail,
    subject: `New AEO lead: ${lead.first_name} — ${lead.occupation} in ${lead.industry}`,
    text: body,
  });

  if (error) throw new Error(`Resend internal email error: ${JSON.stringify(error)}`);
}
