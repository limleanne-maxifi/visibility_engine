import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateSessionId } from '@/lib/utils';
import { buildUserMessage, SYSTEM_PROMPT } from '@/lib/buildPrompt';
import { parsePlan } from '@/lib/parsePlan';
import { insertLead } from '@/lib/supabase';
import { sendUserPlanEmail, sendInternalNotification } from '@/lib/email';
import { buildTeaserReport } from '@/lib/buildTeaserReport';
import type { FormData } from '@/lib/types';
import type { GenerateResponse, GenerateErrorResponse, Plan } from '@/lib/planTypes';
import { getReportPrice } from '@/lib/pricing';

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ─── Feature flag — gates the wasteful Claude action-plan call ───────────────
// The Claude-generated plan was stored in `lead.plan_steps` / `lead.plan_quick_win`
// but never rendered to the user (the free deliverable is a snapshot built
// programmatically by `buildTeaserReport`, not an action plan). Per RESOLVED-6
// in CLAUDE.md the free tier is a snapshot — not a plan. We keep the plumbing
// intact behind this flag so the Option A sprint (real single-query engine
// proof — PROJECT_STATE §0b.2) can revisit. Default is disabled so every form
// submit saves ~1000 tokens of Anthropic spend and 2–5s of latency.
const DISABLE_CLAUDE_ACTION_PLAN = true;

export async function POST(
  req: NextRequest
): Promise<NextResponse<GenerateResponse | GenerateErrorResponse>> {
  // Parse and lightly validate body
  let formData: FormData;
  try {
    formData = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  if (!formData.firstName || !formData.email || !formData.occupation) {
    return NextResponse.json(
      { error: 'Missing required fields: firstName, email, occupation', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  console.log('[generate] submission received:', {
    firstName: formData.firstName,
    occupation: formData.occupation,
    industry: formData.industry,
    aiPresence: formData.aiPresence,
    platformCount: formData.platforms?.length ?? 0,
    primaryPlatform: formData.platforms?.find((p) => p.priority === 'primary')?.value ?? 'none',
    challengeCount: formData.challenges?.length ?? 0,
    competitors: formData.competitors || null,
    positioning: formData.positioning || null,
    targetQueries: formData.targetQueries || null,
  });

  // Generate plan — gated by DISABLE_CLAUDE_ACTION_PLAN (see above).
  let plan: Plan;
  if (DISABLE_CLAUDE_ACTION_PLAN) {
    plan = { steps: [], quickWin: '' };
    console.log('[generate] Claude action-plan call gated off — emitting empty plan');
  } else {
    let rawText: string;
    try {
      console.log('[generate] calling Anthropic API...');
      const message = await getAnthropicClient().messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildUserMessage(formData) },
        ],
      });

      const firstBlock = message.content[0];
      if (firstBlock.type !== 'text') {
        throw new Error('Unexpected content block type from Claude');
      }
      rawText = firstBlock.text;
      console.log('[generate] Anthropic response received, length:', rawText.length);
    } catch (err) {
      console.error('[generate] Claude API error:', err);
      return NextResponse.json(
        {
          error: 'Failed to generate plan — the AI service returned an error.',
          code: 'API_ERROR',
        },
        { status: 502 }
      );
    }

    try {
      plan = parsePlan(rawText);
      console.log('[generate] plan parsed successfully:', { stepCount: plan.steps.length, hasQuickWin: !!plan.quickWin });
    } catch (err) {
      console.error('[generate] Parse error. Raw response:\n', rawText);
      console.error('[generate] Parse error detail:', err);
      return NextResponse.json(
        {
          error: 'Failed to parse the generated plan. Please try again.',
          code: 'PARSE_ERROR',
        },
        { status: 500 }
      );
    }
  }

  // Build free teaser report (programmatic, no second Claude call)
  const reportToken = crypto.randomUUID();
  const baseUrl     = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://visibilityview.netlify.app';
  const reportUrl   = `${baseUrl}/r/${reportToken}`;
  const unlockUrl   = process.env.REPORT_CHECKOUT_URL ?? process.env.CALENDLY_URL ?? `${baseUrl}/report/unlock`;
  const calendlyUrl = process.env.CALENDLY_URL ?? 'https://lunacal.ai/maxifidigital/';
  const reportPrice = process.env.REPORT_PRICE || getReportPrice();

  const teaserReport = buildTeaserReport(
    formData,
    reportToken,
    reportPrice,
    `${unlockUrl}?token=${reportToken}`,
    calendlyUrl,
  );

  // Persist to Supabase — graceful degradation on failure
  let id: string;
  let reportTokenOut = reportToken;
  try {
    console.log('[generate] competitors being saved:', formData.competitors || null);
    console.log('[generate] inserting lead to Supabase...');
    const lead = await insertLead(formData, plan, { reportToken, reportData: teaserReport });
    id = lead.id;
    console.log('[generate] lead inserted, id:', id, '| token:', reportToken, '| awareness:', lead.awareness);

    // Fire emails non-blocking — errors logged, never surfaced to user
    Promise.allSettled([
      sendUserPlanEmail(lead, reportUrl),
      sendInternalNotification(lead),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`[generate] Email ${i === 0 ? 'user' : 'internal'} send failed:`, r.reason);
        }
      });
    });
  } catch (err) {
    console.error('[generate] Supabase insert failed — falling back to session ID:', err);
    id = generateSessionId();
    reportTokenOut = '';
  }

  console.log('[generate] returning id:', id);
  return NextResponse.json({ id, plan, reportToken: reportTokenOut, reportUrl }, { status: 200 });
}
