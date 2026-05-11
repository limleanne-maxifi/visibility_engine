'use client';

import { FormData, AeoChallenge, AeoOutcome } from '@/lib/types';
import ChoiceCard from '@/components/ChoiceCard';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const AEO_CHALLENGES: AeoChallenge[] = [
  "AI systems don't mention me at all",
  'AI gets my details wrong',
  "My competitors show up, I don't",
  "I don't know where to start",
  'I want to appear for specific topics',
];

const AEO_OUTCOMES: AeoOutcome[] = [
  'More leads from AI-referred traffic',
  'Credibility and thought leadership',
  'Career visibility and personal brand',
  'Protecting my reputation online',
  'Winning more deals by being findable',
];

export default function Step4Goals({ data, onChange, onNext, onBack, errors }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Your goals</h1>
      <p className="text-sm text-gray-500 mb-6">
        Two quick questions — this shapes the whole plan.
      </p>

      {/* Group A */}
      <fieldset className="mb-6">
        <legend className="text-sm font-medium text-gray-700 mb-3">
          What&apos;s your biggest AEO challenge right now?{' '}
          <span className="text-red-500">*</span>
        </legend>
        <div className="space-y-2">
          {AEO_CHALLENGES.map((challenge) => (
            <ChoiceCard
              key={challenge}
              label={challenge}
              selected={data.aeoChallenge === challenge}
              onSelect={() => onChange({ aeoChallenge: challenge })}
            />
          ))}
        </div>
        {errors.aeoChallenge && (
          <p className="mt-1 text-xs text-red-500">{errors.aeoChallenge}</p>
        )}
      </fieldset>

      {/* Group B */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-3">
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
