// Shared scoring utilities — used by both the results page and email

import type { SignalBreakdown } from '@/lib/reportTypes';

// ─── 4-signal scoring — single source of truth ────────────────────────────────
// Per-signal point ladders live ONCE in these helpers. Both
// getVisibilityScore (number) and getScoreBreakdown (per-signal detail)
// read the same lookups, so they can never drift.

// Signal 1 — Platform presence
function signal1Points(awareness: string): number {
  if (awareness === 'Yes — and the results were accurate')        return 90;
  if (awareness === 'Yes — but old/outdated info appeared')       return 40;
  if (awareness === 'Yes — but details about me were wrong')      return 30;
  if (awareness === 'Yes — competitors were cited instead of me') return 15;
  if (awareness === "Yes — but I wasn't mentioned at all")        return 0;
  return 0;
}

// Signal 2 — Competitive displacement
function signal2Points(competitiveStanding: string): number {
  if (competitiveStanding === 'I usually show up — and ahead of competitors') return 90;
  if (competitiveStanding === 'I show up about as often as competitors')      return 60;
  if (competitiveStanding === 'Competitors often show up ahead of me')        return 30;
  if (competitiveStanding === 'Competitors show up, I rarely do')             return 5;
  if (competitiveStanding === "Not sure — I haven't looked into this")        return 0;
  return 0;
}

// Signal 3 — Query coverage
function signal3Points(queryCoverage: string): number {
  if (queryCoverage === 'Yes — for most things people ask about in my space') return 90;
  if (queryCoverage === 'Sometimes — for a few topics, but not most')         return 55;
  if (queryCoverage === 'Only when someone searches my exact name')           return 20;
  if (queryCoverage === "Not sure — I haven't looked into this")              return 0;
  return 0;
}

// Signal 4 — Cross-platform consistency
function signal4Points(platformConsistency: string): number {
  if (platformConsistency === "Yes — pretty consistently across the ones I've tried") return 100;
  if (platformConsistency === 'It varies a lot depending on the tool')                return 50;
  if (platformConsistency === "I've only really looked at one")                       return 25;
  if (platformConsistency === "Not sure — I haven't looked into this")                return 0;
  return 0;
}

// Weights — single source of truth, must equal 1.00 in total.
export const SIGNAL_WEIGHTS = {
  s1: 0.30, // Platform presence
  s2: 0.30, // Competitive displacement
  s3: 0.25, // Query coverage
  s4: 0.15, // Cross-platform consistency
} as const;

// ─── Public API ───────────────────────────────────────────────────────────────

export function getAllCompetitors(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(/[,;/\n&]/).map(c => c.replace(/\band\b/gi, '').trim()).filter(Boolean);
}

export function formatCompetitors(list: string[]): string {
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
}

// True 4-signal model — each signal is independently measured from its own form
// question. Returns the rounded 0–100 visibility score.
export function getVisibilityScore(
  awareness: string,
  competitiveStanding: string,
  queryCoverage: string,
  platformConsistency: string,
): number {
  const s1 = signal1Points(awareness);
  const s2 = signal2Points(competitiveStanding);
  const s3 = signal3Points(queryCoverage);
  const s4 = signal4Points(platformConsistency);
  return Math.round(
    s1 * SIGNAL_WEIGHTS.s1 +
    s2 * SIGNAL_WEIGHTS.s2 +
    s3 * SIGNAL_WEIGHTS.s3 +
    s4 * SIGNAL_WEIGHTS.s4
  );
}

// Per-signal breakdown for the "How this score is calculated" panel.
// Uses the EXACT same point lookups as getVisibilityScore — by design,
// not by duplication.
export function getScoreBreakdown(
  awareness: string,
  competitiveStanding: string,
  queryCoverage: string,
  platformConsistency: string,
): SignalBreakdown[] {
  const s1 = signal1Points(awareness);
  const s2 = signal2Points(competitiveStanding);
  const s3 = signal3Points(queryCoverage);
  const s4 = signal4Points(platformConsistency);
  const oneDecimal = (n: number) => Math.round(n * 10) / 10;
  return [
    {
      signal:       'Platform presence',
      weight:       SIGNAL_WEIGHTS.s1,
      userAnswer:   awareness,
      points:       s1,
      contribution: oneDecimal(s1 * SIGNAL_WEIGHTS.s1),
    },
    {
      signal:       'Competitive displacement',
      weight:       SIGNAL_WEIGHTS.s2,
      userAnswer:   competitiveStanding,
      points:       s2,
      contribution: oneDecimal(s2 * SIGNAL_WEIGHTS.s2),
    },
    {
      signal:       'Query coverage',
      weight:       SIGNAL_WEIGHTS.s3,
      userAnswer:   queryCoverage,
      points:       s3,
      contribution: oneDecimal(s3 * SIGNAL_WEIGHTS.s3),
    },
    {
      signal:       'Cross-platform consistency',
      weight:       SIGNAL_WEIGHTS.s4,
      userAnswer:   platformConsistency,
      points:       s4,
      contribution: oneDecimal(s4 * SIGNAL_WEIGHTS.s4),
    },
  ];
}

// Methodology metadata — surfaced on /methodology. Update on quarterly review.
export const BENCHMARK_METADATA = {
  generatedDate: '2026-01-01',
  methodology: 'Median AI citation rate across ChatGPT, Google AI Overviews, Perplexity',
  samplesPerIndustry: 50,
  confidenceLevel: '95%',
  nextReviewDate: '2026-07-01',
};

// ─── Industry benchmarks ──────────────────────────────────────────────────────
// Benchmarks represent the median AI citation rate observed across brands in
// each sector — based on Maxifi Digital's analysis of citation patterns.
// B2G and procurement-led sectors (Defense, Gov Systems) carry lower benchmarks
// because formal tender processes reduce AI-driven discovery relevance.

export const INDUSTRY_BENCHMARKS: Record<string, number> = {
  // Technology
  'B2B SaaS / Enterprise Software':        76,
  'Cybersecurity':                          74,
  'Cloud Infrastructure & DevOps':          74,
  'Cloud Infrastructure':                   74, // legacy compat
  'AI & Machine Learning':                  78,
  'Marketing Technology':                   63,

  // Financial
  'Financial Services & Banking':           47,
  'Fintech / Financial Technology':         52,
  'Insurance':                              44,
  'Accounting & Finance':                   47,

  // Professional Services
  'Professional Services':                  54,
  'Consulting & Advisory':                  54,
  'Legal & Legal Services':                 62,
  'Legal':                                  62, // legacy compat
  'Human Resources & Recruitment':          52,

  // Healthcare & Life Sciences
  'Healthcare & Life Sciences':             68,
  'Healthcare Technology / Digital Health': 72,
  'Pharmaceuticals & Biotech':              65,

  // Industrial & Infrastructure
  'Manufacturing & Industrial':             38,
  'Logistics & Supply Chain':               40,
  'Architecture, Engineering & Construction': 36,
  'Energy & Utilities':                     38,
  'Telecommunications':                     50,

  // Government & Defense (procurement-led — lower AI discovery relevance)
  'Aviation, ATC & Aerospace':              41,
  'Aviation & Aerospace':                   41, // legacy compat
  'Defense & Government Systems':           32,
  'Defense':                                35, // legacy compat

  // Consumer-facing
  'Retail & E-commerce':                    48,
  'Hospitality & Travel':                   42,
  'Real Estate & Property':                 35,
  'Media & Publishing':                     58,
  'Education & Training':                   52,
};

/**
 * Provides industry context for benchmark interpretation
 *
 * Distinguishes between:
 * - HIGH-benchmark industries (>50%): B2B, B2C where AI drives discovery
 * - LOW-benchmark industries (<40%): B2G, procurement-led where AI has limited role
 */
export function getBenchmarkContext(
  score: number,
  benchAvg: number,
  industry: string
): {
  gap: number;
  isLowBenchmark: boolean;
  contextExplanation: string;
  interpretation: string;
} {
  const gap = benchAvg - score;
  const isLowBenchmark = benchAvg < 40;

  let contextExplanation = '';
  let interpretation = '';

  if (isLowBenchmark) {
    // Defense, Aviation, Manufacturing, etc.
    contextExplanation = `${industry} has a low AI visibility benchmark (${benchAvg}%) because procurement and vendor evaluation processes rely on formal RFPs and vendor shortlisting, not AI discovery. AI plays a limited role in initial vendor research.`;

    if (gap > 0) {
      interpretation = `You are ${Math.abs(gap)} points below the benchmark. In low-benchmark sectors, this gap is less critical than in high-discovery industries. The opportunity is focused on the scenarios where AI IS used (e.g., competitive research, capability evaluation).`;
    } else {
      interpretation = `You are at or above the benchmark. This indicates strong positioning for AI visibility in a sector where AI plays a limited overall role.`;
    }
  } else {
    // B2B SaaS, Consulting, Legal, etc.
    contextExplanation = `${industry} has a high AI visibility benchmark (${benchAvg}%) because AI tools are frequently used by buyers to discover vendors, compare solutions, and evaluate options.`;

    if (gap > 0) {
      interpretation = `You are ${Math.abs(gap)} points below the benchmark. This gap represents measurable lost opportunities in buyer conversations that are mediated by AI tools.`;
    } else {
      interpretation = `You are at or above the benchmark. This indicates competitive AI visibility in a market where AI discovery is central to buyer research.`;
    }
  }

  return {
    gap,
    isLowBenchmark,
    contextExplanation,
    interpretation
  };
}

export function getIndustryBenchmark(industry: string): number {
  return INDUSTRY_BENCHMARKS[industry] ?? 40;
}

// ─── Business model inference ─────────────────────────────────────────────────
// Inferred from industry — used to adapt pipeline framing on the results page.

export type BusinessModel = 'B2B' | 'B2C' | 'B2G' | 'mixed';

const B2G_INDUSTRIES = new Set([
  'Defense & Government Systems', 'Defense',
  'Aviation, ATC & Aerospace', // partial B2G (ANSPs, defense)
]);
const B2C_INDUSTRIES = new Set([
  'Retail & E-commerce', 'Hospitality & Travel', 'Media & Publishing',
]);
const MIXED_INDUSTRIES = new Set([
  'Healthcare & Life Sciences', 'Education & Training',
  'Real Estate & Property', 'Financial Services & Banking',
  'Insurance', 'Telecommunications',
]);

export function inferBusinessModel(industry: string): BusinessModel {
  if (B2G_INDUSTRIES.has(industry)) return 'B2G';
  if (B2C_INDUSTRIES.has(industry))  return 'B2C';
  if (MIXED_INDUSTRIES.has(industry)) return 'mixed';
  return 'B2B';
}

// ─── Pipeline framing labels by business model ────────────────────────────────

export function getPipelineLabel(model: BusinessModel): {
  referral: string;
  referrals: string;
  action: string;
} {
  switch (model) {
    case 'B2G': return {
      referral:  'AI-assisted vendor shortlist entry',
      referrals: 'AI-assisted shortlisting opportunities',
      action:    'procurement teams using AI to build vendor longlists',
    };
    case 'B2C': return {
      referral:  'AI-assisted buyer recommendation',
      referrals: 'AI-assisted buyer recommendations',
      action:    'buyers asking AI for a recommendation',
    };
    case 'mixed': return {
      referral:  'AI-assisted discovery opportunity',
      referrals: 'AI-assisted discovery opportunities',
      action:    'buyers or procurement teams using AI to find providers',
    };
    default: return {
      referral:  'AI-assisted referral',
      referrals: 'AI-assisted referrals',
      action:    'potential buyers asking AI for a recommendation',
    };
  }
}

/**
 * Suggests which gap is most likely to be the actual constraint
 * based on user context clues
 */
export function predictPrimaryGap(
  awareness: string,
  competitors: string[],
  industry: string,
  daysSinceCompanyFounding?: number
): {
  gap: 'structure' | 'authority' | 'citations';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
} {
  const monthsOld = daysSinceCompanyFounding ? Math.floor(daysSinceCompanyFounding / 30) : null;

  // Signal 1: Very new companies (< 3 months)
  if (monthsOld && monthsOld < 3) {
    return {
      gap: 'authority',
      confidence: 'high',
      reasoning: `Company is very new (${monthsOld} months). AI systems likely haven't encountered enough training data about you yet. Structure fixes won't help until you have external presence.`
    };
  }

  // Signal 2: Displaced by competitors (not just invisible)
  if (awareness === 'Yes — competitors were cited instead of me') {
    return {
      gap: 'structure',
      confidence: 'medium',
      reasoning: `Competitors are actively displacing you. This usually indicates they have better content structure matching buyer language. Try structure fixes first (4-6 week test window).`
    };
  }

  // Signal 3: Completely invisible + established brand
  if (awareness === "Yes — but I wasn't mentioned at all" && monthsOld && monthsOld > 12) {
    return {
      gap: 'citations',
      confidence: 'medium',
      reasoning: `You're established but invisible. This suggests lack of third-party validation. Focus on PR, analyst relations, review platform presence.`
    };
  }

  // Signal 4: Inaccurate or outdated information being returned
  if (awareness === 'Yes — but details about me were wrong' ||
      awareness === 'Yes — but old/outdated info appeared') {
    return {
      gap: 'authority',
      confidence: 'medium',
      reasoning: `You have presence, but it's being described incorrectly or outdated. This is an authority consistency problem. You need to be the definitive source across web properties.`
    };
  }

  // Default: structure (most common reason for invisibility)
  return {
    gap: 'structure',
    confidence: 'low',
    reasoning: `Most commonly, invisibility is due to content structure. But confidence is low without additional context. Test structure fixes and measure impact.`
  };
}

/**
 * Estimates likelihood of brand appearing in buyer conversations
 *
 * METHODOLOGY:
 * Linear scale: conversationRate = score / 10
 * Maps 0-100% visibility score to 0-10 conversation likelihood
 *
 * CALIBRATION STATUS: Estimated (not validated against live AI data)
 * CONFIDENCE LEVEL: Theoretical (formula-based, not measured)
 *
 * RESEARCH NEEDED:
 * - Validate correlation between 4-signal visibility score and actual ChatGPT citation frequency
 * - Test if linear relationship holds across score ranges (0-20%, 50-70%, 90-100%)
 * - Adjust formula if correlation is non-linear
 * - Measure impact of query specificity on appearance rates
 *
 * KNOWN LIMITATIONS:
 * - Assumes linear correlation (may not hold at extremes)
 * - Based on theory, not live measurement
 * - Doesn't account for query specificity variance
 * - Single-vendor focused (only user's primary platform)
 * - Doesn't measure actual conversation impact (only likelihood)
 *
 * USE CASES:
 * ✓ "We estimate roughly X out of 10 relevant searches would include you"
 * ✗ "You guarantee to appear in X conversations" (DON'T claim this)
 * ✗ "Competitors appear in Y conversations" (Unvalidated)
 */
export function buyerConversations(score: number, benchAvg: number): { x: number; y: number } {
  const x = Math.max(0, Math.round(score / 10));
  const y = Math.max(1, Math.min(10, Math.round((benchAvg || 1) / 10)));
  return { x, y };
}
