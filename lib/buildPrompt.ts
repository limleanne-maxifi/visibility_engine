import type {
  FormData,
  CompetitorsStructured,
  PositioningStructured,
  PositioningDimension,
} from '@/lib/types';
import { inferBusinessModel, type BusinessModel } from '@/lib/scoring';

const BUYER_MODEL_CONTEXT: Record<string, string> = {
  B2G: 'Buyer model: B2G (procurement-led). This organisation wins business through formal tender, RFP, and vendor shortlisting processes — not inbound lead generation. AEO value is being cited when procurement teams, evaluators, and advisors use AI to research vendors, build longlists, or validate suppliers. Frame every recommendation around vendor credibility, trust signals, and appearing in AI-assisted due diligence — not "leads", "referrals", or consumer discovery.',
  B2C: 'Buyer model: B2C (consumer-facing). AEO value is appearing when individual buyers ask AI tools for product or service recommendations. Frame recommendations around consumer trust, review signals, and being mentioned by name when someone asks AI "what is the best [category]".',
  mixed: 'Buyer model: Mixed B2B/B2C. This organisation serves both business buyers and end consumers. AEO value spans both procurement research (B2B) and direct consumer recommendation (B2C). Frame steps to address both discovery contexts.',
  B2B: 'Buyer model: B2B (business-to-business). AEO value is appearing when business decision-makers research vendors, compare solutions, or seek expert recommendations via AI tools. Frame recommendations around thought leadership, solution credibility, and being cited when buyers evaluate options in the category.',
};

const SECTOR_CONSTRAINTS: Record<string, string> = {
  // Defense & Government (with export control warnings)
  'Defense & Government Systems': 'Regulated sector: Defense / Government. Avoid consumer-facing framing entirely. Focus on: public-sector procurement visibility, thought leadership in defence trade media, MOD/DPP/NATO vendor research contexts, compliance-aware content. Do not suggest social media follower growth or B2C marketing tactics.',
  'Defense & Government Systems — Military': 'Regulated sector: Defense / Military. Strict export control (ITAR/EAR) applies. Avoid public web visibility for sensitive technical content. Focus on: direct MOD/defense procurement channels, closed security-cleared vendor networks, trade publications with restricted access, compliance certifications (Common Criteria, CMMC). Never suggest social media or public positioning.',
  'Defense & Government Systems — Commercial': 'Regulated sector: Defense / Commercial. Less restricted than military, but avoid export-sensitive content. Focus on: commercial defense contracting visibility, industry trade media, appearing in vendor research by commercial defense clients, safety and compliance certifications.',

  // Aviation, ATC & Aerospace (with channel distinction)
  'Aviation, ATC & Aerospace': 'Regulated sector: Aviation / ATC. Buyers include ANSPs, airlines, MROs, regulators, and defense clients. Focus on: safety-critical credibility, ICAO/EASA/FAA regulatory contexts, trade publication authority, appearing in AI vendor research for ATC systems, avionics, or MRO services.',
  'Aviation, ATC & Aerospace — Military': 'Regulated sector: Aviation / Military. Export controls may apply (ITAR/EAR for sensitive avionics). Focus on: military procurement channels, defense-specific certifications (MIL-STD, DO-254), appearing in closed vendor research by military buyers.',
  'Aviation, ATC & Aerospace — Commercial': 'Regulated sector: Aviation / Commercial. Focus on: airline/MRO procurement visibility, DO-178C/DO-254 compliance credentials, EASA/FAA certifications, appearing in vendor research by airlines and maintenance providers.',
  'Aviation, ATC & Aerospace — ATC': 'Regulated sector: ATC Systems. Highly specialized. Focus on: ICAO/EUROCONTROL standards, air navigation service provider (ANSP) procurement, safety-critical compliance (ESARR standards), appearing in research by ANSPs and regulators.',

  // Healthcare (unchanged — generic constraint covers all healthcare)
  'Healthcare & Life Sciences': 'Regulated sector: Healthcare. Buyers include hospital procurement, NHS/health systems, and clinical teams. Avoid unsubstantiated clinical claims. Focus on: clinical evidence, peer-reviewed citations, procurement-compliant content, trust signals for MHRA/FDA-adjacent audiences.',
  'Healthcare Technology / Digital Health': 'Regulated sector: Healthcare Technology. Focus on clinical credibility, interoperability standards (HL7, FHIR), NHS/health system procurement language, data governance (DSPT compliance, DPA agreements), and appearing in AI research by clinical buyers and IT procurement teams.',

  // Pharmaceuticals & Biotech (with role-based distinction)
  'Pharmaceuticals & Biotech': 'Regulated sector: Pharma / Biotech. Buyers are clinical, regulatory, and procurement professionals. Focus on regulatory-compliant content, scientific credibility, and appearing in AI-assisted vendor evaluation for drug development, CRO, or CMO services.',
  'Pharmaceuticals & Biotech — Drug Developer': 'Regulated sector: Pharma / Drug Developer. Focus on: trial methodology and phase visibility (IND, Phase 1/2/3, NDA/BLA), publication strategy in peer-reviewed journals, regulatory pathway credibility (FDA/EMA), appearing in AI research by clinical teams and regulatory buyers. Never suggest clinical efficacy without trial data.',
  'Pharmaceuticals & Biotech — CRO / CMO': 'Regulated sector: Pharma / CRO-CMO. Focus on: operational capability and GMP compliance, appearing in vendor research by pharmaceutical procurement teams, regulatory expertise signals (past trial pedigree), appearing in pharma industry databases and vendor evaluation tools. Never promise trial shortcuts.',
  'Pharmaceuticals & Biotech — Biotech Platform': 'Regulated sector: Biotech / Platform. Focus on: scientific credibility, partnership and licensing visibility, venture capital and pharma partner research, appearing in AI research by business development teams. Emphasize platform utility and integration points.',

  // Financial Services & Banking
  'Financial Services & Banking': 'Regulated sector: Financial Services. Content must be suitable for a regulated audience. Avoid unsubstantiated performance claims. Focus on: regulatory trust signals, appearing in AI research by compliance, risk, or procurement teams.',

  // Legal & Legal Services
  'Legal & Legal Services': 'Regulated sector: Legal. Focus on professional credibility, precedent and expertise signals, and appearing when in-house legal teams or businesses search AI for specialist counsel.',
};

/**
 * PHASE 3 Helper: Format structured competitors data into readable text
 */
function formatCompetitorsStructured(data: CompetitorsStructured): string {
  const lines: string[] = [];

  if (data.direct && data.direct.length > 0) {
    lines.push(`Direct competitors: ${data.direct.join(', ')}`);
  }
  if (data.indirect && data.indirect.length > 0) {
    lines.push(`Alternative solutions: ${data.indirect.join(', ')}`);
  }
  if (data.noteworthy) {
    lines.push(`Market context: ${data.noteworthy}`);
  }

  return lines.join(' | ');
}

/**
 * PHASE 3 Helper: Format structured positioning data into readable text
 */
function formatPositioningStructured(data: PositioningStructured): string {
  const dimensionLabels: Record<PositioningDimension, string> = {
    speed: 'Speed/Efficiency',
    cost: 'Cost/Price',
    quality: 'Quality/Excellence',
    trust: 'Trust/Reliability',
    niche: 'Niche/Specialization',
    integration: 'Integration/Ecosystem',
    other: 'Other',
    '': '',
  };

  const dimension = dimensionLabels[data.dimension] || data.dimension;
  const lines: string[] = [`Positioning: ${dimension} — ${data.statement}`];

  if (data.proof) {
    lines.push(`Proof point: ${data.proof}`);
  }

  return lines.join(' | ');
}

/**
 * PHASE 3 Helper: Format compliance certifications by sector
 */
function formatCertifications(data: FormData): string | null {
  const certs: string[] = [];

  if (data.defenseCertifications && data.defenseCertifications.length > 0) {
    certs.push(`Defense: ${data.defenseCertifications.join(', ')}`);
  }
  if (data.healthcareCertifications && data.healthcareCertifications.length > 0) {
    certs.push(`Healthcare: ${data.healthcareCertifications.join(', ')}`);
  }
  if (data.financeCertifications && data.financeCertifications.length > 0) {
    certs.push(`Finance: ${data.financeCertifications.join(', ')}`);
  }
  if (data.aviationCertifications && data.aviationCertifications.length > 0) {
    certs.push(`Aviation: ${data.aviationCertifications.join(', ')}`);
  }

  return certs.length > 0 ? certs.join(' | ') : null;
}

/**
 * PHASE 3 Helper: Format regulatory context
 */
function formatRegulatoryContext(data: FormData): string | null {
  const contexts: string[] = [];

  if (data.exportStatus && data.exportStatus.trim()) {
    contexts.push(`Export control: ${data.exportStatus}`);
  }
  if (data.dataResidency && data.dataResidency.trim()) {
    contexts.push(`Data jurisdiction: ${data.dataResidency}`);
  }

  return contexts.length > 0 ? contexts.join(' | ') : null;
}

/**
 * PHASE 1.1 & 1.2: Validate form data for critical gaps and edge cases
 * PHASE 3: Check context completeness (competitive, positioning, regulatory)
 * Returns validation result with warnings for missing/conflicting data
 */
export function validateFormData(data: FormData): {
  valid: boolean;
  warnings: string[];
  platformNote?: string;
  contextGaps?: string[];
} {
  const warnings: string[] = [];
  const contextGaps: string[] = [];
  let platformNote: string | undefined;

  // Critical identity fields
  if (!data.firstName?.trim()) {
    warnings.push('Missing: User first name (required for personalization)');
  }
  if (!data.occupation?.trim()) {
    warnings.push('Missing: User occupation (required for role context)');
  }
  if (!data.industry?.trim()) {
    warnings.push('Missing: Industry (required for sector constraints)');
  }

  // Defensive checks: optional fields that might be undefined
  if (!data.platforms || data.platforms.length === 0) {
    platformNote =
      '[⚠ User has no AI platform selected — plan will include entry-level "getting started" guidance]';
  }
  if (!data.challenges || data.challenges.length === 0) {
    warnings.push('Warning: No challenges specified (plan will be less targeted)');
  }

  // Phase 3: Context completeness checks
  const hasCompetitorContext =
    (data.competitorsStructured &&
      (data.competitorsStructured.direct?.length || data.competitorsStructured.indirect?.length)) ||
    (data.competitors && data.competitors.trim());

  if (!hasCompetitorContext) {
    contextGaps.push('No competitor information (plan will lack differentiation guidance)');
  }

  const hasPositioningContext =
    (data.positioningStructured && data.positioningStructured.statement) ||
    (data.positioning && data.positioning.trim());

  if (!hasPositioningContext) {
    contextGaps.push('No positioning/differentiation details (plan will be generic)');
  }

  const hasRegulatoryContext =
    (data.exportStatus && data.exportStatus.trim()) ||
    (data.dataResidency && data.dataResidency.trim()) ||
    data.defenseCertifications?.length ||
    data.healthcareCertifications?.length ||
    data.financeCertifications?.length ||
    data.aviationCertifications?.length;

  if (!hasRegulatoryContext && ['Defense & Government Systems', 'Aviation, ATC & Aerospace', 'Healthcare & Life Sciences', 'Healthcare Technology / Digital Health', 'Pharmaceuticals & Biotech', 'Financial Services & Banking', 'Legal & Legal Services'].includes(data.industry)) {
    contextGaps.push('Regulated sector without compliance/certification context (plan may lack legal groundedness)');
  }

  return {
    valid: warnings.filter(w => w.startsWith('Missing:')).length === 0,
    warnings,
    platformNote,
    contextGaps: contextGaps.length > 0 ? contextGaps : undefined,
  };
}

/**
 * PHASE 2.1: Validate inferred business model against explicit override
 * Returns the buyer model to use (inferred or explicit) and any alignment conflicts
 */
function resolveBuyerModel(
  data: FormData
): {
  model: BusinessModel;
  alignment: 'aligned' | 'conflict';
  note?: string;
} {
  const inferred = inferBusinessModel(data.industry);
  const explicit = (data.buyerModelPrimary as BusinessModel | '') || null;

  // If user provided explicit override, respect it
  if (explicit) {
    const hasConflict = inferred !== explicit;
    return {
      model: explicit,
      alignment: hasConflict ? 'conflict' : 'aligned',
      note: hasConflict
        ? `[CONTEXT: User explicitly selected ${explicit} buyer model, overriding inferred ${inferred}. Plan prioritizes explicit selection.]`
        : undefined,
    };
  }

  return { model: inferred, alignment: 'aligned' };
}

/**
 * PHASE 2.2: Resolve sector constraint based on industry + optional role/channel
 * For pharma: selects constraint based on pharmaRole
 * For defense/aerospace: selects constraint based on defenseChannel
 */
function resolveSectorConstraint(data: FormData): string | null {
  const { industry, pharmaRole, defenseChannel } = data;

  // Pharma role-based constraint selection (Phase 2.2)
  if (industry === 'Pharmaceuticals & Biotech' && pharmaRole) {
    const key = `${industry} — ${pharmaRole}`;
    if (key in SECTOR_CONSTRAINTS) {
      return SECTOR_CONSTRAINTS[key];
    }
  }

  // Defense/Aerospace channel-based constraint selection (Phase 2.3)
  if (
    (industry === 'Defense & Government Systems' || industry === 'Defense') &&
    defenseChannel
  ) {
    const channelLabel = defenseChannel === 'Military' ? 'Military' : 'Commercial';
    const key = `Defense & Government Systems — ${channelLabel}`;
    if (key in SECTOR_CONSTRAINTS) {
      return SECTOR_CONSTRAINTS[key];
    }
  }

  // Aviation channel-based constraint (Phase 2.3)
  if (
    (industry === 'Aviation, ATC & Aerospace' ||
      industry === 'Aviation & Aerospace') &&
    defenseChannel
  ) {
    const key = `Aviation, ATC & Aerospace — ${defenseChannel}`;
    if (key in SECTOR_CONSTRAINTS) {
      return SECTOR_CONSTRAINTS[key];
    }
  }

  // Fallback to generic sector constraint
  return SECTOR_CONSTRAINTS[industry] ?? null;
}

/**
 * Build user message for LLM prompt
 * PHASE 1: Defensive null-checks on arrays/objects
 * PHASE 2: Business model & sector role validation
 * PHASE 3: Competitive intelligence, positioning, regulatory context
 */
export function buildUserMessage(data: FormData): string {
  // Phase 1.1: Defensive null-checks for array fields
  const platforms = data.platforms ?? [];
  const challenges = data.challenges ?? [];
  const primaryPlatform =
    platforms.find((p) => p.priority === 'primary')?.value ?? 'Not specified';
  const secondaryPlatform = platforms.find((p) => p.priority === 'secondary')?.value;

  const stepCount =
    data.aiPresence === "No, I haven't tried this yet" ? 3 : 5;

  // Phase 2.1: Resolve buyer model (inferred vs. explicit)
  const { model: buyerModel, note: modelConflictNote } =
    resolveBuyerModel(data);
  const buyerContext = BUYER_MODEL_CONTEXT[buyerModel];

  // Phase 2.2 & 2.3: Resolve sector constraint based on role/channel
  const sectorConstraint = resolveSectorConstraint(data);

  // Phase 1.2: Add platform validation note if no primary platform
  const platformValidationNote =
    primaryPlatform === 'Not specified'
      ? '[⚠ User has no primary AI platform selected — recommend starting with awareness on key platforms]'
      : null;

  // Phase 3: Format competitive intelligence (structured or free text)
  const competitorInfo =
    data.competitorsStructured && (data.competitorsStructured.direct?.length || data.competitorsStructured.indirect?.length)
      ? formatCompetitorsStructured(data.competitorsStructured)
      : data.competitors
      ? `Competitors: ${data.competitors}`
      : null;

  // Phase 3: Format positioning (structured or free text)
  const positioningInfo =
    data.positioningStructured && data.positioningStructured.statement
      ? formatPositioningStructured(data.positioningStructured)
      : data.positioning
      ? `Positioning / differentiation: ${data.positioning}`
      : null;

  // Phase 3: Format compliance certifications
  const certificationsInfo = formatCertifications(data);

  // Phase 3: Format regulatory context
  const regulatoryInfo = formatRegulatoryContext(data);

  // Phase 3: Competitor AI presence context
  const competitorAiPresenceInfo =
    data.competitorAiPresence && data.competitorAiPresence.trim()
      ? `Competitor AI visibility: ${data.competitorAiPresence}`
      : null;

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
    `Biggest challenges: ${challenges.join('; ') || 'not specified'}`,
    `Most important outcome: ${data.aeoOutcome}`,
    data.targetQueries ? `Target queries: ${data.targetQueries}` : null,
    ``,
    `Competitive & Market Context:`,
    competitorInfo,
    competitorAiPresenceInfo,
    positioningInfo,
    ``,
    `Compliance & Regulatory Context:`,
    certificationsInfo,
    regulatoryInfo,
    ``,
    modelConflictNote ? modelConflictNote : null,
    platformValidationNote ? platformValidationNote : null,
    ``,
    `Buyer Model & Sector Context:`,
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

CORE PRINCIPLES:
- Use plain English only — no jargon, no acronyms without explanation.
- Speak directly to the person using 'you'.
- Never use generic filler advice — every step must be specific to their industry, challenge, and how their buyers actually use AI.
- All recommendations must be defensible under regulatory scrutiny and professional standards.

ANTI-HALLUCINATION (STRICT):
- Do NOT invent, estimate, or reference statistics, scores, query counts, competitor metrics, market sizes, or benchmarks unless explicitly provided in the user message.
- Do NOT make claims about performance, efficacy, safety, or outcomes that are not substantiated by the user's provided data.
- Do NOT suggest that any tactic will guarantee results, increase conversions, or achieve specific metrics — always frame as "potential", "visibility", or "credibility opportunity".
- If you are unsure whether a claim is supported by the user message, omit it.

BUYER MODEL RULES:
- For B2G / procurement-led sectors: never use "leads", "referrals", or consumer marketing framing. Focus on vendor credibility, procurement visibility, and due diligence contexts.
- For B2B sectors: frame around business decision-maker research and vendor evaluation, not consumer discovery.
- For B2C sectors: frame around consumer trust, recommendations, and direct discovery.

REGULATED SECTOR RULES (DEFENSE & GOVERNMENT):
- Never suggest tactics involving export, ITAR, or EAR-controlled information.
- Never recommend social media or consumer-facing marketing tactics.
- Focus exclusively on: public-sector procurement visibility, defense trade media authority, MOD/DPP/NATO vendor research contexts, security clearance considerations.
- Emphasize procurement credibility and compliance pedigree — not speed, not scale, not consumer reach.

REGULATED SECTOR RULES (AVIATION, ATC & AEROSPACE):
- Never suggest safety claims without verifiable DO-178C, DO-254, ICAO, EASA, or FAA compliance documentation.
- For ATC-specific services: emphasize certification lineage and air traffic safety criticality — not consumer-facing benefits.
- Focus on: regulatory compliance credentials, appearing in AI vendor research by ANSPs/airlines/MROs, safety-critical credibility.
- Buyers are regulators, airlines, air navigation service providers, and military procurement — not individual consumers.

REGULATED SECTOR RULES (HEALTHCARE & LIFE SCIENCES):
- NEVER suggest clinical efficacy claims, disease treatment, cure language, or unverified health outcomes.
- NEVER suggest off-label promotion or implied clinical benefits.
- Avoid language that could be interpreted as medical advice or clinical recommendation.
- Focus exclusively on: procurement compliance, appearing in clinical procurement research, clinical evidence standards (peer-reviewed citations, trial methodology), NHS Standard Contract compliance, MHRA/FDA regulatory credibility.
- Buyers are hospital procurement teams, NHS health systems, clinical IT teams — not patients or consumers.

REGULATED SECTOR RULES (HEALTHCARE TECHNOLOGY / DIGITAL HEALTH):
- Avoid clinical claims entirely — frame around data governance, interoperability, and procurement credibility.
- Emphasize: NHS Digital Data Security & Protection Toolkit (DSPT) compliance, Data Processing Addendum (DPA) agreements, HL7/FHIR standards, Information Governance (IG) Toolkit compliance.
- Focus on appearing in AI research by clinical procurement and IT teams, not end users.
- Never promise patient outcomes, clinical integration, or faster diagnosis.

REGULATED SECTOR RULES (PHARMACEUTICALS & BIOTECH):
- Distinguish your role: Are you a drug developer, CRO, CMO, or biotech service provider? Rules vary significantly.
- For drug developers: emphasize trial methodology, publication strategy, regulatory pathway (IND, NDA, BLA, MHRA equivalents), and clinical credibility — never discuss efficacy without trial data.
- For CROs/CMOs: emphasize regulatory pathway expertise, Good Manufacturing Practice (GMP) credibility, and appearing in AI research by pharmaceutical procurement teams.
- NEVER suggest clinical efficacy, trial shortcutting, or regulatory approval shortcuts.
- NEVER reference proprietary trial data or clinical outcomes not in the public domain.
- Buyers are clinical teams, regulatory affairs professionals, and business development — not patients.

REGULATED SECTOR RULES (FINANCIAL SERVICES & BANKING):
- NEVER suggest performance projections, guaranteed returns, investment advice, or predicted financial outcomes.
- NEVER imply regulatory approval or future forecast capability.
- NEVER suggest tactics that could be interpreted as misleading advertising or unsubstantiated claims to regulators (FCA, PRA, SEC, FINRA, etc.).
- Avoid language like "grow your revenue", "increase conversions", "boost engagement" — instead use "credibility opportunity", "visibility with compliance teams", "appearing in due diligence research".
- Focus on: regulatory trust signals, appearing in AI research by compliance/risk/procurement teams, thought leadership with compliance standards.
- Buyers are compliance officers, risk managers, internal audit, and procurement — not retail investors or consumers.

REGULATED SECTOR RULES (LEGAL & LEGAL SERVICES):
- NEVER suggest case outcome predictions, likelihood of success, or settlement value estimates.
- NEVER imply attorney-client privilege or confidential advice status.
- NEVER recommend tactics that could be construed as solicitation or unauthorized practice of law.
- Respect SRA (UK) / Bar Council standards and professional conduct rules.
- Focus on: thought leadership in business law media, appearing in AI research by in-house legal teams and business buyers, professional credibility and precedent signals.
- Buyers are in-house counsel, compliance teams, and business decision-makers — not individual litigants.

TRANSPARENCY & ATTRIBUTION:
- For regulated sectors (healthcare, pharma, aviation, finance, legal, defense): when recommending any content (articles, guides, case studies), explicitly note whether it makes claims that require substantiation, regulatory approval, or expert review.
- Never suggest that AI-generated content can stand alone in regulated sectors — always recommend expert review (clinical, legal, regulatory, compliance) before publication.
- If recommending thought leadership in a regulated sector, suggest peer-review or compliance sign-off as a step.

QUALITY STANDARDS:
- Every step must be specific to the user's industry, role, and stated challenges — no generic advice.
- Every step must be executable within realistic timelines and resource constraints.
- Every recommendation must explain WHY it matters for their situation and their buyers' decision-making process.
- The Quick Win must be realistic to complete in under 30 minutes and specific to their situation.

IF UNSURE:
- If a recommendation could be interpreted as a compliance violation, safety claim, or unsubstantiated performance claim, omit it and suggest a conservative alternative instead.
- Err toward caution in regulated sectors — clarity and compliance matter more than comprehensiveness.`;
