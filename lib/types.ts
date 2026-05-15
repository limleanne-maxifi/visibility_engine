export type Occupation =
  | 'Executive / Founder'
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
  | 'More leads from AI-referred traffic'
  | 'Credibility and thought leadership'
  | 'Career visibility and personal brand'
  | 'Protecting my reputation online'
  | 'Winning more business by being found by AI engines'
  | 'Understanding where I currently stand in AI search'
  | 'Beating a specific competitor'
  | '';

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
  consent: false,
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  sessionId: '',
  timestamp: '',
};
