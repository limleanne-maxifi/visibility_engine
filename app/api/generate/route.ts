import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';
import { generateSessionId } from '@/lib/utils';
import { buildUserMessage, SYSTEM_PROMPT } from '@/lib/buildPrompt';
import { buildTeaserUserMessage, getScoreBand, TEASER_SYSTEM_PROMPT } from '@/lib/buildTeaserPrompt';
import { parsePlan } from '@/lib/parsePlan';
import { parseTeaserSections } from '@/lib/parseTeaserReport';
import { insertLead, insertReport } from '@/lib/supabase';
import { sendUserPlanEmail, sendInternalNotification } from '@/lib/email';
import { getVisibilityScore, getIndustryBenchmark, getAllCompetitors } from '@/lib/scoring';
import type { FormData } from '@/lib/types';
import type { GenerateResponse, GenerateErrorResponse } from '@/lib/planTypes';
import type { ReportData } from '@/lib/reportTypes';

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

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

  // Call Claude
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

  // Parse the structured response
  let plan;
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

  // Persist to Supabase — graceful degradation on failure
  let id: string;
  let reportToken: string | null = null;

  try {
    console.log('[generate] competitors being saved:', formData.competitors || null);
    console.log('[generate] inserting lead to Supabase...');
    const lead = await insertLead(formData, plan);
    id = lead.id;
    console.log('[generate] lead inserted, id:', id, '| awareness stored:', lead.awareness, '| platform stored:', lead.platform);

    // Generate teaser report (s1–s4) non-blocking — errors logged, never surfaced to user
    (async () => {
      try {
        const competitors  = getAllCompetitors(lead.competitors);
        const score        = getVisibilityScore(lead.awareness, competitors);
        const benchmarkAvg = getIndustryBenchmark(lead.industry);
        const band         = getScoreBand(score);

        console.log('[teaser] calling Claude for s1–s4...');
        const teaserMsg = await getAnthropicClient().messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 3000,
          system: TEASER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildTeaserUserMessage(lead, score, band, benchmarkAvg) }],
        });

        const firstBlock = teaserMsg.content[0];
        if (firstBlock.type !== 'text') throw new Error('Unexpected content block from Claude teaser');

        const sections = parseTeaserSections(firstBlock.text);
        console.log('[teaser] sections parsed OK');

        const token = randomUUID();
        const entity = lead.company_name ?? lead.first_name;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.BASE_URL ?? 'https://visibilityview.netlify.app';
        const calendlyUrl = process.env.CALENDLY_URL ?? 'https://lunacal.ai/maxifidigital/';
        const unlockUrl = process.env.REPORT_CHECKOUT_URL ?? calendlyUrl;

        const reportData: ReportData = {
          meta: {
            token,
            generatedAt: new Date().toISOString(),
            entityName: entity,
            industry: lead.industry,
            occupation: lead.occupation,
            website: lead.website ?? null,
            paid: false,
          },
          score: {
            score,
            band,
            benchmarkAvg,
            benchmarkLabel: `${lead.industry} average`,
            scoringNote: sections.scoringNote,
          },
          s1Visibility:   sections.s1Visibility,
          s2Diagnosis:    sections.s2Diagnosis,
          s3Platforms:    sections.s3Platforms,
          s4Positioning:  sections.s4Positioning,
          s5Competitors:  null,
          s6PositioningGap: null,
          s7QueryGap:     null,
          s8ActionQueue:  null,
          reportPrice:    process.env.REPORT_PRICE ?? '$249',
          unlockUrl,
          calendlyUrl,
        };

        await insertReport(token, reportData);
        reportToken = token;
        console.log('[teaser] report saved, token:', token);

        // Send emails with report URL
        const reportUrl = `${baseUrl}/r/${token}`;
        await Promise.allSettled([
          sendUserPlanEmail(lead, reportUrl),
          sendInternalNotification(lead),
        ]).then((results) => {
          results.forEach((r, i) => {
            if (r.status === 'rejected') {
              console.error(`[generate] Email ${i === 0 ? 'user' : 'internal'} send failed:`, r.reason);
            }
          });
        });
      } catch (teaserErr) {
        console.error('[teaser] generation failed — sending email without report URL:', teaserErr);
        // Fallback: send email without report URL so lead still gets their plan
        Promise.allSettled([
          sendUserPlanEmail(lead),
          sendInternalNotification(lead),
        ]).then((results) => {
          results.forEach((r, i) => {
            if (r.status === 'rejected') {
              console.error(`[generate] Fallback email ${i === 0 ? 'user' : 'internal'} send failed:`, r.reason);
            }
          });
        });
      }
    })();

  } catch (err) {
    console.error('[generate] Supabase insert failed — falling back to session ID:', err);
    id = generateSessionId();

    // Still send emails on lead insert failure (no report URL)
    Promise.allSettled([
      sendUserPlanEmail({ id, ...formData } as never),
      sendInternalNotification({ id, ...formData } as never),
    ]).catch(() => {/* ignore */});
  }

  console.log('[generate] returning id:', id);
  return NextResponse.json({ id, plan, reportToken }, { status: 200 });
}
