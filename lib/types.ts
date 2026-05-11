export type Occupation =
  | 'Individual / Personal brand'
  | 'Business owner'
  | 'Organisation leader'
  | 'Conference speaker'
  | 'Sales professional'
  | 'Conference delegate'
  | 'Independent consultant'
  | 'Academic or researcher'
  | 'Coach or trainer'
  | 'Other'
  | '';

export type AiPresence =
  | 'Yes — and the results were accurate'
  | 'Yes — but results were wrong or missing'
  | "No, I haven't tried this yet"
  | '';

export type AiPlatform =
  | 'ChatGPT'
  | 'Google AI Overviews'
  | 'Perplexity'
  | 'Microsoft Copilot'
  | 'Other'
  | '';

export type AeoChallenge =
  | "AI systems don't mention me at all"
  | 'AI gets my details wrong'
  | "My competitors show up, I don't"
  | "I don't know where to start"
  | 'I want to appear for specific topics'
  | '';

export type AeoOutcome =
  | 'More leads from AI-referred traffic'
  | 'Credibility and thought leadership'
  | 'Career visibility and personal brand'
  | 'Protecting my reputation online'
  | 'Winning more deals by being findable'
  | '';

export interface FormData {
  // Step 1 — Identity
  firstName: string;
  email: string;
  website: string;

  // Step 2 — Professional Context
  occupation: Occupation;
  industry: string;
  company: string;

  // Step 3 — AEO Awareness
  aiPresence: AiPresence;
  aiPlatform: AiPlatform;
  aiPlatformOther: string;

  // Step 4 — Goals
  aeoChallenge: AeoChallenge;
  aeoOutcome: AeoOutcome;

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
  website: '',
  occupation: '',
  industry: '',
  company: '',
  aiPresence: '',
  aiPlatform: '',
  aiPlatformOther: '',
  aeoChallenge: '',
  aeoOutcome: '',
  consent: false,
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  sessionId: '',
  timestamp: '',
};
