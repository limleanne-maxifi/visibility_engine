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

export const INDUSTRY_BENCHMARKS: Record<string, number> = {
  'Financial Services & Banking': 47, 'Fintech / Financial Technology': 47,
  'Accounting & Finance': 47,         'Legal': 62,
  'Professional Services': 54,        'Consulting & Advisory': 54,
  'Healthcare & Life Sciences': 78,   'B2B SaaS / Enterprise Software': 84,
  'AI & Machine Learning': 84,        'Cybersecurity': 84,
  'Cloud Infrastructure': 84,         'Marketing Technology': 63,
  'Aviation & Aerospace': 41,         'Defense': 41,
  'Education & Training': 52,         'Media & Publishing': 58,
  'Real Estate & Property': 35,       'Retail & E-commerce': 48,
  'Hospitality & Travel': 42,         'Manufacturing & Industrial': 38,
};

export function getIndustryBenchmark(industry: string): number {
  return INDUSTRY_BENCHMARKS[industry] ?? 38;
}

export function buyerConversations(score: number, benchAvg: number): { x: number; y: number } {
  const x = Math.max(0, Math.min(9, Math.round(score / 10)));
  const y = Math.max(1, Math.min(10, Math.round((benchAvg || 1) / 10)));
  return { x, y };
}
