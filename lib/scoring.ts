// Shared scoring utilities — used by both the results page and email

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

export function getVisibilityScore(awareness: string, competitorList: string[]): number {
  const n = competitorList.length;
  const hasComp = n > 0;

  // Signal 1 — Platform presence (30%)
  const platform =
    awareness === 'Yes — and the results were accurate'        ? 90 :
    awareness === 'Yes — but old/outdated info appeared'       ? 40 :
    awareness === 'Yes — but details about me were wrong'      ? 30 :
    awareness === 'Yes — competitors were cited instead of me' ? 15 :
    awareness === "Yes — but I wasn't mentioned at all"        ? 0  : 0;

  // Signal 2 — Competitor displacement (30%)
  const displacement =
    awareness === "No, I haven't tried this yet"               ? 0  :
    awareness === 'Yes — and the results were accurate'        ? (hasComp ? 80 : 45) :
    awareness === 'Yes — competitors were cited instead of me' ? Math.max(0, 10 - n * 10) :
    awareness === "Yes — but I wasn't mentioned at all"        ? (hasComp ? 10 : 20) :
    hasComp ? 25 : 30; // outdated / wrong details

  // Signal 3 — Query coverage (25%)
  const query =
    awareness === 'Yes — and the results were accurate'        ? 90 :
    awareness === 'Yes — but old/outdated info appeared'       ? 35 :
    awareness === 'Yes — but details about me were wrong'      ? 25 :
    awareness === 'Yes — competitors were cited instead of me' ? 15 :
    awareness === "Yes — but I wasn't mentioned at all"        ? 0  : 0;

  // Signal 4 — Awareness consistency (15%)
  const consistency =
    awareness === 'Yes — and the results were accurate'        ? 100 :
    awareness === 'Yes — but old/outdated info appeared'       ? 40  :
    awareness === 'Yes — but details about me were wrong'      ? 20  :
    awareness === 'Yes — competitors were cited instead of me' ? 25  :
    awareness === "Yes — but I wasn't mentioned at all"        ? 0   : 0;

  return Math.round(platform * 0.30 + displacement * 0.30 + query * 0.25 + consistency * 0.15);
}

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
