'use client';

import { useState, useEffect, useRef } from 'react';
import { FormData, VisibilityGap, VISIBILITY_GAP_LABELS } from '@/lib/types';
import ChoiceCard from '@/components/ChoiceCard';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Partial<Record<keyof FormData, string>>;
  industry: string;
}

// ─── Static option lists ─────────────────────────────────────────────────────

const VISIBILITY_GAPS: VisibilityGap[] = [
  'not-cited',
  'competitors-cited',
  'inaccurate-info',
  'own-queries',
  'unknown-baseline',
];

// ─── Industry family mapping ──────────────────────────────────────────────────

type IndustryFamily = 'aviation' | 'tech' | 'healthcare' | 'industrial' | 'professional' | 'b2b';

const AVIATION     = new Set(['Aviation, ATC & Aerospace', 'Aviation & Aerospace', 'Defense & Government Systems', 'Defense']);
const TECH         = new Set(['B2B SaaS / Enterprise Software', 'Cybersecurity', 'Cloud Infrastructure & DevOps', 'Cloud Infrastructure', 'AI & Machine Learning', 'Fintech / Financial Technology', 'Marketing Technology']);
const HEALTHCARE   = new Set(['Healthcare & Life Sciences', 'Healthcare Technology / Digital Health', 'Pharmaceuticals & Biotech']);
const INDUSTRIAL   = new Set(['Manufacturing & Industrial', 'Logistics & Supply Chain', 'Architecture, Engineering & Construction', 'Energy & Utilities', 'Telecommunications']);
const PROFESSIONAL = new Set(['Legal & Legal Services', 'Legal', 'Accounting & Finance', 'Financial Services & Banking', 'Insurance', 'Human Resources & Recruitment']);

function getFamily(industry: string): IndustryFamily {
  if (AVIATION.has(industry))     return 'aviation';
  if (TECH.has(industry))         return 'tech';
  if (HEALTHCARE.has(industry))   return 'healthcare';
  if (INDUSTRIAL.has(industry))   return 'industrial';
  if (PROFESSIONAL.has(industry)) return 'professional';
  return 'b2b';
}

// ─── Rotating examples ───────────────────────────────────────────────────────

const POSITIONING_EXAMPLES: Record<IndustryFamily, [string, string, string]> = {
  aviation: [
    'The ATC communication systems provider air navigation service providers turn to for safety-critical voice infrastructure',
    'The MRO partner turboprop operators rely on to keep ageing fleets airworthy and compliant',
    'The aviation safety consultancy regulators and airlines call when they need independent assurance',
  ],
  tech: [
    'The CRM platform mid-market SaaS revenue teams choose to scale from $5M to $50M ARR',
    'The cybersecurity platform fintech compliance teams rely on under SOC 2 and ISO 27001 audit',
    'The DevOps tooling provider engineering leaders turn to when scaling beyond 50 developers',
  ],
  healthcare: [
    'The clinical decision support platform hospital systems rely on to reduce diagnostic errors at scale',
    'The digital health solution NHS and health system procurement teams choose for patient engagement',
    'The healthcare data analytics partner life sciences teams use to accelerate regulatory submission',
  ],
  industrial: [
    'The supply chain visibility platform manufacturers rely on to eliminate Tier 2 supplier blind spots',
    'The energy management solution industrial facilities use to achieve ISO 50001 compliance and cut consumption',
    'The engineering consultancy infrastructure owners trust when assessing structural integrity at scale',
  ],
  professional: [
    'The employment law firm mid-sized employers call when facing workforce restructuring or tribunal risk',
    'The accounting firm technology businesses trust for R&D tax claims and international structuring',
    'The HR advisory practice scale-up founders rely on when building their first people function',
  ],
  b2b: [
    "The advisory firm businesses call when they need to grow revenue and don't know where to start",
    'The trusted partner companies rely on when navigating complex operational or strategic change',
    'The specialist consultancy established businesses choose when competing in a digital-first market',
  ],
};

const TARGET_QUERIES_EXAMPLES: Record<IndustryFamily, [string, string, string]> = {
  aviation: [
    'ATC voice communication systems · air traffic management technology vendors · VCCS systems comparison',
    'best MRO provider turboprop fleets · Part 145 approved maintenance · heavy maintenance comparison',
    'aviation safety audit firms · SMS compliance consultancy · airworthiness review specialists',
  ],
  tech: [
    'best CRM for mid-market SaaS · revenue platforms for growth-stage teams · Salesforce alternatives',
    'best cybersecurity platform fintech compliance · SOC 2 audit tools · security posture management',
    'best DevOps tools scaling engineering teams · CI/CD platform comparison · developer productivity',
  ],
  healthcare: [
    'best clinical decision support software · hospital EHR integration platforms · clinical AI tools',
    'digital patient engagement platforms · patient portal solutions · telehealth platform comparison',
    'healthcare analytics platforms · real-world evidence solutions · pharmacovigilance software',
  ],
  industrial: [
    'supply chain visibility software · supplier risk management platforms · manufacturing logistics tools',
    'energy management software industry · ISO 50001 compliance tools · industrial energy audit',
    'structural engineering consultants · civil engineering services · infrastructure assessment firms',
  ],
  professional: [
    'employment law advice for employers · workplace dispute specialists · HR legal support firms',
    'R&D tax credit specialists · international tax structuring advice · corporate tax advisors',
    'HR advisory for scale-ups · people strategy consultants · fractional HR firms',
  ],
  b2b: [
    'best business advisory firm · business growth consultants · top strategy consultancy',
    'operational change management services · business transformation advisors · change consultants',
    'digital strategy firms established businesses · growth advisory services · business consultants',
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step4Goals({ data, onChange, onNext, onBack, errors, industry }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const family = getFamily(industry);
  const showTargetQueries = data.visibilityGap === 'own-queries';

  // Positioning phrase rotation
  const [posIdx, setPosIdx] = useState(0);
  const [posVisible, setPosVisible] = useState(true);
  const posTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPosIdx(0);
    setPosVisible(true);
    const interval = setInterval(() => {
      setPosVisible(false);
      posTimerRef.current = setTimeout(() => {
        setPosIdx((i) => (i + 1) % 3);
        setPosVisible(true);
      }, 250);
    }, 3200);
    return () => {
      clearInterval(interval);
      if (posTimerRef.current) clearTimeout(posTimerRef.current);
    };
  }, [family]);

  // Target queries rotation
  const [qIdx, setQIdx] = useState(0);
  const [qVisible, setQVisible] = useState(true);
  const qTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQIdx(0);
    setQVisible(true);
    if (!showTargetQueries) return;
    const interval = setInterval(() => {
      setQVisible(false);
      qTimerRef.current = setTimeout(() => {
        setQIdx((i) => (i + 1) % 3);
        setQVisible(true);
      }, 250);
    }, 3200);
    return () => {
      clearInterval(interval);
      if (qTimerRef.current) clearTimeout(qTimerRef.current);
    };
  }, [family, showTargetQueries]);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl text-gray-900 mb-1">Your visibility gap</h1>
      <p className="text-sm text-gray-500 mb-6">
        Understanding what concerns you most helps us personalise your action plan.
      </p>

      {/* Visibility Gap */}
      <fieldset className="mb-6">
        <legend className="text-[17px] text-gray-700 mb-3">
          What visibility gap concerns you most right now?{' '}
          <span className="text-red-500">*</span>
        </legend>
        <div className="space-y-2">
          {VISIBILITY_GAPS.map((gap) => (
            <ChoiceCard
              key={gap}
              label={VISIBILITY_GAP_LABELS[gap]}
              selected={data.visibilityGap === gap}
              onSelect={() => onChange({ visibilityGap: gap })}
            />
          ))}
        </div>
        {errors.visibilityGap && (
          <p className="mt-1 text-xs text-red-500">{errors.visibilityGap}</p>
        )}
      </fieldset>

      {/* Competitors */}
      <div className="mb-5">
        <label htmlFor="competitors" className="block text-[17px] text-gray-700 mb-1">
          Who shows up when your customers search for what you do?{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="competitors"
          type="text"
          name="x-competitors"
          value={data.competitors}
          onChange={(e) => onChange({ competitors: e.target.value })}
          placeholder="Your closest competitors by name"
          autoComplete="new-password"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand-gold transition-colors"
        />
        <p className="mt-1 text-xs text-gray-400">
          Optional — add competitors to unlock side-by-side displacement analysis in your plan.
        </p>
      </div>

      {/* Positioning phrase */}
      <div className="mb-5 border-l-4 border-green-500 bg-green-50 rounded-r-lg px-4 pt-4 pb-3">
        <label htmlFor="positioning" className="block text-[17px] text-gray-800 mb-1">
          In one phrase, what do you want to be known for in AI answers?
        </label>
        <p className="text-xs text-gray-500 mb-2">
          This single input shapes your positioning analysis, content recommendations, and
          competitor framing. Be specific.
        </p>
        <textarea
          id="positioning"
          name="x-positioning"
          rows={2}
          value={data.positioning}
          onChange={(e) => onChange({ positioning: e.target.value })}
          placeholder="Your positioning phrase…"
          autoComplete="new-password"
          className="w-full px-3 py-2 rounded-lg border border-green-200 bg-white text-sm outline-none focus:border-green-500 transition-colors resize-none"
        />
        <p
          className={`mt-1 text-xs text-gray-400 italic transition-opacity duration-200 ${
            posVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          e.g. &ldquo;{POSITIONING_EXAMPLES[family][posIdx]}&rdquo;
        </p>
      </div>

      {/* Target queries — conditional on 'I want to appear for specific topics' */}
      {showTargetQueries && (
        <div className="mb-5">
          <label htmlFor="targetQueries" className="block text-[17px] text-gray-700 mb-1">
            Which 2–3 queries or topics do you most want to win?{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="targetQueries"
            name="x-target-queries"
            rows={3}
            value={data.targetQueries}
            onChange={(e) => onChange({ targetQueries: e.target.value })}
            placeholder="Your target queries…"
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand-gold transition-colors resize-none"
          />
          <p
            className={`mt-1 text-xs text-gray-400 italic transition-opacity duration-200 ${
              qVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            e.g. &ldquo;{TARGET_QUERIES_EXAMPLES[family][qIdx]}&rdquo;
          </p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 px-6 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="flex-1 py-3 px-6 bg-brand-gold hover:bg-brand-gold-hover text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Continue →
        </button>
      </div>
    </form>
  );
}
