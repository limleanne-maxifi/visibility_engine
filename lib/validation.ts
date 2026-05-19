import { z } from 'zod';
import { INDUSTRY_BENCHMARKS } from '@/lib/scoring';

// ─── Source-of-truth enum arrays ──────────────────────────────────────────────
// Derived from lib/types.ts and lib/scoring.ts so that adding a new value
// in either source file automatically propagates to validation.

// Occupation values minus the empty-string initial state
export const VALID_OCCUPATIONS = [
  'Executive / Founder',
  'Marketing & Communications',
  'Sales & Business Development',
  'Operations & Strategy',
  'Technology & Digital',
  'Finance',
  'Product & Innovation',
  'Other',
] as const;

// AiPresence values minus the empty-string initial state
export const VALID_AWARENESS_VALUES = [
  "No, I haven't tried this yet",
  'Yes — and the results were accurate',
  "Yes — but I wasn't mentioned at all",
  'Yes — but details about me were wrong',
  'Yes — competitors were cited instead of me',
  'Yes — but old/outdated info appeared',
] as const;

// AeoOutcome values minus the empty-string initial state
export const VALID_OUTCOMES = [
  'More leads from AI-referred traffic',
  'Credibility and thought leadership',
  'Career visibility and personal brand',
  'Protecting my reputation online',
  'Winning more business by being found by AI engines',
  'Understanding where I currently stand in AI search',
  'Beating a specific competitor',
] as const;

// Industry keys from INDUSTRY_BENCHMARKS — single source of truth
const industryKeys = Object.keys(INDUSTRY_BENCHMARKS) as [string, ...string[]];
export const VALID_INDUSTRIES = industryKeys;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const PlatformSchema = z.object({
  value:    z.string().min(1).max(100),
  priority: z.enum(['primary', 'secondary']),
});

// ─── GenerateSchema ───────────────────────────────────────────────────────────
// POST /api/generate

export const GenerateSchema = z.object({
  firstName:     z.string().min(1).max(100),
  email:         z.string().email().max(254),
  websiteUrl:    z.string().url().max(2048).optional().or(z.literal('')),
  occupation:    z.enum(VALID_OCCUPATIONS),
  industry:      z.enum(industryKeys),
  company:       z.string().max(200).optional(),
  aiPresence:    z.enum(VALID_AWARENESS_VALUES),
  platforms:     z.array(PlatformSchema).min(1).max(2),
  challenges:    z.array(z.string().max(200)).min(1).max(2),
  aeoOutcome:    z.enum(VALID_OUTCOMES),
  competitors:   z.string().max(500).optional(),
  positioning:   z.string().max(1000).optional(),
  targetQueries: z.string().max(1000).optional(),
  consent:       z.literal(true),
  utmSource:     z.string().max(200).optional(),
  utmMedium:     z.string().max(200).optional(),
  utmCampaign:   z.string().max(200).optional(),
});

export type GenerateInput = z.infer<typeof GenerateSchema>;

// ─── GateSchema ───────────────────────────────────────────────────────────────
// POST /api/gate

export const GateSchema = z.object({
  email:       z.string().email().max(254),
  snapshot_id: z.string().uuid(),
});

export type GateInput = z.infer<typeof GateSchema>;

// ─── GateResendSchema ─────────────────────────────────────────────────────────
// POST /api/gate/resend

export const GateResendSchema = z.object({
  email: z.string().email().max(254),
});

export type GateResendInput = z.infer<typeof GateResendSchema>;

// ─── CheckoutSchema ───────────────────────────────────────────────────────────
// POST /api/stripe/checkout

export const CheckoutSchema = z.object({
  snapshot_id: z.string().uuid(),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;

// ─── AdminKeySchema ───────────────────────────────────────────────────────────
// For header validation on admin-only endpoints

export const AdminKeySchema = z.object({
  key: z.string().min(32),
});

export type AdminKeyInput = z.infer<typeof AdminKeySchema>;

// ─── Text sanitisation ────────────────────────────────────────────────────────

export function sanitiseText(input: string): string {
  return input
    .replace(/\x00/g, '')          // strip null bytes
    .normalize('NFC')              // normalise unicode
    .trim()
    .replace(/\n{4,}/g, '\n\n');   // collapse 4+ newlines to 2
}

// ─── Injection warning (log only — never blocks) ──────────────────────────────

const INJECTION_PATTERNS = [
  'ignore previous',
  'disregard',
  'system prompt',
  'you are now',
  'act as',
];

export function warnIfInjectionAttempt(field: string, value: string): void {
  const lower = value.toLowerCase();
  if (INJECTION_PATTERNS.some((p) => lower.includes(p))) {
    console.warn('[security] possible injection attempt in field:', field);
  }
}
