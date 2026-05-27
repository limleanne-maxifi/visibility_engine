'use client';

import { FormData, AiPresence, CompetitiveStanding } from '@/lib/types';
import ChoiceCard from '@/components/ChoiceCard';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const AI_PRESENCE_OPTIONS: AiPresence[] = [
  "No, I haven't tried this yet",
  'Yes — and the results were accurate',
  "Yes — but I wasn't mentioned at all",
  'Yes — but details about me were wrong',
  'Yes — competitors were cited instead of me',
  'Yes — but old/outdated info appeared',
];

const COMPETITIVE_STANDING_OPTIONS: CompetitiveStanding[] = [
  'I usually show up — and ahead of competitors',
  'I show up about as often as competitors',
  'Competitors often show up ahead of me',
  'Competitors show up, I rarely do',
  "Not sure — I haven't looked into this",
];

export default function Step3Awareness({ data, onChange, onNext, onBack, errors }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl text-gray-900 mb-6">Your AI presence today</h1>

      {/* Signal 1 — Platform presence */}
      <fieldset className="mb-6">
        <legend className="text-[17px] text-gray-700 mb-3">
          Have you ever searched for yourself or your business in an AI tool like ChatGPT or Perplexity?{' '}
          <span className="text-red-500">*</span>
        </legend>
        <div className="space-y-2">
          {AI_PRESENCE_OPTIONS.map((option) => (
            <ChoiceCard
              key={option}
              label={option}
              selected={data.aiPresence === option}
              onSelect={() => onChange({ aiPresence: option })}
            />
          ))}
        </div>
        {errors.aiPresence && (
          <p className="mt-1 text-xs text-red-500">{errors.aiPresence}</p>
        )}
      </fieldset>

      {/* Signal 2 — Competitive displacement */}
      <fieldset className="mb-6">
        <legend className="text-[17px] text-gray-700 mb-1">
          When AI tools recommend options in your category, how often do you think you come up?{' '}
          <span className="text-red-500">*</span>
        </legend>
        <p className="text-xs text-gray-400 mb-3">Best estimate is fine — your full report measures this precisely.</p>
        <div className="space-y-2">
          {COMPETITIVE_STANDING_OPTIONS.map((option) => (
            <ChoiceCard
              key={option}
              label={option}
              selected={data.competitiveStanding === option}
              onSelect={() => onChange({ competitiveStanding: option })}
            />
          ))}
        </div>
        {errors.competitiveStanding && (
          <p className="mt-1 text-xs text-red-500">{errors.competitiveStanding}</p>
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
          className="flex-1 py-3 px-6 bg-[#C87A2F] hover:bg-[#A8651E] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Continue →
        </button>
      </div>
    </form>
  );
}
