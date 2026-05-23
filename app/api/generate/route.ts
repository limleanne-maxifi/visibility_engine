import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateSessionId } from '@/lib/utils';
import { buildUserMessage, SYSTEM_PROMPT } from '@/lib/buildPrompt';
import { parsePlan } from '@/lib/parsePlan';
import { insertLead } from '@/lib/supabase';
import { sendUserPlanEmail, sendInternalNotification } from '@/lib/email';
import { getIndustryBenchmark } from '@/lib/scoring';
import type { FormData } from '@/lib/types';
import type { GenerateResponse, GenerateErrorResponse } from '@/lib/planTypes';

const VALID_AI_PRESENCE = [
  "No, I haven't tried this yet",
  'Yes — and the results were accurate',
  "Yes — but I wasn't mentioned at all",
  'Yes — but details about me were wrong',
  'Yes — competitors were cited instead of me',
  'Yes — but old/outdated info appeared',
];

const VALID_COMPETITIVE_STANDING = [
  "I appear prominently — competitors don't displace me",
  'I appear alongside competitors roughly equally',
  'Competitors occasionally appear ahead of me',
  'Competitors consistently appear, I rarely do',
  "I haven't checked this",
];

const VALID_QUERY_COVERAGE = [
  "I appear for most category and topic queries I've tested",
  'I appear for some queries but miss many category searches',
  'I only appear when my exact brand/company name is searched',
  "I haven't tested multiple query types",
];

const VALID_PLATFORM_CONSISTENCY = [
  'Yes — I appear consistently across all major AI platforms',
  'Yes — but results vary significantly by platform',
  "I've only checked one platform",
  "No — I haven't tested across platforms",
];

const VALID_PLATFORMS = [
  'ChatGPT', 'Google AI Overviews', 'Perplexity',
  'Claude', 'Gemini', 'Microsoft Copilot'
];

function validateFormData(data: FormData): string[] {
  const errors: string[] = [];

  // Email validation
  if (!data.email || !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('Invalid email format');
  }

  // Industry validation
  try {
    getIndustryBenchmark(data.industry);
  } catch {
    errors.push(`Industry not recognized`);
  }

  // Platform validation
  if (!data.platforms?.length) {
    errors.push('Please select at least one AI platform');
  } else if (!data.platforms.find(p => p.priority === 'primary')) {
    errors.push('Please select a primary AI platform');
  } else if (data.platforms.some(p => !VALID_PLATFORMS.includes(p.value))) {
    errors.push('Invalid platform selection');
  }

  // AI Presence validation
  if (!VALID_AI_PRESENCE.includes(data.aiPresence)) {
    errors.push('Invalid awareness state');
  }

  // New signal validations
  if (!VALID_COMPETITIVE_STANDING.includes(data.competitiveStanding ?? '')) {
    errors.push('Invalid competitive standing selection');
  }
  if (!VALID_QUERY_COVERAGE.includes(data.queryCoverage ?? '')) {
    errors.push('Invalid query coverage selection');
  }
  if (!VALID_PLATFORM_CONSISTENCY.includes(data.platformConsistency ?? '')) {
    errors.push('Invalid platform consistency selection');
  }

  // String length validation
  if ((data.competitors?.length ?? 0) > 500) {
    errors.push('Competitors field exceeds maximum length');
  }
  if ((data.positioning?.length ?? 0) > 500) {
    errors.push('Positioning field exceeds maximum length');
  }
  if ((data.targetQueries?.length ?? 0) > 500) {
    errors.push('Target queries field exceeds maximum length');
  }

  return errors;
}

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

  // Comprehensive form data validation
  const validationErrors = validateFormData(formData);
  if (validationErrors.length > 0) {
    return NextResponse.json(
      {
        error: 'Validation failed: ' + validationErrors.join('; '),
        code: 'VALIDATION_ERROR'
      },
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

  // Persist to Supabase — fail if insert fails
  let id: string;
  try {
    console.log('[generate] competitors being saved:', formData.competitors || null);
    console.log('[generate] inserting lead to Supabase...');
    const lead = await insertLead(formData, plan);
    id = lead.id;
    console.log('[generate] lead inserted, id:', id, '| awareness stored:', lead.awareness, '| platform stored:', lead.platform);

    // Fire emails non-blocking — errors logged, never surfaced to user
    Promise.allSettled([
      sendUserPlanEmail(lead),
      sendInternalNotification(lead),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`[generate] Email ${i === 0 ? 'user' : 'internal'} send failed:`, r.reason);
        }
      });
    });

    console.log('[generate] returning id:', id);
    return NextResponse.json({ id, plan }, { status: 200 });

  } catch (err) {
    console.error('[generate] Supabase insert failed:', err);
    return NextResponse.json(
      {
        error: 'Failed to save your report. Please try again.',
        code: 'DATABASE_ERROR',
      },
      { status: 500 }
    );
  }
}
