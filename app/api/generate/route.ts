import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateSessionId } from '@/lib/utils';
import { buildUserMessage, SYSTEM_PROMPT } from '@/lib/buildPrompt';
import { parsePlan } from '@/lib/parsePlan';
import { insertLead } from '@/lib/supabase';
import { sendUserPlanEmail, sendInternalNotification } from '@/lib/email';
import type { FormData } from '@/lib/types';
import type { GenerateResponse, GenerateErrorResponse } from '@/lib/planTypes';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

  // Call Claude
  let rawText: string;
  try {
    const message = await client.messages.create({
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
  try {
    const lead = await insertLead(formData, plan);
    id = lead.id;

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
  } catch (err) {
    console.error('[generate] Supabase insert failed — falling back to session ID:', err);
    id = generateSessionId();
  }

  return NextResponse.json({ id, plan }, { status: 200 });
}
