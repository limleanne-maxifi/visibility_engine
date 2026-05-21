// Shared industry classification constants to eliminate duplication across codebase

export type IndustryFamily = 'defense' | 'aviation' | 'healthcare' | 'finance' | 'tech' | 'professional' | 'other';

export const INDUSTRY_FAMILIES = {
  defense: ['Defense & Government Systems', 'Defense'],
  aviation: ['Aviation, ATC & Aerospace', 'Aviation & Aerospace'],
  healthcare: ['Healthcare & Life Sciences', 'Healthcare Technology / Digital Health', 'Pharmaceuticals & Biotech'],
  finance: ['Financial Services & Banking', 'Insurance'],
  legal: ['Legal & Legal Services', 'Legal'],
  tech: [
    'B2B SaaS / Enterprise Software',
    'Cybersecurity',
    'Cloud Infrastructure & DevOps',
    'AI / LLM / Generative AI',
    'Data Analytics & BI',
  ],
  professional: [
    'Consulting & Professional Services',
    'Accounting & Audit',
    'Architecture & Engineering',
    'Executive Search / Recruiting',
    'PR & Media Relations',
  ],
} as const;

export function getIndustryFamily(industry: string): IndustryFamily {
  for (const [family, industries] of Object.entries(INDUSTRY_FAMILIES)) {
    if ((industries as readonly string[]).includes(industry)) {
      return family as IndustryFamily;
    }
  }
  return 'other';
}

export function isDefenseIndustry(industry: string): boolean {
  return (INDUSTRY_FAMILIES.defense as readonly string[]).includes(industry);
}

export function isAviationIndustry(industry: string): boolean {
  return (INDUSTRY_FAMILIES.aviation as readonly string[]).includes(industry);
}

export function isHealthcareIndustry(industry: string): boolean {
  return (INDUSTRY_FAMILIES.healthcare as readonly string[]).includes(industry);
}

export function isFinanceIndustry(industry: string): boolean {
  return (INDUSTRY_FAMILIES.finance as readonly string[]).includes(industry);
}

export function isLegalIndustry(industry: string): boolean {
  return (INDUSTRY_FAMILIES.legal as readonly string[]).includes(industry);
}

// Industry families for UI categorization (positioning examples, etc.)
export const AVIATION_INDUSTRIES = new Set(['Aviation, ATC & Aerospace', 'Aviation & Aerospace', 'Defense & Government Systems', 'Defense']);
export const TECH_INDUSTRIES = new Set(['B2B SaaS / Enterprise Software', 'Cybersecurity', 'Cloud Infrastructure & DevOps', 'Cloud Infrastructure', 'AI & Machine Learning', 'Fintech / Financial Technology', 'Marketing Technology']);
export const HEALTHCARE_INDUSTRIES = new Set(['Healthcare & Life Sciences', 'Healthcare Technology / Digital Health', 'Pharmaceuticals & Biotech']);
export const INDUSTRIAL_INDUSTRIES = new Set(['Manufacturing & Industrial', 'Logistics & Supply Chain', 'Architecture, Engineering & Construction', 'Energy & Utilities', 'Telecommunications']);
export const PROFESSIONAL_INDUSTRIES = new Set(['Legal & Legal Services', 'Legal', 'Accounting & Finance', 'Financial Services & Banking', 'Insurance', 'Human Resources & Recruitment']);

// Industries that require export control status disclosure
export const EXPORT_CONTROL_INDUSTRIES = new Set(['Defense & Government Systems', 'Defense', 'Aviation, ATC & Aerospace', 'Aviation & Aerospace']);

// Industries that require data residency declaration
export const DATA_RESIDENCY_INDUSTRIES = new Set(['Healthcare & Life Sciences', 'Healthcare Technology / Digital Health', 'Financial Services & Banking', 'Insurance']);

export function shouldShowExportStatus(industry: string): boolean {
  return EXPORT_CONTROL_INDUSTRIES.has(industry);
}

export function shouldShowDataResidency(industry: string): boolean {
  return DATA_RESIDENCY_INDUSTRIES.has(industry);
}

export function shouldShowPharmaRole(industry: string): boolean {
  return industry === 'Pharmaceuticals & Biotech';
}

export function shouldShowDefenseChannel(industry: string): boolean {
  return isDefenseIndustry(industry) || isAviationIndustry(industry);
}
