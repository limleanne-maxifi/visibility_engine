import type { FormData } from '@/lib/types';
import { inferBusinessModel } from '@/lib/scoring';

const BUYER_MODEL_CONTEXT: Record<string, string> = {
  B2G: 'Buyer model: B2G (procurement-led). This organisation wins business through formal tender, RFP, and vendor shortlisting processes — not inbound lead generation. AEO value is being cited when procurement teams, evaluators, and advisors use AI to research vendors, build longlists, or validate suppliers. Frame every recommendation around vendor credibility, trust signals, and appearing in AI-assisted due diligence — not "leads", "referrals", or consumer discovery.',
  B2C: 'Buyer model: B2C (consumer-facing). AEO value is appearing when individual buyers ask AI tools for product or service recommendations. Frame recommendations around consumer trust, review signals, and being mentioned by name when someone asks AI "what is the best [category]".',
  mixed: 'Buyer model: Mixed B2B/B2C. This organisation serves both business buyers and end consumers. AEO value spans both procurement research (B2B) and direct consumer recommendation (B2C). Frame steps to address both discovery contexts.',
  B2B: 'Buyer model: B2B (business-to-business). AEO value is appearing when business decision-makers research vendors, compare solutions, or seek expert recommendations via AI tools. Frame recommendations around thought leadership, solution credibility, and being cited when buyers evaluate options in the category.',
};

const SECTOR_CONSTRAINTS: Record<string, string> = {
  'Defense & Government Systems': 'Regulated sector: Defense / Government. Avoid consumer-facing framing entirely. Focus on: public-sector procurement visibility, thought leadership in defence trade media, MOD/DPP/NATO vendor research contexts, compliance-aware content. Do not suggest social media follower growth or B2C marketing tactics.',
  'Aviation, ATC & Aerospace': 'Regulated sector: Aviation / ATC. Buyers include ANSPs, airlines, MROs, regulators, and defense clients. Focus on: safety-critical credibility, ICAO/EASA/FAA regulatory contexts, trade publication authority, appearing in AI vendor research for ATC systems, avionics, or MRO services.',
  'Healthcare & Life Sciences': 'Regulated sector: Healthcare. Buyers include hospital procurement, NHS/health systems, and clinical teams. Avoid unsubstantiated clinical claims. Focus on: clinical evidence, peer-reviewed citations, procurement-compliant content, trust signals for MHRA/FDA-adjacent audiences.',
  'Healthcare Technology / Digital Health': 'Regulated sector: Healthcare Technology. Focus on clinical credibility, interoperability standards (HL7, FHIR), NHS/health system procurement language, and appearing in AI research by clinical buyers and IT procurement teams.',
  'Pharmaceuticals & Biotech': 'Regulated sector: Pharma / Biotech. Buyers are clinical, regulatory, and procurement professionals. Focus on regulatory-compliant content, scientific credibility, and appearing in AI-assisted vendor evaluation for drug development, CRO, or CMO services.',
  'Financial Services & Banking': 'Regulated sector: Financial Services. Content must be suitable for a regulated audience. Avoid unsubstantiated performance claims. Focus on: regulatory trust signals, appearing in AI research by compliance, risk, or procurement teams.',
  'Legal & Legal Services': 'Regulated sector: Legal. Focus on professional credibility, precedent and expertise signals, and appearing when in-house legal teams or businesses search AI for specialist counsel.',
};

export function buildUserMessage(data: FormData): string {
  const stepCount =
    data.aiPresence === "No, I haven't tried this yet" ? 3 : 5;

  const primaryPlatform = data.platforms.find((p) => p.priority === 'primary')?.value ?? 'Not specified';
  const secondaryPlatform = data.platforms.find((p) => p.priority === 'secondary')?.value;

  const businessModel = inferBusinessModel(data.industry);
  const buyerContext = BUYER_MODEL_CONTEXT[businessModel];
  const sectorConstraint = SECTOR_CONSTRAINTS[data.industry] ?? null;

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
    ``,
    `Context for this plan:`,
    buyerContext,
    sectorConstraint ?? null,
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
  `You are an AEO (Answer Engine Optimisation) strategist at Maxifi Digital. Write clear, authoritative, immediately actionable AEO action plans tailored to the person's industry, role, and buyer model.

Rules:
- Use plain English only — no jargon, no acronyms without explanation.
- Speak directly to the person using 'you'.
- Never use generic filler advice — every step must be specific to their industry, challenge, and how their buyers actually use AI.
- For B2G / procurement-led sectors: never use "leads", "referrals", or consumer marketing framing. Focus on vendor credibility, procurement visibility, and due diligence contexts.
- For regulated industries (Defense, Aviation, Healthcare, Finance, Legal): respect compliance constraints — do not suggest tactics that would be inappropriate in those sectors.
- For B2B sectors: frame around business decision-maker research, not consumer discovery.
- IMPORTANT: Do not invent or estimate statistics, scores, query counts, or competitor metrics that are not explicitly provided in the user message — if the data is not there, do not reference it.
- The Quick Win must be realistic to complete in under 30 minutes and specific to their situation.`;
