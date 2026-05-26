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

// Visibility gap labels - shared across form, prompt builder, and email
export const VISIBILITY_GAP_LABELS: Record<VisibilityGap, string> = {
  'not-cited': "I'm not being cited at all",
  'competitors-cited': 'My competitors are cited instead of me',
  'inaccurate-info': 'Outdated or inaccurate info appears about me',
  'own-queries': 'I want to own specific queries or topics',
  'unknown-baseline': "I don't know where I currently stand",
  '': '',
};

// Regulated industries - shared across form validation and prompt building
export const REGULATED_INDUSTRIES = new Set([
  'Defense & Government Systems',
  'Defense', // legacy compat
  'Aviation, ATC & Aerospace',
  'Aviation & Aerospace', // legacy compat
  'Healthcare & Life Sciences',
  'Healthcare Technology / Digital Health',
  'Pharmaceuticals & Biotech',
  'Financial Services & Banking',
  'Insurance',
  'Legal & Legal Services',
  'Legal', // legacy compat
]);

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

// Phase 5: Visibility gap (primary diagnostic)
export type VisibilityGap =
  | 'not-cited'
  | 'competitors-cited'
  | 'inaccurate-info'
  | 'own-queries'
  | 'unknown-baseline'
  | '';

export type AiPresence =
  | "No, I haven't tried this yet"
  | 'Yes — and the results were accurate'
  | 'Yes — but I wasn\'t mentioned at all'
  | 'Yes — but details about me were wrong'
  | 'Yes — competitors were cited instead of me'
  | 'Yes — but old/outdated info appeared'
  | '';

// 4-signal model: Signal 2 — Competitive displacement (30%)
export type CompetitiveStanding =
  | "I appear prominently — competitors don't displace me"
  | 'I appear alongside competitors roughly equally'
  | 'Competitors occasionally appear ahead of me'
  | 'Competitors consistently appear, I rarely do'
  | "I haven't checked this"
  | '';

// 4-signal model: Signal 3 — Query coverage (25%)
export type QueryCoverage =
  | "I appear for most category and topic queries I've tested"
  | 'I appear for some queries but miss many category searches'
  | 'I only appear when my exact brand/company name is searched'
  | "I haven't tested multiple query types"
  | '';

// 4-signal model: Signal 4 — Cross-platform consistency (15%)
export type PlatformConsistency =
  | 'Yes — I appear consistently across all major AI platforms'
  | 'Yes — but results vary significantly by platform'
  | "I've only checked one platform"
  | "No — I haven't tested across platforms"
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

  // Step 3 — AEO Awareness (4-signal model)
  aiPresence: AiPresence;                    // Signal 1 — Platform presence (30%)
  competitiveStanding: CompetitiveStanding;  // Signal 2 — Competitive displacement (30%)
  queryCoverage: QueryCoverage;              // Signal 3 — Query coverage (25%)
  platformConsistency: PlatformConsistency;  // Signal 4 — Cross-platform consistency (15%)
  platforms: Platform[];

  // Step 4 — Visibility Gap & Goals
  visibilityGap?: VisibilityGap;
  challenges: string[];
  competitors: string;
  positioning: string;
  targetQueries: string;
  competitorPrimaryFocus?: string; // Phase 5: Which competitor is primary focus (for Gap 2)
  inaccuracyExamples?: string; // Phase 5: What inaccuracies noticed (for Gap 3)
  platformPreferences?: string[]; // Phase 5: Which platforms to prioritize

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
  competitiveStanding: '',
  queryCoverage: '',
  platformConsistency: '',
  platforms: [],
  challenges: [],
  competitors: '',
  positioning: '',
  targetQueries: '',
  visibilityGap: '',
  buyerModelPrimary: '',
  pharmaRole: '',
  defenseChannel: '',
  competitorsStructured: undefined,
  competitorAiPresence: '',
  competitorPrimaryFocus: '',
  inaccuracyExamples: '',
  platformPreferences: undefined,
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
