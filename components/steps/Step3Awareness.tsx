'use client';

import { FormData, AiPresence, AiPlatform } from '@/lib/types';
import ChoiceCard from '@/components/ChoiceCard';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const AI_PRESENCE_OPTIONS: AiPresence[] = [
  'Yes — and the results were accurate',
  'Yes — but results were wrong or missing',
  "No, I haven't tried this yet",
];

const AI_PLATFORMS: AiPlatform[] = [
  'ChatGPT',
  'Google AI Overviews',
  'Perplexity',
  'Microsoft Copilot',
  'Other',
];

export default function Step3Awareness({ data, onChange, onNext, onBack, errors }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Your AI presence today</h1>

      {/* Group A */}
      <fieldset className="mb-6">
        <legend className="text-sm font-medium text-gray-700 mb-3">
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

      {/* Group B */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-3">
          Which AI platform matters most to you?{' '}
          <span className="text-red-500">*</span>
        </legend>
        <div className="space-y-2">
          {AI_PLATFORMS.map((platform) => (
            <ChoiceCard
              key={platform}
              label={platform}
              selected={data.aiPlatform === platform}
              onSelect={() => onChange({ aiPlatform: platform })}
            />
          ))}
        </div>
        {errors.aiPlatform && (
          <p className="mt-1 text-xs text-red-500">{errors.aiPlatform}</p>
        )}

        {/* Inline "Other" text input */}
        {data.aiPlatform === 'Other' && (
          <input
            type="text"
            value={data.aiPlatformOther}
            onChange={(e) => onChange({ aiPlatformOther: e.target.value })}
            placeholder="Which platform?"
            className="mt-2 w-full px-4 py-3 rounded-lg border border-[#534AB7] bg-[#EEEDFE] text-sm outline-none focus:border-[#534AB7] transition-colors"
            autoFocus
          />
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
