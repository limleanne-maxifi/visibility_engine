// ─── Programmatic free-tier teaser generator (S1–S4) ─────────────────────────
// Produces sections 1–4 from form data without a second Claude call.
// Language discipline: free sections use "our analysis suggests", "likely",
// "based on what you reported" — never measurement language.

import type { FormData } from '@/lib/types';
import type {
  ReportData,
  ReportMeta,
  ScoreData,
  ScoreBand,
  VisibilityAssessmentSection,
  PlatformAssessmentRow,
  PlatformStatus,
  DiagnosisSection,
  FailureModeKey,
  PlatformPrioritySection,
  PlatformPriorityRow,
  PlatformPriority,
  BuyerPresence,
  PositioningAssessmentSection,
  AlignmentLevel,
} from '@/lib/reportTypes';
import {
  getVisibilityScore,
  getIndustryBenchmark,
  getAllCompetitors,
  inferBusinessModel,
} from '@/lib/scoring';

// ─── Score band ───────────────────────────────────────────────────────────────

function scoreToBand(score: number): ScoreBand {
  if (score <= 20) return 'Critical';
  if (score <= 40) return 'Low';
  if (score <= 60) return 'Developing';
  if (score <= 75) return 'Established';
  return 'Strong';
}

// ─── Section 1 — Visibility Assessment ───────────────────────────────────────

function buildS1Summary(
  aiPresence: string,
  entity: string,
  testedPlatforms: string[],
  industry: string,
): string {
  const platformMention =
    testedPlatforms.length === 1 ? ` in ${testedPlatforms[0]}` :
    testedPlatforms.length >= 2  ? ` in ${testedPlatforms.slice(0, 2).join(' and ')}` : '';

  switch (aiPresence) {
    case 'Yes — and the results were accurate':
      return `Based on your self-reported testing${platformMention}, our analysis suggests ${entity} is currently being cited. The untested platforms below represent gaps worth verifying.`;
    case "Yes — but I wasn't mentioned at all":
      return `Based on your testing${platformMention}, our analysis suggests ${entity} is not currently being surfaced when buyers ask AI tools for recommendations in ${industry}.`;
    case 'Yes — competitors were cited instead of me':
      return `Based on your testing${platformMention}, our analysis suggests competitors are being cited in place of ${entity}. Their content structure and authority signals likely favour them at present.`;
    case 'Yes — but details about me were wrong':
      return `Based on your testing${platformMention}, our analysis suggests ${entity} is appearing with inaccurate or outdated details — which may be eroding trust even when you do appear.`;
    case 'Yes — but old/outdated info appeared':
      return `Based on your testing${platformMention}, our analysis suggests AI platforms are drawing on outdated information about ${entity}, which could misrepresent your current positioning to buyers.`;
    default:
      return `You have not yet tested your AI visibility. Our analysis is based on typical patterns for ${industry}; testing would confirm or revise this picture.`;
  }
}
function mapAiPresenceToStatus(aiPresence: string): PlatformStatus {
  switch (aiPresence) {
    case 'Yes — and the results were accurate':        return 'likely-present';
    case 'Yes — competitors were cited instead of me': return 'competitor-cited';
    case 'Yes — but I wasn\'t mentioned at all':       return 'likely-absent';
    case 'Yes — but details about me were wrong':      return 'cited-with-issues';
    case 'Yes — but old/outdated info appeared':       return 'cited-with-issues';
    default:                                           return 'not-tested';
  }
}

function noteForTestedPlatform(aiPresence: string, platform: string): string {
  switch (aiPresence) {
    case 'Yes — and the results were accurate':
      return `You tested ${platform} — our analysis suggests you are currently cited accurately.`;
    case 'Yes — competitors were cited instead of me':
      return `You tested ${platform} — our analysis suggests competitors are being cited in your place.`;
    case 'Yes — but I wasn\'t mentioned at all':
      return `You tested ${platform} — our analysis suggests you are not currently cited.`;
    case 'Yes — but details about me were wrong':
      return `You tested ${platform} — our analysis suggests you appear with inaccurate details.`;
    case 'Yes — but old/outdated info appeared':
      return `You tested ${platform} — our analysis suggests outdated information is being surfaced.`;
    default:
      return `Not yet checked.`;
  }
}

// All major AI platforms we surface in the report
const ALL_PLATFORMS = [
  'ChatGPT',
  'Perplexity',
  'Google AI Overviews',
  'Microsoft Copilot',
  'Claude',
  'Gemini',
];

// "Not yet checked" notes are derived from PLATFORM_DEFS rationale (defined in S3 below)
// so S1 and S3 stay in sync automatically.
// Forward-referenced — buildPlatformRows is called after PLATFORM_DEFS is defined.
function buildPlatformRows(
  aiPresence: string,
  testedPlatforms: string[],
  family: IndustryFamily2,
): PlatformAssessmentRow[] {
  const testedSet = new Set(testedPlatforms.map((p) => p.toLowerCase()));
  const status    = mapAiPresenceToStatus(aiPresence);
  const hasTested = aiPresence !== "No, I haven't tried this yet" && testedPlatforms.length > 0;

  return ALL_PLATFORMS.map((platform) => {
    if (hasTested && testedSet.has(platform.toLowerCase())) {
      return { platform, status, note: noteForTestedPlatform(aiPresence, platform) };
    }
    // Pull rationale from the already-industry-specific S3 definitions
    const def = PLATFORM_DEFS[family]?.[platform];
    const note = def
      ? `Not yet checked. ${def.rationale('')}`
      : 'Not yet checked.';
    return { platform, status: 'not-tested' as PlatformStatus, note };
  });
}

function buildS1(formData: FormData, entity: string): VisibilityAssessmentSection {
  const testedPlatforms = formData.platforms?.map((p) => p.value) ?? [];
  const family          = getIndustryFamily(formData.industry);

  return {
    headline:  'Current Visibility Assessment',
    summary:   buildS1Summary(formData.aiPresence, entity, testedPlatforms, formData.industry),
    platforms: buildPlatformRows(formData.aiPresence, testedPlatforms, family),
    assessmentCaveat:
      'Statuses above are based on your self-reported testing and are assessments, not live measurements. The full report includes engine-verified citation tests across all platforms.',
  };
}

// ─── Section 2 — Failure Mode Diagnosis ──────────────────────────────────────

interface FailureModeDef {
  key: FailureModeKey;
  label: string;
  severity: 'high' | 'medium' | 'low';
  headline: (entity: string) => string;
  explanation: (entity: string, industry: string) => string;
  rootCauses: (entity: string, positioning: string, competitors: string[]) => string[];
  likelyImpact: (entity: string, industry: string) => string;
}

const FAILURE_MODES: Record<string, FailureModeDef> = {
  'not-cited': {
    key: 'not-cited',
    label: 'Not being cited',
    severity: 'high',
    headline: (e) => `Likely failure mode: ${e} absent from AI results entirely`,
    explanation: (e, ind) =>
      `Based on your reported experience, our analysis suggests ${e} is not appearing in AI responses to relevant buyer queries in ${ind}. This is not the same as being unknown — it likely means the content structure and citation signals AI engines rely on are not yet in place.`,
    rootCauses: (e, pos, _comp) => [
      `Content on ${e}'s website likely does not directly answer the specific questions buyers ask AI tools in your category${pos ? ` — such as queries aligned with "${pos}"` : ''}.`,
      `AI engines cross-reference brands against external sources before citing them. Third-party coverage of ${e} in analyst reviews, industry publications, and directory listings may be limited.`,
      `The entity description across your web properties may not be consistent enough for AI engines to form a reliable, confident picture of what ${e} does and who it serves.`,
    ],
    likelyImpact: (e, ind) =>
      `When a buyer in ${ind} asks an AI tool for recommendations in your category, ${e} is likely not in the response — regardless of how strong your actual offering is.`,
  },
  'competitor-displaced': {
    key: 'competitor-displaced',
    label: 'Displaced by competitors',
    severity: 'high',
    headline: (e) => `Likely failure mode: competitors cited ahead of ${e}`,
    explanation: (e, ind) =>
      `Based on your reported experience, our analysis suggests competitors are being cited in place of ${e} when buyers ask AI tools for recommendations in ${ind}. This typically signals a content structure or authority gap — not a product gap.`,
    rootCauses: (e, pos, comp) => [
      comp.length > 0
        ? `${comp.slice(0, 2).join(' and ')} likely ${comp.length === 1 ? 'has' : 'have'} stronger cross-platform citation signals — appearing in more third-party reviews, analyst coverage, and structured directory listings than ${e}.`
        : `Your competitors likely have stronger cross-platform citation signals — appearing in more third-party reviews, analyst coverage, and structured directory listings than ${e}.`,
      `${e}'s website may not be directly answering the buyer questions AI engines are optimising for${pos ? `, particularly queries related to "${pos}"` : ''}.`,
      `AI engines tend to default to brands they have seen cited repeatedly across multiple independent sources. Increasing the volume and consistency of external citations for ${e} is likely the primary lever.`,
    ],
    likelyImpact: (e, ind) =>
      `Buyers asking AI tools for ${ind} recommendations are landing on your competitors — not ${e}. This displacement compounds over time as AI engines reinforce established citation patterns.`,
  },
  'cited-inaccurately': {
    key: 'cited-inaccurately',
    label: 'Cited with inaccurate details',
    severity: 'medium',
    headline: (e) => `Likely failure mode: ${e} cited with incorrect information`,
    explanation: (e, _ind) =>
      `Based on your reported experience, our analysis suggests AI platforms are surfacing ${e} with inaccurate or misleading details. Appearing with wrong information can be more damaging than not appearing at all — it creates a false first impression for buyers.`,
    rootCauses: (e, pos, _comp) => [
      `AI engines likely pulled their description of ${e} from an early or outdated web page. If your positioning has evolved${pos ? ` — for example, towards "${pos}"` : ''}, old pages may still be the primary source.`,
      `Inconsistent descriptions across your website, G2 profile, LinkedIn Company page, and press coverage make it harder for AI engines to form a confident, accurate picture of ${e}.`,
      `Structured data (Organisation schema, FAQ schema) is likely absent from your website, which would otherwise give AI engines a definitive, controlled description of what ${e} does.`,
    ],
    likelyImpact: (e, _ind) =>
      `Buyers who encounter ${e} in AI responses may receive a misleading or outdated description — potentially dismissing you before they engage. Correcting this requires both on-site and off-site signals.`,
  },
  'cited-stale': {
    key: 'cited-stale',
    label: 'Cited with outdated information',
    severity: 'medium',
    headline: (e) => `Likely failure mode: ${e} cited with outdated information`,
    explanation: (e, _ind) =>
      `Based on your reported experience, our analysis suggests AI platforms are drawing on old content about ${e}. Stale citations can misrepresent your current positioning, products, or market focus to buyers doing AI-assisted research.`,
    rootCauses: (e, pos, _comp) => [
      `Old blog posts, press releases, or directory listings are likely outranking your updated content in AI training and retrieval signals. ${e}'s most recent positioning${pos ? ` — "${pos}"` : ''} may not yet be reflected in what AI engines cite.`,
      `Your website's structured data (if any) may reference old product names, categories, or service descriptions that no longer reflect what ${e} offers.`,
      `Third-party sources (review sites, analyst write-ups) that reference ${e} may not have been updated, and AI engines may be weighting these over your own current content.`,
    ],
    likelyImpact: (e, _ind) =>
      `Buyers using AI tools to research ${e} may be presented with outdated information — including old pricing tiers, discontinued products, or superseded positioning. This erodes confidence at the point of first discovery.`,
  },
  'untested': {
    key: 'untested',
    label: 'Visibility untested',
    severity: 'low',
    headline: (e) => `Likely failure mode: ${e}'s AI visibility is an unknown baseline`,
    explanation: (e, ind) =>
      `You have not yet tested how ${e} appears in AI responses. For ${ind}, AI tools are increasingly used in the buyer research and vendor evaluation process. Without a baseline, it is difficult to know whether gaps exist — or how significant they are.`,
    rootCauses: (e, pos, _comp) => [
      `Without testing, we cannot confirm whether ${e} appears in AI responses to buyer queries${pos ? `, including those related to "${pos}"` : ''} — or whether competitors are being cited instead.`,
      `Most brands in established industries discover they are either absent or cited with inaccuracies when they test for the first time. The absence of a test does not mean the absence of a problem.`,
      `AI engines update their citation patterns as new content, reviews, and external signals are indexed. Establishing a baseline now makes it possible to measure the impact of changes.`,
    ],
    likelyImpact: (e, ind) =>
      `Without a tested baseline, any buyer using AI to research ${ind} vendors could be landing on competitors rather than ${e} — and you would have no way to know.`,
  },
};

function getFailureMode(aiPresence: string, visibilityGap: string): FailureModeDef {
  if (aiPresence === "No, I haven't tried this yet") return FAILURE_MODES['untested'];
  if (aiPresence === 'Yes — competitors were cited instead of me') return FAILURE_MODES['competitor-displaced'];
  if (aiPresence === 'Yes — but details about me were wrong') return FAILURE_MODES['cited-inaccurately'];
  if (aiPresence === 'Yes — but old/outdated info appeared') return FAILURE_MODES['cited-stale'];
  if (aiPresence === "Yes — but I wasn't mentioned at all") return FAILURE_MODES['not-cited'];

  // Fallback: infer from visibility gap
  if (visibilityGap === 'competitors-cited') return FAILURE_MODES['competitor-displaced'];
  if (visibilityGap === 'inaccurate-info')   return FAILURE_MODES['cited-inaccurately'];
  return FAILURE_MODES['not-cited'];
}

function buildS2(formData: FormData, entity: string): DiagnosisSection {
  const competitors = getAllCompetitors(formData.competitors);
  const mode = getFailureMode(formData.aiPresence, formData.visibilityGap ?? '');

  return {
    failureMode: mode.key,
    modeLabel:   mode.label,
    severity:    mode.severity,
    headline:    mode.headline(entity),
    explanation: mode.explanation(entity, formData.industry),
    rootCauses:  mode.rootCauses(entity, formData.positioning ?? '', competitors),
    likelyImpact: mode.likelyImpact(entity, formData.industry),
  };
}

// ─── Section 3 — Platform Priority Overview ───────────────────────────────────

interface PlatformDef {
  priority: PlatformPriority;
  rationale: (industry: string) => string;
  buyerPresence: BuyerPresence;
}

type IndustryFamily2 = 'tech' | 'healthcare' | 'industrial' | 'professional' | 'insurance' | 'b2g' | 'consumer' | 'b2b';

function getIndustryFamily(industry: string): IndustryFamily2 {
  const TECH = new Set(['B2B SaaS / Enterprise Software', 'Cybersecurity', 'Cloud Infrastructure & DevOps', 'Cloud Infrastructure', 'AI & Machine Learning', 'Marketing Technology', 'Fintech / Financial Technology']);
  const HEALTHCARE = new Set(['Healthcare & Life Sciences', 'Healthcare Technology / Digital Health', 'Pharmaceuticals & Biotech']);
  const INDUSTRIAL = new Set(['Manufacturing & Industrial', 'Logistics & Supply Chain', 'Architecture, Engineering & Construction', 'Energy & Utilities', 'Telecommunications']);
  // Insurance split out: has both consumer (individual policies) and B2B (corporate risk) buyer patterns
  const INSURANCE = new Set(['Insurance']);
  const PROFESSIONAL = new Set(['Legal & Legal Services', 'Legal', 'Accounting & Finance', 'Financial Services & Banking', 'Human Resources & Recruitment', 'Consulting & Advisory', 'Professional Services']);
  const B2G = new Set(['Defense & Government Systems', 'Defense', 'Aviation, ATC & Aerospace', 'Aviation & Aerospace']);
  const CONSUMER = new Set(['Retail & E-commerce', 'Hospitality & Travel', 'Real Estate & Property', 'Media & Publishing', 'Education & Training']);
  if (TECH.has(industry))         return 'tech';
  if (HEALTHCARE.has(industry))   return 'healthcare';
  if (INDUSTRIAL.has(industry))   return 'industrial';
  if (INSURANCE.has(industry))    return 'insurance';
  if (PROFESSIONAL.has(industry)) return 'professional';
  if (B2G.has(industry))          return 'b2g';
  if (CONSUMER.has(industry))     return 'consumer';
  return 'b2b';
}

const PLATFORM_DEFS: Record<IndustryFamily2, Record<string, PlatformDef>> = {
  tech: {
    'ChatGPT':             { priority: 'primary',   rationale: (_) => 'The dominant AI tool for B2B software evaluation. Technical and commercial buyers use it heavily for vendor comparisons, feature lists, and category research.', buyerPresence: 'high' },
    'Perplexity':          { priority: 'primary',   rationale: (_) => 'Widely used by technical buyers and product evaluators in B2B SaaS. Often used for structured comparisons and detailed vendor research.', buyerPresence: 'high' },
    'Google AI Overviews': { priority: 'secondary', rationale: (_) => 'Appears in search results for category queries. Important for buyers starting a vendor search via Google before going deeper.', buyerPresence: 'medium' },
    'Microsoft Copilot':   { priority: 'secondary', rationale: (_) => 'Growing use in enterprise procurement workflows. Relevant for larger deals where buyers work within Microsoft 365.', buyerPresence: 'medium' },
    'Claude':              { priority: 'monitor',   rationale: (_) => 'Used by technical evaluators and engineering-led buyers. Worth monitoring as adoption in B2B evaluation grows.', buyerPresence: 'low' },
    'Gemini':              { priority: 'monitor',   rationale: (_) => 'Lower penetration in B2B SaaS buyer research today. Worth a baseline check but not a primary focus.', buyerPresence: 'low' },
  },
  healthcare: {
    'ChatGPT':             { priority: 'primary',   rationale: (_) => 'Widely used by clinical and procurement teams for vendor research, compliance queries, and solution comparisons.', buyerPresence: 'high' },
    'Perplexity':          { priority: 'primary',   rationale: (_) => 'Used by healthcare researchers and clinical evaluators who need cited, structured information.', buyerPresence: 'high' },
    'Google AI Overviews': { priority: 'secondary', rationale: (_) => 'Influential for initial category discovery by procurement and clinical decision-makers starting a vendor search.', buyerPresence: 'medium' },
    'Microsoft Copilot':   { priority: 'secondary', rationale: (_) => 'Increasing use in NHS, hospital systems, and health tech procurement teams embedded in Microsoft environments.', buyerPresence: 'medium' },
    'Claude':              { priority: 'monitor',   rationale: (_) => 'Adopted by technically-led health tech evaluators. Lower current reach but growing in clinical research contexts.', buyerPresence: 'low' },
    'Gemini':              { priority: 'monitor',   rationale: (_) => 'Limited penetration in healthcare buyer research. Worth a baseline check for future positioning.', buyerPresence: 'low' },
  },
  industrial: {
    'ChatGPT':             { priority: 'primary',   rationale: (_) => 'Used by operations and procurement teams for vendor discovery, specification research, and comparison across industrial categories.', buyerPresence: 'high' },
    'Google AI Overviews': { priority: 'primary',   rationale: (_) => 'High relevance for industrial buyers who begin searches on Google before engaging vendors directly.', buyerPresence: 'high' },
    'Perplexity':          { priority: 'secondary', rationale: (_) => 'Used by engineering and technical buyers in industrial sectors for detailed research. Growing adoption.', buyerPresence: 'medium' },
    'Microsoft Copilot':   { priority: 'secondary', rationale: (_) => 'Relevant for procurement teams in large industrial organisations embedded in Microsoft environments.', buyerPresence: 'medium' },
    'Claude':              { priority: 'monitor',   rationale: (_) => 'Lower current adoption in industrial procurement. Worth monitoring as enterprise AI adoption grows.', buyerPresence: 'low' },
    'Gemini':              { priority: 'monitor',   rationale: (_) => 'Limited penetration in industrial buyer research today. Worth a baseline check.', buyerPresence: 'low' },
  },
  professional: {
    'ChatGPT':             { priority: 'primary',   rationale: (_) => 'Frequently used by business leaders and decision-makers researching professional service providers, advisors, and specialist firms.', buyerPresence: 'high' },
    'Perplexity':          { priority: 'primary',   rationale: (_) => 'Used by informed buyers who want cited, structured answers when evaluating professional services firms.', buyerPresence: 'high' },
    'Google AI Overviews': { priority: 'secondary', rationale: (_) => 'Relevant for buyers who begin their search on Google. Appearing in AI overviews for category queries builds early visibility.', buyerPresence: 'medium' },
    'Microsoft Copilot':   { priority: 'secondary', rationale: (_) => 'Growing use among corporate and enterprise buyers embedded in Microsoft 365 workflows.', buyerPresence: 'medium' },
    'Claude':              { priority: 'monitor',   rationale: (_) => 'Used by analytically-minded senior decision-makers. Worth monitoring as professional service buyers increase AI use.', buyerPresence: 'low' },
    'Gemini':              { priority: 'monitor',   rationale: (_) => 'Currently lower penetration in professional services research. Worth a baseline check.', buyerPresence: 'low' },
  },
  // Insurance has dual buyer patterns: individual consumers (policy comparison, coverage queries)
  // and corporate buyers (risk managers, CFOs evaluating commercial cover). Google AI Overviews
  // is primary because consumers routinely Google "best car insurance", "life insurance comparison".
  insurance: {
    'ChatGPT':             { priority: 'primary',   rationale: (_) => 'Used by both individual consumers comparing policies and corporate buyers evaluating commercial insurance. High buyer presence across personal and business segments.', buyerPresence: 'high' },
    'Google AI Overviews': { priority: 'primary',   rationale: (_) => 'Critical for insurance — consumers routinely search for policy comparisons, insurer reviews, and coverage queries on Google. AI overviews dominate these results.', buyerPresence: 'high' },
    'Perplexity':          { priority: 'secondary', rationale: (_) => 'Used by corporate risk managers, brokers, and informed buyers researching insurers, coverage options, and market comparisons.', buyerPresence: 'medium' },
    'Gemini':              { priority: 'secondary', rationale: (_) => 'Integrated into Google consumer products — meaningful reach for individual insurance buyers. Worth testing alongside Google AI Overviews.', buyerPresence: 'medium' },
    'Microsoft Copilot':   { priority: 'secondary', rationale: (_) => 'Relevant for corporate buyers and risk teams in Microsoft 365 environments evaluating business insurance and specialist cover.', buyerPresence: 'medium' },
    'Claude':              { priority: 'monitor',   rationale: (_) => 'Lower current adoption in insurance buyer research. Worth monitoring as enterprise AI use in risk management grows.', buyerPresence: 'low' },
  },
  b2g: {
    'ChatGPT':             { priority: 'secondary', rationale: (_) => 'Used by procurement researchers for initial vendor longlisting and capability scoping, though formal tender processes dominate selection.', buyerPresence: 'medium' },
    'Perplexity':          { priority: 'secondary', rationale: (_) => 'Adopted by procurement and policy analysts for structured, cited research. Relevant for capability and market analysis phases.', buyerPresence: 'medium' },
    'Google AI Overviews': { priority: 'primary',   rationale: (_) => 'Government and defence procurement researchers often begin vendor scoping on Google. Appearing in AI overviews is a longlisting signal.', buyerPresence: 'high' },
    'Microsoft Copilot':   { priority: 'primary',   rationale: (_) => 'High relevance in government and defence procurement environments where Microsoft 365 is the standard productivity stack.', buyerPresence: 'high' },
    'Claude':              { priority: 'monitor',   rationale: (_) => 'Increasing adoption in security-cleared and technical government roles. Worth monitoring for emerging procurement research use.', buyerPresence: 'low' },
    'Gemini':              { priority: 'monitor',   rationale: (_) => 'Limited current use in B2G procurement research. Baseline check recommended.', buyerPresence: 'low' },
  },
  consumer: {
    'ChatGPT':             { priority: 'primary',   rationale: (_) => 'Increasingly used by consumers for product and service recommendations, comparison shopping, and decision support.', buyerPresence: 'high' },
    'Google AI Overviews': { priority: 'primary',   rationale: (_) => 'Dominant for consumer searches. Appearing in AI overviews for category queries is essential for discovery.', buyerPresence: 'high' },
    'Perplexity':          { priority: 'secondary', rationale: (_) => 'Used by research-oriented consumers for detailed product and service comparisons.', buyerPresence: 'medium' },
    'Gemini':              { priority: 'secondary', rationale: (_) => 'Integrated into Google consumer products — growing relevance for consumer-facing brands.', buyerPresence: 'medium' },
    'Microsoft Copilot':   { priority: 'monitor',   rationale: (_) => 'Lower adoption for consumer research today. Worth a baseline check.', buyerPresence: 'low' },
    'Claude':              { priority: 'monitor',   rationale: (_) => 'Lower adoption for consumer purchasing research. Worth monitoring as adoption grows.', buyerPresence: 'low' },
  },
  b2b: {
    'ChatGPT':             { priority: 'primary',   rationale: (_) => 'The dominant AI tool for business buyer research. Used across industries for vendor comparison, problem framing, and solution discovery.', buyerPresence: 'high' },
    'Perplexity':          { priority: 'primary',   rationale: (_) => 'Used by informed business buyers who want structured, cited research on vendors and categories.', buyerPresence: 'high' },
    'Google AI Overviews': { priority: 'secondary', rationale: (_) => 'Relevant for buyers who begin their research on Google. AI overviews increasingly shape the first impression of a brand.', buyerPresence: 'medium' },
    'Microsoft Copilot':   { priority: 'secondary', rationale: (_) => 'Growing adoption in B2B procurement and evaluation workflows. Relevant for enterprise and mid-market buyers.', buyerPresence: 'medium' },
    'Claude':              { priority: 'monitor',   rationale: (_) => 'Adopted by analytically-minded business buyers. Worth monitoring as enterprise AI use grows.', buyerPresence: 'low' },
    'Gemini':              { priority: 'monitor',   rationale: (_) => 'Lower penetration in B2B buyer research today. Worth a baseline check.', buyerPresence: 'low' },
  },
};

function buildS3(formData: FormData): PlatformPrioritySection {
  const family = getIndustryFamily(formData.industry);
  const defs = PLATFORM_DEFS[family];

  const platforms: PlatformPriorityRow[] = ALL_PLATFORMS.map((p) => {
    const def = defs[p] ?? { priority: 'monitor' as PlatformPriority, rationale: () => 'Worth a baseline check for your sector.', buyerPresence: 'low' as BuyerPresence };
    return {
      platform:      p,
      priority:      def.priority,
      rationale:     def.rationale(formData.industry),
      buyerPresence: def.buyerPresence,
    };
  });

  return {
    headline: 'Platform Priority Overview',
    summary:
      `Our analysis suggests where to focus first based on your industry, buyer model, and where AI platforms see the most buyer activity for ${formData.industry}. These are qualitative priorities — platform-by-platform citation measurements are in the full report.`,
    platforms,
    priorityNote:
      `Platform priority is based on reported buyer behaviour patterns in ${formData.industry}, not live citation measurements. Your full report includes verified citation rates per platform.`,
  };
}

// ─── Section 4 — Positioning Assessment ──────────────────────────────────────

function assessAlignmentLevel(positioning: string, industry: string): { level: AlignmentLevel; label: string } {
  if (!positioning || positioning.trim().length < 10) {
    return { level: 'missing', label: 'No positioning statement provided — cannot assess alignment' };
  }

  const words = positioning.trim().split(/\s+/).length;
  const lower = positioning.toLowerCase();

  // Weak: generic or vague (short, no specifics)
  const genericTerms = ['best', 'leading', 'top', 'great', 'excellent', 'innovative', 'world-class'];
  const hasGeneric = genericTerms.some((t) => lower.includes(t));
  const hasSpecificBuyer = /\b(for|to|serving|helping)\b/i.test(positioning);
  const hasSpecificUseCase = words >= 6;

  if (!hasSpecificBuyer && !hasSpecificUseCase) {
    return { level: 'weak', label: 'Weak alignment — positioning is too generic to own a clear AI citation category' };
  }
  if (hasGeneric || !hasSpecificBuyer) {
    return { level: 'partial', label: 'Partial alignment — positioning has direction but needs sharper specificity' };
  }
  if (hasSpecificBuyer && hasSpecificUseCase && !hasGeneric) {
    return { level: 'strong', label: 'Strong alignment — positioning is specific enough to anchor AI citation targeting' };
  }
  return { level: 'partial', label: 'Partial alignment — positioning has direction but needs sharper specificity' };
}

function buildS4(formData: FormData, entity: string): PositioningAssessmentSection {
  const positioning = formData.positioning?.trim() ?? '';
  const { level, label } = assessAlignmentLevel(positioning, formData.industry);
  const businessModel = inferBusinessModel(formData.industry);

  const buyerTerm = businessModel === 'B2G' ? 'procurement teams' : businessModel === 'B2C' ? 'consumers' : 'buyers';

  const sectorContext = `In ${formData.industry}, AI engines most reliably cite vendors who own a specific, narrow category claim and have external validation of that claim across reviews, analyst coverage, and third-party sources.`;

  const observations: string[] = [];
  const opportunities: string[] = [];

  if (!positioning || positioning.length < 10) {
    observations.push(
      `No positioning phrase was provided. Without a clear category claim, it is difficult for AI engines to associate ${entity} with a specific buyer need or query type.`,
      `AI engines default to brands with clear, consistent positioning across multiple sources. Without a statement to anchor against, ${entity} is competing against all vendors in ${formData.industry}.`,
    );
    opportunities.push(
      `Defining a specific, buyer-outcome-focused positioning phrase — such as "the [specialist] [buyer type] rely on for [specific outcome]" — would give you an anchor for all AI citation work.`,
      `Once defined, the positioning should appear consistently across your website, G2 or equivalent review profile, LinkedIn Company page, and press coverage.`,
    );
  } else {
    const lower = positioning.toLowerCase();
    const words = positioning.trim().split(/\s+/).length;
    const isShort = words < 6;
    const hasGeneric = ['best', 'leading', 'top', 'innovative', 'world-class'].some((t) => lower.includes(t));
    const hasBuyer = /\b(for|to|serving|helping)\b/i.test(positioning);

    if (isShort) {
      observations.push(`The phrase "${positioning}" is concise but may be too brief to differentiate ${entity} from competitors in AI citation contexts. Specificity about the buyer and outcome typically performs better.`);
    }
    if (hasGeneric) {
      observations.push(`Terms like "best" or "leading" appear frequently across vendors in ${formData.industry}. AI engines struggle to differentiate between them without more specific, substantiated claims.`);
    }
    if (!hasBuyer) {
      observations.push(`The positioning does not yet name a specific buyer type or segment. Adding this — for example, "…for [specific buyer role or company stage]" — would narrow the competition set AI engines need to choose from.`);
    }
    if (level === 'strong') {
      observations.push(`"${positioning}" is a specific and differentiated claim. The opportunity is to ensure this exact framing appears consistently across all your external sources — not just your website.`);
    }

    opportunities.push(
      hasBuyer
        ? `Ensure "${positioning}" (or a closely matching version) appears consistently across your website, ${formData.industry.includes('SaaS') || formData.industry.includes('Tech') || formData.industry.includes('AI') ? 'G2' : 'review'} profile, LinkedIn Company page, and press releases. Consistency is the primary AI citation signal.`
        : `Adding a specific ${buyerTerm} segment to your positioning — for example, "…for [buyer role] in [company type or sector]" — would create a more targetable category claim.`,
      `Structured FAQ content answering queries buyers in ${formData.industry} ask AI tools — and naming ${entity} explicitly in the answers — directly addresses the format AI engines prefer for citations.`,
    );
  }

  return {
    headline: 'Positioning vs. Sector Assessment',
    entityPositioning: positioning || '(no positioning phrase provided)',
    sectorContext,
    alignmentLevel: level,
    alignmentLabel: label,
    observations,
    opportunities,
    assessmentCaveat:
      `This assessment is based on your stated positioning and general patterns in ${formData.industry} — not a measured audit of how AI engines currently describe ${entity}. Your full report includes that audit.`,
  };
}

// ─── Score ────────────────────────────────────────────────────────────────────

function buildScore(formData: FormData): ScoreData {
  const competitors = getAllCompetitors(formData.competitors);
  const score       = getVisibilityScore(formData.aiPresence, competitors);
  const benchAvg    = getIndustryBenchmark(formData.industry);
  const band        = scoreToBand(score);

  return {
    score,
    band,
    benchmarkAvg:   benchAvg,
    benchmarkLabel: `${formData.industry} average`,
    scoringNote:
      'Score estimated from your self-reported testing across the four visibility signals. A full measured assessment may differ.',
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildTeaserReport(
  formData: FormData,
  token: string,
  reportPrice: string,
  unlockUrl: string,
  calendlyUrl: string,
): ReportData {
  const entity   = formData.company?.trim() || formData.firstName;
  const meta: ReportMeta = {
    token,
    generatedAt: new Date().toISOString(),
    entityName:  entity,
    industry:    formData.industry,
    occupation:  formData.occupation,
    website:     formData.websiteUrl || null,
    paid:        false,
  };

  return {
    meta,
    score:        buildScore(formData),
    s1Visibility: buildS1(formData, entity),
    s2Diagnosis:  buildS2(formData, entity),
    s3Platforms:  buildS3(formData),
    s4Positioning: buildS4(formData, entity),
    s5Competitors:    null,
    s6PositioningGap: null,
    s7QueryGap:       null,
    s8ActionQueue:    null,
    reportPrice,
    unlockUrl,
    calendlyUrl,
  };
}
