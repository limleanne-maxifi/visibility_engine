import type { FormData } from '@/lib/types';

export function buildUserMessage(data: FormData): string {
  const stepCount =
    data.aiPresence === "No, I haven't tried this yet" ? 3 : 5;

  const primaryPlatform = data.platforms.find((p) => p.priority === 'primary')?.value ?? 'Not specified';
  const secondaryPlatform = data.platforms.find((p) => p.priority === 'secondary')?.value;

  const lines = [
    `Write a personalised AEO action plan for:`,
    `Name: ${data.firstName}`,
    `Occupation: ${data.occupation}`,
    `Industry: ${data.industry}`,
    `Company: ${data.company || 'not provided'}`,
    `Website: ${data.websiteUrl || 'none provided'}`,
    `AI awareness: ${data.aiPresence}`,
    `Primary AI platform: ${primaryPlatform}`,
    secondaryPlatform ? `Secondary AI platform: ${secondaryPlatform}` : null,
    `Biggest challenges: ${data.challenges.join('; ') || 'not specified'}`,
    `Most important outcome: ${data.aeoOutcome}`,
    data.competitors ? `Competitors: ${data.competitors}` : null,
    data.positioning ? `Positioning / differentiation: ${data.positioning}` : null,
    data.targetQueries ? `Target queries: ${data.targetQueries}` : null,
  ].filter(Boolean);

  return `${lines.join('\n')}

Write ${stepCount} steps.

Format each step EXACTLY as:
STEP_START
NUM: [number]
TITLE: [short plain-English action title]
BODY: [2–3 sentences: what to do, why it matters for their situation, what result to expect. No bullet points.]
STEP_END

After the last step, on a new line write:
QUICKWIN: [One specific action they can do in under 30 minutes today.]

Output nothing else. No preamble, no sign-off, no markdown.`;
}

export const SYSTEM_PROMPT =
  'You are an AEO (Answer Engine Optimisation) strategist at Maxifi Digital. Write clear, encouraging, immediately actionable AEO action plans for non-technical professionals. Use plain English only — no jargon, no acronyms without explanation. Speak directly to the person using \'you\'. Be specific to their occupation, industry, and stated challenge. Never use generic filler advice.';
