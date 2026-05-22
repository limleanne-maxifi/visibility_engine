import type { AeoLeadRow } from '@/lib/supabase';
import type { ScoreBand } from '@/lib/reportTypes';
import { getAllCompetitors } from '@/lib/scoring';

export function getScoreBand(score: number): ScoreBand {
  if (score <= 20) return 'Critical';
  if (score <= 40) return 'Low';
  if (score <= 60) return 'Developing';
  if (score <= 80) return 'Established';
  return 'Strong';
}

export const TEASER_SYSTEM_PROMPT = `You are an AEO (Answer Engine Optimisation) analyst at Maxifi Digital. Generate a personalised AI Visibility Teaser Report for a lead based on their self-reported data.

OUTPUT RULES — STRICT:
- Output valid JSON only. No preamble, no markdown fences, no explanation, no trailing text.
- Every string value must be specific to this lead — never generic filler.
- Never invent statistics, citation rates, percentages, or competitor metrics not provided.
- Never use measurement language ("we tested", "engine found", "X% of queries") — this is assessment, not measurement.
- Use "assessment", "analysis", "our assessment suggests" — not "we measured" or "engine detected".
- Speak directly to the lead using "you" and reference their entity name throughout.
- The assessmentCaveat fields must acknowledge these are estimates based on self-reported data.

SECTION RULES:
s1Visibility — Qualitative platform assessment. Assess each of the 6 platforms (ChatGPT, Perplexity, Google AI Overviews, Microsoft Copilot, Claude, Gemini). For platforms the lead tested: use their awareness answer to set status. For untested platforms: status="not-tested". Notes must reference the lead's industry/buyer model.

s2Diagnosis — Diagnose the likely failure mode from their awareness answer. Be specific to their industry and positioning. rootCauses must be 3 concrete, specific reasons — not generic advice.

s3Platforms — Prioritise all 6 platforms by relevance to their buyer model and industry. Exactly one "primary", at least one "secondary", rest "monitor". Rationale must explain why this platform matters for their specific buyers.

s4Positioning — Assess their stated positioning against what AI engines need to cite them. observations: 2–3 specific issues. opportunities: 2–3 specific fixes. Be direct about gaps without being discouraging.

ANTI-HALLUCINATION:
- Do NOT claim competitors are or aren't cited — say "likely" or "based on your reported testing".
- Do NOT promise citation improvements — frame as "opportunity" or "potential".
- scoringNote must acknowledge the score is estimated from self-reported data.`;

export function buildTeaserUserMessage(
  lead: AeoLeadRow,
  score: number,
  band: ScoreBand,
  benchmarkAvg: number,
): string {
  const entity = lead.company_name ?? lead.first_name;
  const competitors = getAllCompetitors(lead.competitors);

  const testedPlatforms = [lead.platform, lead.platform_other].filter(Boolean);
  const allPlatforms = ['ChatGPT', 'Perplexity', 'Google AI Overviews', 'Microsoft Copilot', 'Claude', 'Gemini'];
  const untestedPlatforms = allPlatforms.filter(p => !testedPlatforms.includes(p ?? ''));

  const schema = `{
  "scoringNote": "One sentence: why this score. Must reference estimated/self-reported nature.",
  "s1Visibility": {
    "headline": "Current Visibility Assessment",
    "summary": "2–3 sentences specific to ${entity} and their industry situation.",
    "platforms": [
      { "platform": "ChatGPT", "status": "<likely-present|likely-absent|competitor-cited|cited-with-issues|not-tested>", "note": "..." },
      { "platform": "Perplexity", "status": "...", "note": "..." },
      { "platform": "Google AI Overviews", "status": "...", "note": "..." },
      { "platform": "Microsoft Copilot", "status": "...", "note": "..." },
      { "platform": "Claude", "status": "...", "note": "..." },
      { "platform": "Gemini", "status": "...", "note": "..." }
    ],
    "assessmentCaveat": "Must say statuses are based on self-reported testing, not live measurements."
  },
  "s2Diagnosis": {
    "failureMode": "<not-cited|competitor-displaced|cited-inaccurately|cited-stale|untested>",
    "modeLabel": "Short label e.g. 'Not being cited'",
    "severity": "<high|medium|low>",
    "headline": "One sentence diagnosis headline",
    "explanation": "2–3 sentences explaining the failure mode specific to ${entity}.",
    "rootCauses": ["specific cause 1", "specific cause 2", "specific cause 3"],
    "likelyImpact": "One sentence: what this means for their buyer pipeline."
  },
  "s3Platforms": {
    "headline": "Platform Priority Overview",
    "summary": "2 sentences on where to focus first given their industry and buyer model.",
    "platforms": [
      { "platform": "ChatGPT", "priority": "<primary|secondary|monitor>", "rationale": "...", "buyerPresence": "<high|medium|low>" },
      { "platform": "Perplexity", "priority": "...", "rationale": "...", "buyerPresence": "..." },
      { "platform": "Google AI Overviews", "priority": "...", "rationale": "...", "buyerPresence": "..." },
      { "platform": "Microsoft Copilot", "priority": "...", "rationale": "...", "buyerPresence": "..." },
      { "platform": "Claude", "priority": "...", "rationale": "...", "buyerPresence": "..." },
      { "platform": "Gemini", "priority": "...", "rationale": "...", "buyerPresence": "..." }
    ],
    "priorityNote": "One sentence: these are qualitative priorities, not measured citation rates."
  },
  "s4Positioning": {
    "headline": "Positioning vs. Sector Assessment",
    "entityPositioning": "${lead.positioning ?? 'Not provided'}",
    "sectorContext": "One sentence: what AI engines need to cite vendors in this sector.",
    "alignmentLevel": "<strong|partial|weak|missing>",
    "alignmentLabel": "Short label e.g. 'Partial alignment — positioning too broad to own a citation category'",
    "observations": ["specific observation 1", "specific observation 2"],
    "opportunities": ["specific opportunity 1", "specific opportunity 2"],
    "assessmentCaveat": "Must note this is based on stated positioning, not a measured audit."
  }
}`;

  return `Generate a teaser report for this lead. Output the JSON schema below with all placeholder values replaced — no extra keys, no missing keys.

── LEAD DATA ──────────────────────────────────────────────────
Entity name:       ${entity}
First name:        ${lead.first_name}
Occupation:        ${lead.occupation}
Industry:          ${lead.industry}
Website:           ${lead.website ?? 'not provided'}

── AI AWARENESS ───────────────────────────────────────────────
What they found:   ${lead.awareness}
Platforms tested:  ${testedPlatforms.length > 0 ? testedPlatforms.join(', ') : 'none specified'}
Platforms NOT tested: ${untestedPlatforms.join(', ')}
Competitors named: ${competitors.length > 0 ? competitors.join(', ') : 'none'}
Positioning:       ${lead.positioning ?? 'not provided'}
Target queries:    ${lead.target_queries ?? 'not provided'}
Challenge:         ${lead.challenge}
Outcome goal:      ${lead.outcome}

── COMPUTED SCORE (do not change these numbers) ───────────────
Score:             ${score}
Band:              ${band}
Benchmark avg:     ${benchmarkAvg}% (${lead.industry} industry average)

── OUTPUT SCHEMA (fill every field, replace all placeholders) ──
${schema}`;
}
