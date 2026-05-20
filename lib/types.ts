export type Occupation =
  | 'Executive / Founder'
  | 'Head of / VP'
  | 'Marketing & Communications'
  | 'Sales & Business Development'
  | 'Operations & Strategy'
  | 'Technology & Digital'
  | 'Finance'
  | 'Product & Innovation'
  | 'Other'
  | '';

// Phase 3: Positioning dimensions
export type PositioningDimension =
  | 'speed'
  | 'cost'
  | 'quality'
  | 'trust'
  | 'niche'
  | 'integration'
  | 'other'
  | '';

// Phase 3: Compliance certifications by sector
export type DefenseCertification =
  | 'ITAR'
  | 'EAR'
  | 'CMMC'
  | 'Common Criteria'
  | 'MIL-STD'
  | 'Other'
  | '';

export type HealthcareCertification =
  | 'HIPAA'
  | 'MHRA Approved'
  | 'FDA Cleared'
  | 'ISO 13485'
  | 'Other'
  | '';

export type FinanceCertification =
  | 'FCA Licensed'
  | 'PRA Regulated'
  | 'SOC 2'
  | 'PCI-DSS'
  | 'ISO 27001'
  | 'Other'
  | '';

export type AviationCertification =
  | 'DO-178C'
  | 'DO-254'
  | 'EASA Certified'
  | 'FAA Certified'
  | 'ICAO Compliant'
  | 'Other'
  | '';

// Phase 3: Export/regulatory context
export type ExportStatus =
  | 'Subject to ITAR / EAR restrictions'
  | 'No export restrictions'
  | 'Encrypted / anonymized data only'
  | 'Restricted to specific regions'
  | 'Unknown'
  | '';

export type DataResidency =
  | 'EU-only (GDPR)'
  | 'US-only (HIPAA)'
  | 'Global with DPA agreements'
  | 'Region-specific requirements'
  | 'Not data-handling relevant'
  | '';

// Phase 3: Structured competitors
export interface CompetitorsStructured {
  direct: string[]; // Direct competitors (same customer, same solution)
  indirect: string[]; // Indirect (adjacent solutions, alternatives)
  noteworthy?: string; // Special context (e.g., market dominance, new entrant)
}

// Phase 3: Competitor AI visibility
export type CompetitorAiPresence =
  | 'Competitors appear prominently in AI results'
  | 'Some competitors rank high on LinkedIn'
  | 'Competitors cited in analyst reports'
  | 'No clear competitor AI visibility yet'
  | 'Unknown'
  | '';

// Phase 3: Structured positioning
export interface PositioningStructured {
  dimension: PositioningDimension;
  statement: string; // e.g., "Fastest deployment in the market"
  proof?: string; // e.g., "Sub-1-hour setup vs competitor's 3 days"
}

export type AiPresence =
  | "No, I haven't tried this yet"
  | 'Yes — and the results were accurate'
  | 'Yes — but I wasn\'t mentioned at all'
  | 'Yes — but details about me were wrong'
  | 'Yes — competitors were cited instead of me'
  | 'Yes — but old/outdated info appeared'
  | '';

export type AeoOutcome =
  | "I'm not being cited at all"
  | 'My competitors are cited instead of me'
  | 'Outdated or inaccurate info appears about me'
  | 'I want to own specific queries or topics'
  | "I don't know where I currently stand"
  | '';

export type BusinessModelOverride = 'B2G' | 'B2B' | 'B2C' | 'mixed' | '';
export type PharmaRole = 'Drug Developer' | 'CRO / CMO' | 'Biotech Platform' | 'Other' | '';
export type DefenseChannel = 'Military' | 'Commercial Aviation' | 'Space / Satellite' | 'Mixed' | '';

export interface Platform {
  value: string;
  priority: 'primary' | 'secondary';
}

export interface FormData {
  // Step 1 — Identity
  firstName: string;
  email: string;
  websiteUrl: string;

  // Step 2 — Professional Context
  occupation: Occupation;
  industry: string;
  company: string;

  // Step 3 — AEO Awareness
  aiPresence: AiPresence;
  platforms: Platform[];

  // Step 4 — Goals
  challenges: string[];
  aeoOutcome: AeoOutcome;
  competitors: string;
  positioning: string;
  targetQueries: string;

  // Phase 2: Business Model & Sector Context (optional overrides)
  buyerModelPrimary?: BusinessModelOverride;
  pharmaRole?: PharmaRole;
  defenseChannel?: DefenseChannel;

  // Phase 3: Competitive Intelligence (structured, optional)
  competitorsStructured?: CompetitorsStructured;
  competitorAiPresence?: CompetitorAiPresence;

  // Phase 3: Positioning (structured, optional)
  positioningStructured?: PositioningStructured;

  // Phase 3: Compliance & Regulatory Context (optional, sector-dependent)
  defenseCertifications?: DefenseCertification[];
  healthcareCertifications?: HealthcareCertification[];
  financeCertifications?: FinanceCertification[];
  aviationCertifications?: AviationCertification[];
  exportStatus?: ExportStatus;
  dataResidency?: DataResidency;

  // Step 5 — Consent
  consent: boolean;

  // Hidden metadata
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  sessionId: string;
  timestamp: string;
}

export const initialFormData: FormData = {
  firstName: '',
  email: '',
  websiteUrl: '',
  occupation: '',
  industry: '',
  company: '',
  aiPresence: '',
  platforms: [],
  challenges: [],
  aeoOutcome: '',
  competitors: '',
  positioning: '',
  targetQueries: '',
  buyerModelPrimary: '',
  pharmaRole: '',
  defenseChannel: '',
  competitorsStructured: undefined,
  competitorAiPresence: '',
  positioningStructured: undefined,
  defenseCertifications: undefined,
  healthcareCertifications: undefined,
  financeCertifications: undefined,
  aviationCertifications: undefined,
  exportStatus: '',
  dataResidency: '',
  consent: false,
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  sessionId: '',
  timestamp: '',
};
