'use client';

import { FormData, AiPresence } from '@/lib/types';
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

const PLATFORM_OPTIONS = [
  'ChatGPT',
  'Google AI Overviews',
  'Perplexity',
  'Microsoft Copilot',
  'Claude',
  'Gemini',
  'Other',
];

export default function Step3Awareness({ data, onChange, onNext, onBack, errors }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const togglePlatform = (value: string) => {
    const current = [...data.platforms];
    const idx = current.findIndex((p) => p.value === value);

    if (idx === -1) {
      // Unselected → primary (if no primary exists), else secondary
      const hasPrimary = current.some((p) => p.priority === 'primary');
      onChange({
        platforms: [...current, { value, priority: hasPrimary ? 'secondary' : 'primary' }],
      });
    } else if (current[idx].priority === 'primary') {
      // Primary → secondary
      const updated = [...current];
      updated[idx] = { value, priority: 'secondary' };
      onChange({ platforms: updated });
    } else {
      // Secondary → deselect
      onChange({ platforms: current.filter((p) => p.value !== value) });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Your AI presence today</h1>

      {/* Group A */}
      <fieldset className="mb-6">
        <legend className="text-[17px] font-semibold text-gray-700 mb-3">
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
        <legend className="text-[17px] font-semibold text-gray-700 mb-1">
          Which AI platforms matter to you?{' '}
          <span className="text-red-500">*</span>
        </legend>
        <p className="text-xs text-gray-400 mb-3">
          Click once for PRIMARY, again for 2nd, again to deselect.
        </p>
        <div className="space-y-2">
          {PLATFORM_OPTIONS.map((platform) => {
            const entry = data.platforms.find((p) => p.value === platform);
            const rank = entry ? data.platforms.indexOf(entry) + 1 : null;
            const isSelected = !!entry;
            const isDisabled = !isSelected && data.platforms.length >= 2;

            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
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
                      className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                        isSelected
                          ? 'border-[#534AB7] bg-[#534AB7] text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && rank}
                    </span>
                    {platform}
                  </span>
                  {isSelected && (
                    <span className="text-xs text-[#534AB7] font-semibold tracking-wide uppercase">
                      {rank === 1 ? 'PRIMARY' : '2nd'}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {errors.platforms && (
          <p className="mt-1 text-xs text-red-500">{errors.platforms}</p>
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
