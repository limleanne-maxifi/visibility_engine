'use client';

import { useState, useEffect, useRef } from 'react';
import { FormData, AeoOutcome } from '@/lib/types';
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

const AEO_CHALLENGES = [
  "My competitors show up, I don't",
  'I want to appear for specific topics',
  "AI systems don't mention me at all",
  'AI gets my details wrong',
  "I don't know where to start",
];

const AEO_OUTCOMES: AeoOutcome[] = [
  'More leads from AI-referred traffic',
  'Credibility and thought leadership',
  'Career visibility and personal brand',
  'Protecting my reputation online',
  'Winning more business by being found by AI engines',
  'Understanding where I currently stand in AI search',
  'Beating a specific competitor',
];

// ─── Industry family mapping ──────────────────────────────────────────────────

type IndustryFamily = 'aviation' | 'tech' | 'b2b';

const AVIATION = new Set(['Aviation & Aerospace', 'Defense']);
const TECH = new Set([
  'B2B SaaS / Enterprise Software',
  'Cybersecurity',
  'Cloud Infrastructure',
  'AI & Machine Learning',
  'Fintech / Financial Technology',
  'Marketing Technology',
]);

function getFamily(industry: string): IndustryFamily {
  if (AVIATION.has(industry)) return 'aviation';
  if (TECH.has(industry)) return 'tech';
  return 'b2b';
}

// ─── Rotating examples ───────────────────────────────────────────────────────

const POSITIONING_EXAMPLES: Record<IndustryFamily, [string, string, string]> = {
  aviation: [
    'The MRO partner turboprop operators rely on to keep ageing fleets airworthy',
    'The aircraft leasing advisor growth-stage carriers choose when expanding capacity',
    'The ground handling specialist trusted by low-cost carriers at high-throughput airports',
  ],
  tech: [
    'The CRM platform mid-market SaaS revenue teams choose to scale from $5M to $50M ARR',
    'The cybersecurity platform fintech compliance teams rely on under SOC 2 audit',
    'The DevOps tooling provider engineering leaders turn to when scaling beyond 50 developers',
  ],
  b2b: [
    "The firm businesses call when they need to grow and don't know where to start",
    'The trusted advisor companies rely on when navigating complex operational change',
    'The partner established businesses choose when competing in a digital-first market',
  ],
};

const TARGET_QUERIES_EXAMPLES: Record<IndustryFamily, [string, string, string]> = {
  aviation: [
    'best MRO provider for turboprop fleets · part 145 approved maintenance · heavy maintenance comparison',
    'aircraft leasing options narrow-body · wet lease vs dry lease · ACMI provider comparisons',
    'ground handling services comparison · ramp handling providers · airport services contracts',
  ],
  tech: [
    'best CRM for mid-market SaaS · revenue platforms for growth-stage teams · Salesforce alternatives',
    'best cybersecurity platform for fintech compliance · SOC 2 audit tools · security automation',
    'best DevOps tools for scaling engineering teams · CI/CD platform comparison · developer productivity',
  ],
  b2b: [
    'best business advisory firm · business growth consultants · top strategy consultancy',
    'operational change management services · business transformation advisors · change consultants',
    'digital strategy firms for established businesses · growth advisory services · business consultants',
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step4Goals({ data, onChange, onNext, onBack, errors, industry }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const family = getFamily(industry);
  const showTargetQueries = data.challenges.includes('I want to appear for specific topics');

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

  // Toggles
  const toggleChallenge = (challenge: string) => {
    const current = data.challenges;
    if (current.includes(challenge)) {
      onChange({ challenges: current.filter((c) => c !== challenge) });
    } else if (current.length < 2) {
      onChange({ challenges: [...current, challenge] });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Your goals</h1>
      <p className="text-sm text-gray-500 mb-6">
        This shapes the whole plan — take 30 seconds to be specific.
      </p>

      {/* Challenges */}
      <fieldset className="mb-6">
        <legend className="text-[17px] font-semibold text-gray-700 mb-1">
          What are your biggest AEO challenges?{' '}
          <span className="text-red-500">*</span>
        </legend>
        <p className="text-xs text-gray-400 mb-3">Select up to 2.</p>
        <div className="space-y-2">
          {AEO_CHALLENGES.map((challenge) => {
            const idx = data.challenges.indexOf(challenge);
            const isSelected = idx !== -1;
            const isDisabled = !isSelected && data.challenges.length >= 2;

            return (
              <button
                key={challenge}
                type="button"
                onClick={() => toggleChallenge(challenge)}
                disabled={isDisabled}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150 ${
                  isSelected
                    ? 'border-[#534AB7] bg-[#EEEDFE] text-[#3C3489] font-medium'
                    : isDisabled
                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-[#534AB7] bg-[#534AB7]'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    {challenge}
                  </span>
                  {isSelected && (
                    <span className="flex-shrink-0 text-xs font-bold text-[#534AB7]">
                      #{idx + 1}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {errors.challenges && (
          <p className="mt-1 text-xs text-red-500">{errors.challenges}</p>
        )}
      </fieldset>

      {/* Competitors */}
      <div className="mb-5">
        <label htmlFor="competitors" className="block text-[17px] font-semibold text-gray-700 mb-1">
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
          className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#534AB7] transition-colors"
        />
        <p className="mt-1 text-xs text-gray-400">
          Optional — add competitors to unlock side-by-side displacement analysis in your plan.
        </p>
      </div>

      {/* Positioning phrase */}
      <div className="mb-5 border-l-4 border-green-500 bg-green-50 rounded-r-lg px-4 pt-4 pb-3">
        <label htmlFor="positioning" className="block text-[17px] font-semibold text-gray-800 mb-1">
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
          <label htmlFor="targetQueries" className="block text-[17px] font-semibold text-gray-700 mb-1">
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
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#534AB7] transition-colors resize-none"
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

      {/* Outcome */}
      <fieldset className="mb-6">
        <legend className="text-[17px] font-semibold text-gray-700 mb-3">
          What outcome matters most to you?{' '}
          <span className="text-red-500">*</span>
        </legend>
        <div className="space-y-2">
          {AEO_OUTCOMES.map((outcome) => (
            <ChoiceCard
              key={outcome}
              label={outcome}
              selected={data.aeoOutcome === outcome}
              onSelect={() => onChange({ aeoOutcome: outcome })}
            />
          ))}
        </div>
        {errors.aeoOutcome && (
          <p className="mt-1 text-xs text-red-500">{errors.aeoOutcome}</p>
        )}
      </fieldset>

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
          className="flex-1 py-3 px-6 bg-[#534AB7] hover:bg-[#4640a0] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Continue →
        </button>
      </div>
    </form>
  );
}
