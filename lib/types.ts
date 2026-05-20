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
  consent: false,
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  sessionId: '',
  timestamp: '',
};
